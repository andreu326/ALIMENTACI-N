# MealPrep Planner

Aplicación web para planificar comidas, macronutrientes y gastos de alimentación. Conecta recetas, cantidades, formatos reales de supermercado y un calendario de reposición para estimar el dinero que sale de caja.

## Funcionalidades

- Plan semanal con desayuno, almuerzo, cena y café separados.
- Cálculo automático de calorías, proteínas, carbohidratos y grasas.
- Biblioteca editable de ingredientes, precios y formatos de compra.
- Costos por porción, semana y mes.
- Calendario de compras desde el viernes 7 de agosto de 2026.
- Proyección de caja durante 11 meses considerando sobrantes y reposiciones.
- Persistencia local en el navegador.
- Diseño responsive para escritorio y móvil.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Verificación

```bash
npx tsc --noEmit
npm run build
```

## Estructura

- `app/`: página principal y estilos.
- `components/`: dashboard, planificador, recetas, ingredientes y compras.
- `data/seed.ts`: plan de alimentación inicial.
- `utils/mealprep-calculations.ts`: macros, costos y proyección de compras.
- `database/schema.sql`: esquema inicial opcional para Supabase.

Los precios son estimaciones ingresadas manualmente y pueden cambiar según supermercado, ubicación y promociones.
