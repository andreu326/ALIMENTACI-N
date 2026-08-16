# MealPrep

Plan de comidas, macros y viajes a Central Mayorista. El objetivo no es sólo
gastar menos: es **ir al supermercado la menor cantidad de veces posible** sin
salirse del presupuesto ni de los macros.

## Qué resuelve

Con la canasta original eran 48 viajes en 11 meses y $2.764.530. Con los precios
y formatos actuales son **12 viajes y $1.265.350**, más la feria aparte.

La diferencia sale de tres cosas:

1. **Precios reales.** Los precios del catálogo de centralmayorista.cl están
   verificados producto por producto (7-ago-2026).
2. **Mínimos de compra.** 344 de 605 SKU revisados exigen llevar más de un pack.
   Ignorarlo desviaba el presupuesto hasta en 3× en algunos productos.
3. **Vida útil.** La cadencia de viajes no la fija el dinero, la fija el primer
   ingrediente que se echa a perder.

## Modelo

- `data/seed.ts` — ingredientes con precio, formatos, `minQty`, `shelfLifeDays`
  y `source` (`mayorista` / `feria` / `aparte`). Sólo `mayorista` genera viajes.
- `utils/mealprep-calculations.ts` — macros, elección de formato y simulación de
  viajes.
- `types/mealprep.ts` — tipos del dominio.

### Estrategia de formato

`pickFormat` acepta dos criterios:

- `value` (por defecto) — minimiza el **precio por unidad**. Correcto en régimen,
  porque el horizonte de compra ya viene recortado por la vida útil y el sobrante
  nunca se pierde.
- `cash` — minimiza el **desembolso del día**. Sirve cuando la restricción es la
  caja de ese viernes y no el costo total.

## Cadencia

El primer viaje se configura aparte del resto, porque su restricción suele ser
otra: cuánta plata sale ese día, no cuánto cuesta el año.

| arranque | primera compra | cubre |
|---|---|---|
| Parche | $73.380 | 7 días |
| Completo | $137.420 | 30 días |

| después | viajes | 11 meses |
|---|---|---|
| Semanal | 48 | $1.198.700 |
| Quincenal | 23 | $1.218.910 |
| Mensual | 12 | $1.217.220 |

Quincenal cuesta lo mismo que mensual con el doble de viajes, así que no tiene
sentido. Semanal ahorra ~$18.500 en once meses a cambio de 36 viajes más: unos
$500 por viaje evitado.

Todas las pantallas leen el plan con `getPlan(state, …)`. No deben llamar a
`getTripPlan` con parámetros propios: si cada una elige los suyos, el resumen y
el detalle terminan mostrando cifras distintas.

## Bitácora

El plan es una proyección; la app compara esa proyección con lo que realmente
pasa.

- **Viajes** — cada uno se marca `pendiente` / `hecho` / `saltado`. Al marcarlo
  como hecho guarda lo efectivamente marcado en la lista, así se ve el desvío
  acumulado contra el plan.
- **Peso y medidas** — pesajes y circunferencias fechados. La proyección se
  dibuja punteada y encima va la curva real.
- **Comidas** — cada comida del plan se marca como comida, y lo que se come
  fuera del plan se agrega aparte. Los anillos muestran lo **consumido**, no lo
  planificado: parten en cero cada día y suben al registrar.
- **Precios** — al marcar un ítem se puede corregir lo que costó en caja. El
  plan completo se recalcula con ese precio.

### Sugerencia de porciones

Compara el ritmo real de los pesajes con un rango sano de ganancia (0,25-0,5 %
del peso corporal por semana) y propone sumar o restar gramos de arroz y pollo.

**Nunca se aplica sola.** Muestra el número, el porqué, y el usuario decide.
Necesita al menos dos semanas de pesajes para no reaccionar a ruido de agua y sal.

### Proyección de peso

Mifflin-St Jeor para el metabolismo basal, por multiplicador de actividad para
el gasto total, y ~7.700 kcal por kilo de tejido.

El gasto **se recalcula cada semana con el peso nuevo**. Extrapolar el superávit
inicial de forma lineal sobreestima la ganancia bastante: al engordar el cuerpo
gasta más y la curva se aplana sola. Con un superávit inicial de +417 kcal la
regla lineal da +18,2 kg en 11 meses; el modelo iterativo da +13,8.

Es una estimación, no una promesa. Por eso la app pide registrar el peso y
muestra el desvío entre lo proyectado y lo real.

## Cocina

Cada receta declara su `prepMode`:

- `batch` — se cocina una vez para toda la semana y los pasos son de la tanda.
- `daily` — se hace fresco cada día y los pasos son de **una porción**. Los huevos
  fritos no aguantan tanda, así que forzarlos al molde semanal no servía de nada.

En las recetas `daily` los marcadores sin barra ya se resuelven por porción, y la
sesión de tanda las excluye del cálculo de tiempo.

El tiempo de la sesión **no es la suma de las recetas**: mientras hierven las
papas y las lentejas se pica y se saltea lo demás. `getBatchSession` lo estima
como el mayor tiempo total de una receta más el trabajo activo de las otras —
2 h 25 de reloj contra 1 h 35 de trabajo real.

Cada receta trae `steps` con minutos y marca de espera pasiva, `storage` (cómo
guardar lo que sobra y cuánto aguanta) y `daily` (qué hacer cada día con la
porción).

### El pote manda

Los potes de meal prep son de 700 ml (`containerMl`) y esa restricción decide el
plan, no al revés. El plan anterior no cabía: el almuerzo daba 768 ml.

Se apunta a ~670 ml y no a 700: llenar al ras deja el pote sin margen para tapar.

Cada ingrediente tiene `densityCooked`, así que el plato se mide en mililitros y
no en gramos. Los fideos pesan 180 g y ocupan 256 ml; la salsa pesa 334 g y ocupa
336 ml. Lo que llena el pote es el volumen.

| plato | volumen |
|---|---|
| Arroz con pollo a la crema | 672 / 700 ml |
| Fideos con carne y queso crema | 683 / 700 ml |

El desayuno se come al momento y no ocupa pote, así que es donde se cierra lo que
no cabe en los otros dos. **No hay colación**: con potes de 700 ml los dos platos
cargan las calorías solos.

### Los objetivos no son consistentes

`140 P × 4 + 360 C × 4 + 65 G × 9 = 2.585 kcal`, no 2.700. Faltan 115 kcal, así
que **los cuatro objetivos no se pueden cumplir a la vez**. Para llegar a 2.700
con esa proteína y esos carbos, la grasa tiene que ser 78 g. El plan apunta a esa
cifra coherente y por eso "se pasa" de los 65 declarados.

### Crudo contra cocido

Las cantidades del plan son **en crudo**, que es como se compra y como se pesa.
Sirviendo desde la olla eso no sirve: 200 g de arroz crudo son más de medio kilo
en el plato. Cada ingrediente tiene `cookedYield` y cada línea de receta un
`component`, así que la pantalla puede mostrar el reparto real del plato.

| plato | reparto |
|---|---|
| Almuerzo | 544 g de arroz + 224 g de pollo salteado |
| Cena | 592 g de puré + 258 g de guiso |
| Desayuno | 180 g de marraqueta + 125 g de huevos + 120 g de base |

Rendimientos usados: arroz 2,7× · lentejas 2,4× · papas 0,98× · pollo 0,72× ·
molida 0,70× · cebolla 0,6× · salsa 0,75× · huevo 50 g por unidad.

Los pasos **no llevan los gramos escritos a mano**: usan marcadores que
`renderStep` reemplaza por la cantidad real de la receta.

    {arroz}       total de la tanda
    {arroz/}      por porción
    {arroz*2|L}   total × 2, forzado a litros (el agua del arroz)
    {porciones}   cuántos envases salen
    {plato:Puré}  gramos servidos de esa parte, ya cocida

Sin esto, aceptar la sugerencia de porciones dejaba las instrucciones mintiendo:
la receta pasaba a 1.610 g de arroz y el paso seguía diciendo 1.400 g. Las notas de conservación no son decorativas: el arroz cocido no pasa
de 4 días refrigerado por riesgo de *Bacillus cereus*, así que la receta indica
congelar 3 de los 7 envases.

## Interfaz

Cuatro pantallas más el detalle de viaje y el perfil, mobile-first para iPhone 14 Pro:

- **Hoy** — tira de días, anillos de macros, evolución de peso, comidas del día
  con ilustraciones, y la próxima compra.
- **Cocina** — orden de la tanda, cantidades totales y paso a paso marcable.
- **Viajes** — calendario mensual con el estado de cada viaje, o vista de lista,
  más el desglose de feria.
- **Despensa** — precios por kilo, formatos y mínimos de compra.

El sistema visual está en `app/globals.css` y los principios en `.impeccable.md`:
oscuro monocromático, acabado mate, jerarquía sólo por luminosidad.

## Protección

La app está publicada en Vercel y el acceso pasa por `middleware.ts`, que corre en
el Edge **antes de servir el HTML**: sin cookie de sesión válida el navegador no
recibe la página. No es una cortina de JavaScript.

Vercel sólo ofrece protección con contraseña en Enterprise o con el add-on de
$150/mes en Pro, así que esto la reemplaza sin costo.

Hay que definir dos variables de entorno en Vercel (Project Settings →
Environment Variables) y volver a desplegar:

| variable | qué es |
|---|---|
| `APP_PASSWORD` | la clave con la que entras |
| `AUTH_SECRET` | secreto para firmar la cookie: `openssl rand -base64 32` |

Sin ellas la app **se cierra en producción** y la pantalla de entrada explica qué
falta. En desarrollo sí deja pasar, para no exigir configuración local.

Antes fallaba abierta y el resultado fue un sitio público en Vercel que parecía
protegido. Un portón que se abre solo cuando está mal configurado no es un portón.

La cookie es `httpOnly`, `sameSite=lax`, `secure` en producción, firmada con
HMAC-SHA256 y con un mes de vigencia. El endpoint de entrada corta a los 8
intentos fallidos por IP durante 10 minutos.

## Riesgos conocidos

- **Los datos viven sólo en el navegador.** No hay servidor ni sincronización.
  Safari borra el almacenamiento de sitios que no se visitan por siete días, así
  que la exportación en Despensa → Respaldo no es opcional: es la única copia.
- **La clave es de cuatro dígitos.** Diez mil combinaciones. El limitador corta a
  los 8 intentos por IP, pero vive en memoria de la función Edge y se reinicia.
- **El plan sólo se edita en el código.** Recetas, cantidades e ingredientes se
  cambian en `data/seed.ts`. Desde la app sólo se corrigen precios y porciones.
- **`PLAN_START` está fijo** en `data/seed.ts`. El calendario se reancla cuando
  se marca un viaje como hecho en otra fecha, pero el arranque sigue siendo esa
  constante.

## Ejecutar

```bash
cp .env.example .env.local   # y completa las dos variables
npm install && npm run dev
```

## Verificar

```bash
npx tsc --noEmit && npm run build
```

## Advertencias

- Los precios son del catálogo online y pueden variar en sala. Papas, cebolla y
  ajo van a la feria y no tienen precio verificado.
- Central Mayorista exige membresía de comerciante.
- La receta de cena arrastra 9 g de sal al día desde la versión original, sobre
  el límite de la OMS. Está anotado en el ingrediente.
