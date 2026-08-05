# MealPrep Planner — arquitectura de producto

## Objetivo

Convertir una planificación semanal de recetas en tres resultados sincronizados: nutrición planificada, costo real y compras recomendadas. Ningún macro ni costo de receta se ingresa manualmente; siempre se deriva de ingredientes y formatos de compra.

## Arquitectura de aplicación

```text
app/                     Rutas, layouts y pantallas del App Router
components/
  ui/                    Primitivas reutilizables
  dashboard/             Indicadores y visualizaciones
  planner/               Semana, días y comidas
  ingredients/           Catálogo y formatos de compra
  recipes/               Editor y cálculos de recetas
  shopping/              Lista y proyección de compras
hooks/                   Estado e interacciones de cliente
lib/                     Configuración y utilidades transversales
services/                Acceso a datos y casos de uso
types/                   Contratos TypeScript
utils/                   Cálculos puros de nutrición, costos y unidades
database/                Esquema, migraciones y tipos de Supabase
```

La interfaz consume servicios tipados. Los servicios leen y escriben en Supabase. Los cálculos puros viven en `utils` para poder probarlos sin React ni base de datos. En el cliente, TanStack Query puede administrar caché y mutaciones optimistas cuando se conecte Supabase.

## Modelo de datos

Todas las tablas incluyen `id uuid`, `created_at timestamptz` y `updated_at timestamptz`. Las tablas de usuario incluyen `user_id uuid -> auth.users.id` y políticas RLS por propietario.

| Tabla | Campos principales | Relaciones |
| --- | --- | --- |
| `profiles` | `display_name`, `locale`, `currency` | 1:1 con `auth.users` |
| `nutrition_targets` | `calories`, `protein_g`, `carbs_g`, `fat_g`, `meals_per_day`, `days_per_week` | N:1 con usuario; una activa |
| `ingredients` | `name`, `category`, `base_unit`, `nutrition_basis`, macros, `brand`, `notes` | N:1 con usuario |
| `purchase_formats` | `label`, `quantity`, `unit`, `price`, `is_preferred` | N:1 con ingrediente |
| `recipes` | `name`, `category`, `servings`, `prep_minutes`, `notes` | N:1 con usuario |
| `recipe_ingredients` | `quantity`, `unit` | N:1 receta, N:1 ingrediente |
| `weekly_plans` | `week_start`, `status` | N:1 con usuario |
| `planned_meals` | `meal_date`, `slot`, `servings`, `position` | N:1 plan, N:1 receta |
| `shopping_overrides` | `quantity_purchased`, `checked`, `note` | N:1 plan, N:1 ingrediente |

### Relaciones y reglas

```text
User ──< Ingredients ──< Purchase formats
  │             ^
  ├──< Recipes ─┴──< Recipe ingredients
  │
  ├──< Nutrition targets
  │
  └──< Weekly plans ──< Planned meals >── Recipe
                    └──< Shopping overrides >── Ingredient
```

- Macros de receta = suma de cada ingrediente normalizado a su base nutricional.
- Costo consumido = cantidad usada × mejor precio unitario del formato preferido.
- Requerimiento semanal = suma de ingredientes de todas las porciones planificadas.
- Compra recomendada = combinación de formatos que cubre el requerimiento con menor costo; en empate, menor sobrante.
- Próxima compra = fecha de inicio + semanas completas que cubre la cantidad adquirida según consumo semanal.
- Los totales se calculan en el dominio; una vista materializada o función SQL puede agregarlos cuando el volumen lo justifique.

## Navegación

```text
/                  Dashboard: costo, macros, alertas y semana actual
/planner           Plan semanal editable y duplicación de comidas
/recipes           Biblioteca y editor de recetas
/ingredients       Ingredientes y formatos de compra
/shopping          Lista consolidada y proyección de reposición
/settings/targets  Objetivos nutricionales
```

La navegación principal permanece visible en escritorio y pasa a una barra inferior en móvil. `⌘K` abre búsqueda/acciones. Las ediciones frecuentes ocurren inline; los formularios largos usan panel lateral.

## Entrega por módulos

1. Base visual, navegación y dashboard con dominio tipado.
2. Objetivos e ingredientes con formatos de compra.
3. Recetas con cálculo automático.
4. Planner semanal con duplicación y arrastre.
5. Compras, optimización de formatos y proyección.
6. Supabase Auth, persistencia, RLS y pruebas de integración.

## Decisiones visuales

- Paleta: `#F7F8F3` lienzo, `#FFFFFF` superficie, `#17223B` tinta, `#57745A` perejil, `#F07A5A` alerta y `#D9DED4` borde.
- Tipografía: Manrope para interfaz; IBM Plex Mono para dinero, macros y metadatos.
- Firma: una tira semanal de siete segmentos que funciona como navegación y como lectura inmediata del balance costo/nutrición.
- Movimiento: una única entrada escalonada corta y transiciones de estado; se respeta `prefers-reduced-motion`.
