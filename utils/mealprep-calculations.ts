import type {
  Ingredient, MealPrepState, Profile, PurchaseFormat, Recipe, RecipeTotals,
  BatchLine, BatchRecipe, ConsumedTotals, MeasurementSite, MeasurementTrend,
  PlateComponent, PortionSuggestion,
  ShoppingLine, Trip, TripItem, TripPlan,
  WeightPoint, WeightProjection,
} from "@/types/mealprep";

export const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function ingredientUnitCost(ingredient: Ingredient): number {
  let cheapest = Number.POSITIVE_INFINITY;
  for (const format of ingredient.formats) {
    if (format.quantity > 0) cheapest = Math.min(cheapest, format.price / format.quantity);
  }
  return Number.isFinite(cheapest) ? cheapest : 0;
}

/**
 * `value` — minimiza el precio por unidad. Es lo correcto en régimen: el sobrante
 *   no se pierde porque el horizonte de compra ya viene recortado por la vida útil.
 * `cash` — minimiza el desembolso del día. Sirve cuando la restricción es la caja
 *   de ese viernes y no el costo total.
 */
export type FormatStrategy = "value" | "cash";

export function pickFormat(
  ingredient: Ingredient,
  need: number,
  strategy: FormatStrategy = "value",
  /** Consumo diario. Si se entrega, descarta envases que se echarían a perder. */
  dailyUse?: number,
) {
  let best: {
    format: PurchaseFormat; packages: number; purchased: number;
    cost: number; unitCost: number; forcedByMinimum: boolean;
  } | null = null;

  // Un envase que dura más que su vida útil abierto es dinero tirado, por muy
  // barato que salga el kilo. Si ninguno califica se usan todos igual.
  let usable = ingredient.formats;
  if (dailyUse && dailyUse > 0 && ingredient.openLifeDays > 0) {
    const maxQty = dailyUse * ingredient.openLifeDays;
    const fits = ingredient.formats.filter((f) => f.quantity <= maxQty);
    if (fits.length > 0) usable = fits;
  }

  for (const format of usable) {
    if (format.quantity <= 0) continue;
    const byNeed = Math.max(1, Math.ceil(need / format.quantity));
    const packages = Math.max(format.minQty, byNeed);
    const purchased = packages * format.quantity;
    const cost = packages * format.price;
    const candidate = {
      format, packages, purchased, cost,
      unitCost: format.price / format.quantity,
      forcedByMinimum: packages > byNeed,
    };
    if (!best) { best = candidate; continue; }

    const better = strategy === "value"
      ? candidate.unitCost < best.unitCost
        || (candidate.unitCost === best.unitCost && candidate.cost < best.cost)
      : candidate.cost < best.cost
        || (candidate.cost === best.cost && candidate.purchased < best.purchased);
    if (better) best = candidate;
  }
  return best;
}

export function getRecipeTotals(recipe: Recipe, ingredients: Ingredient[]): RecipeTotals {
  const map = new Map(ingredients.map((i) => [i.id, i]));
  const totals: RecipeTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };
  for (const line of recipe.ingredients) {
    const ingredient = map.get(line.ingredientId);
    if (!ingredient || ingredient.nutritionBasis <= 0) continue;
    const factor = line.quantity / ingredient.nutritionBasis;
    totals.calories += ingredient.calories * factor;
    totals.protein += ingredient.protein * factor;
    totals.carbs += ingredient.carbs * factor;
    totals.fat += ingredient.fat * factor;
    totals.cost += ingredientUnitCost(ingredient) * line.quantity;
  }
  return {
    calories: round(totals.calories),
    protein: round(totals.protein, 1),
    carbs: round(totals.carbs, 1),
    fat: round(totals.fat, 1),
    cost: round(totals.cost),
  };
}

export function getDailyTotals(state: MealPrepState, day: number): RecipeTotals {
  const recipes = new Map(state.recipes.map((r) => [r.id, r]));
  const totals: RecipeTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };
  for (const meal of state.plannedMeals) {
    if (meal.day !== day) continue;
    const recipe = recipes.get(meal.recipeId);
    if (!recipe || recipe.servings <= 0) continue;
    const t = getRecipeTotals(recipe, resolvedIngredients(state));
    const factor = meal.servings / recipe.servings;
    totals.calories += t.calories * factor;
    totals.protein += t.protein * factor;
    totals.carbs += t.carbs * factor;
    totals.fat += t.fat * factor;
    totals.cost += t.cost * factor;
  }
  return {
    calories: round(totals.calories), protein: round(totals.protein, 1),
    carbs: round(totals.carbs, 1), fat: round(totals.fat, 1), cost: round(totals.cost),
  };
}

export function getWeeklyTotals(state: MealPrepState): RecipeTotals {
  const totals: RecipeTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };
  for (let day = 0; day < 7; day += 1) {
    const d = getDailyTotals(state, day);
    totals.calories += d.calories; totals.protein += d.protein;
    totals.carbs += d.carbs; totals.fat += d.fat; totals.cost += d.cost;
  }
  return {
    calories: round(totals.calories), protein: round(totals.protein, 1),
    carbs: round(totals.carbs, 1), fat: round(totals.fat, 1), cost: round(totals.cost),
  };
}

/** Consumo diario por ingrediente, derivado del plan semanal. */
export function getDailyUsage(state: MealPrepState): Map<string, number> {
  const recipes = new Map(state.recipes.map((r) => [r.id, r]));
  const weekly = new Map<string, number>();
  for (const meal of state.plannedMeals) {
    const recipe = recipes.get(meal.recipeId);
    if (!recipe || recipe.servings <= 0) continue;
    const factor = meal.servings / recipe.servings;
    for (const line of recipe.ingredients) {
      weekly.set(line.ingredientId, (weekly.get(line.ingredientId) ?? 0) + line.quantity * factor);
    }
  }
  const daily = new Map<string, number>();
  weekly.forEach((qty, id) => daily.set(id, qty / 7));
  return daily;
}

export function getShoppingList(state: MealPrepState): ShoppingLine[] {
  const daily = getDailyUsage(state);
  const result: ShoppingLine[] = [];
  for (const ingredient of resolvedIngredients(state)) {
    const weekly = (daily.get(ingredient.id) ?? 0) * 7;
    if (weekly <= 0 || ingredient.formats.length === 0) continue;
    const best = pickFormat(ingredient, weekly, "value", daily.get(ingredient.id));
    if (!best) continue;
    const weeksCovered = best.purchased / weekly;
    result.push({
      ingredientId: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      source: ingredient.source,
      required: round(weekly, ingredient.unit === "unidad" ? 0 : 1),
      formatLabel: best.format.label,
      packages: best.packages,
      purchased: best.purchased,
      surplus: round(best.purchased - weekly, ingredient.unit === "unidad" ? 0 : 1),
      cost: best.cost,
      weeksCovered: round(weeksCovered, 1),
      weeklyCost: round(best.cost / weeksCovered),
      forcedByMinimum: best.forcedByMinimum,
    });
  }
  return result.sort((a, b) => b.cost - a.cost);
}

// ---------- fechas ----------

function parseDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export function formatDate(key: string): string {
  const d = parseDate(key);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}
export function formatMonth(key: string): string {
  const d = parseDate(key);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

// ---------- viajes ----------

/**
 * Simula los viajes a Central Mayorista. Sólo los ingredientes con
 * `source: "mayorista"` obligan a viajar; la feria va por su cuenta.
 *
 * En cada viaje se compra para cubrir `targetDays`, recortado por la vida útil
 * de cada producto. El siguiente viaje cae cuando se agota el primer ingrediente,
 * que es justamente lo que define la cadencia real.
 */
export function getTripPlan(
  state: MealPrepState,
  startDate: string,
  months = 11,
  targetDays = 30,
  strategy: FormatStrategy = "value",
  /** Parámetros sólo para el primer viaje. Sirve para un arranque parche. */
  firstTrip?: { days: number; strategy: FormatStrategy },
): TripPlan {
  const daily = getDailyUsage(state);
  const tracked = resolvedIngredients(state).filter(
    (i) => i.source === "mayorista" && (daily.get(i.id) ?? 0) > 0 && i.formats.length > 0,
  );

  const start = parseDate(startDate);
  const end = addMonths(start, months);
  const stock = new Map<string, number>();
  const trips: Trip[] = [];

  let cursor = start;
  let index = 1;
  let guard = 0;

  while (cursor < end && guard < 400) {
    // Si el viaje ya se hizo en otra fecha, el calendario se reancla ahí. Sin
    // esto, comprar el sábado en vez del viernes desfasa los once meses.
    const doneDate = state.tripLog[index]?.doneDate;
    if (doneDate) cursor = parseDate(doneDate);
    guard += 1;
    const items: TripItem[] = [];
    const isFirst = index === 1 && firstTrip !== undefined;
    const windowDays = isFirst ? firstTrip!.days : targetDays;
    const pick = isFirst ? firstTrip!.strategy : strategy;

    for (const ingredient of tracked) {
      const use = daily.get(ingredient.id) ?? 0;
      const horizon = Math.min(windowDays, ingredient.shelfLifeDays);
      const have = stock.get(ingredient.id) ?? 0;
      const need = use * horizon - have;
      if (need <= 0.0001) continue;

      const best = pickFormat(ingredient, need, pick, use);
      if (!best) continue;
      const after = have + best.purchased;
      stock.set(ingredient.id, after);
      items.push({
        ingredientId: ingredient.id,
        name: ingredient.name,
        packages: best.packages,
        formatId: best.format.id,
        formatLabel: best.format.label,
        cost: best.cost,
        coversDays: Math.floor(after / use),
        forcedByMinimum: best.forcedByMinimum,
      });
    }

    // ¿Cuántos días aguanta la despensa antes de que algo se acabe?
    let span = windowDays;
    let bottleneck: Trip["bottleneck"] = null;
    for (const ingredient of tracked) {
      const use = daily.get(ingredient.id) ?? 0;
      const lasts = Math.floor((stock.get(ingredient.id) ?? 0) / use);
      if (lasts < span) {
        span = lasts;
        bottleneck = { name: ingredient.name, date: toKey(addDays(cursor, lasts)) };
      }
    }
    span = Math.max(1, Math.min(span, windowDays));

    trips.push({
      index,
      date: toKey(cursor),
      spanDays: span,
      cost: items.reduce((sum, i) => sum + i.cost, 0),
      items: items.sort((a, b) => b.cost - a.cost),
      bottleneck,
    });

    for (const ingredient of tracked) {
      const use = daily.get(ingredient.id) ?? 0;
      stock.set(ingredient.id, Math.max(0, (stock.get(ingredient.id) ?? 0) - use * span));
    }
    cursor = addDays(cursor, span);
    index += 1;
  }

  const totalCost = trips.reduce((s, t) => s + t.cost, 0);
  const spanTotal = daysBetween(startDate, toKey(end));
  return {
    startDate,
    endDate: toKey(addDays(end, -1)),
    trips,
    totalCost,
    dailyCost: round(totalCost / Math.max(spanTotal, 1)),
    averageTripCost: round(totalCost / Math.max(trips.length, 1)),
    monthlyCost: round(totalCost / Math.max(months, 1)),
  };
}

/** Compras de feria, agrupadas por su propia cadencia. */
export function getFeriaPlan(state: MealPrepState, targetDays = 30) {
  const daily = getDailyUsage(state);
  const lines = resolvedIngredients(state)
    .filter((i) => i.source === "feria" && (daily.get(i.id) ?? 0) > 0)
    .map((ingredient) => {
      const use = daily.get(ingredient.id) ?? 0;
      const horizon = Math.min(targetDays, ingredient.shelfLifeDays);
      const best = pickFormat(ingredient, use * horizon, "value", use);
      return {
        ingredientId: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        perCycle: round(use * horizon, ingredient.unit === "unidad" ? 0 : 0),
        cost: best?.cost ?? 0,
        formatLabel: best?.format.label ?? "",
        packages: best?.packages ?? 0,
      };
    })
    .sort((a, b) => b.cost - a.cost);
  return { lines, cost: lines.reduce((s, l) => s + l.cost, 0), cycleDays: targetDays };
}

export const formatCLP = (value: number) =>
  `$${Math.round(value).toLocaleString("es-CL")}`;

// ---------- peso ----------

/** Mifflin-St Jeor. Es la ecuación con menor error medio en población general. */
export function bmr(profile: Profile, weightKg: number): number {
  const base = 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return profile.sex === "m" ? base + 5 : base - 161;
}

export function tdee(profile: Profile, weightKg: number): number {
  return bmr(profile, weightKg) * profile.activity;
}

export const ACTIVITY_LEVELS = [
  { value: 1.2,   label: "Sedentario",   hint: "escritorio, sin ejercicio" },
  { value: 1.375, label: "Ligero",       hint: "1-3 días de ejercicio" },
  { value: 1.55,  label: "Moderado",     hint: "3-5 días de ejercicio" },
  { value: 1.725, label: "Alto",         hint: "6-7 días de ejercicio" },
  { value: 1.9,   label: "Muy alto",     hint: "trabajo físico + entreno" },
] as const;

/** ~7.700 kcal por kilo de tejido. Es una aproximación, no una ley. */
const KCAL_PER_KG = 7700;

/**
 * Proyecta el peso semana a semana. Recalcula el gasto con el peso nuevo en cada
 * paso: si sólo se extrapolara el superávit inicial, la curva se dispararía —
 * al engordar el cuerpo gasta más y la ganancia se frena sola.
 */
export function getWeightProjection(
  state: MealPrepState,
  startDate: string,
  months = 11,
): WeightProjection | null {
  const { profile, weightLog } = state;
  if (!profile || weightLog.length === 0) return null;

  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const logByDate = new Map(sorted.map((w) => [w.date, w.kg]));

  const intake = getDailyTotals(state, 0).calories;
  const start = parseDate(first.date < startDate ? first.date : startDate);
  const end = addMonths(parseDate(startDate), months);

  let weight = first.kg;
  const tdeeStart = tdee(profile, weight);
  const surplusStart = intake - tdeeStart;

  const points: WeightPoint[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 7)) {
    const key = toKey(cursor);
    points.push({
      date: key,
      projected: round(weight, 2),
      actual: logByDate.get(key),
    });
    const surplus = intake - tdee(profile, weight);
    weight += (surplus * 7) / KCAL_PER_KG;
  }

  // Los pesajes que no caen justo en un punto semanal no deben perderse.
  for (const entry of sorted) {
    if (points.some((p) => p.date === entry.date)) continue;
    const nearest = points.reduce((best, p) =>
      Math.abs(daysBetween(p.date, entry.date)) < Math.abs(daysBetween(best.date, entry.date)) ? p : best);
    nearest.actual = entry.kg;
  }

  const last = sorted[sorted.length - 1];
  const atLast = points.reduce((best, p) =>
    Math.abs(daysBetween(p.date, last.date)) < Math.abs(daysBetween(best.date, last.date)) ? p : best);

  const tdeeEnd = tdee(profile, weight);
  return {
    tdeeStart: round(tdeeStart),
    tdeeEnd: round(tdeeEnd),
    intake,
    surplusStart: round(surplusStart),
    surplusEnd: round(intake - tdeeEnd),
    startWeight: round(first.kg, 1),
    endWeight: round(weight, 1),
    weeklyRateStart: round((surplusStart * 7) / KCAL_PER_KG, 2),
    points,
    drift: sorted.length > 1 ? round(last.kg - atLast.projected, 1) : null,
  };
}

export function todayKey(): string {
  return toKey(new Date());
}

// ---------- medidas ----------

export const MEASUREMENT_SITES: { id: MeasurementSite; label: string; hint: string }[] = [
  { id: "cuello",  label: "Cuello",  hint: "bajo la nuez" },
  { id: "pecho",   label: "Pecho",   hint: "a la altura de los pezones" },
  { id: "brazo",   label: "Brazo",   hint: "bíceps contraído" },
  { id: "cintura", label: "Cintura", hint: "a la altura del ombligo" },
  { id: "cadera",  label: "Cadera",  hint: "por la parte más ancha" },
  { id: "muslo",   label: "Muslo",   hint: "un palmo bajo la ingle" },
];

export function getMeasurementTrends(state: MealPrepState): MeasurementTrend[] {
  const log = [...state.measurementLog].sort((a, b) => a.date.localeCompare(b.date));
  if (log.length === 0) return [];
  const out: MeasurementTrend[] = [];
  for (const site of MEASUREMENT_SITES) {
    const withValue = log.filter((e) => typeof e.values[site.id] === "number");
    if (withValue.length === 0) continue;
    const firstEntry = withValue[0];
    const lastEntry = withValue[withValue.length - 1];
    const first = firstEntry.values[site.id]!;
    const last = lastEntry.values[site.id]!;
    out.push({
      site: site.id, label: site.label,
      first, firstDate: firstEntry.date,
      last, delta: round(last - first, 1), lastDate: lastEntry.date,
    });
  }
  return out;
}

/**
 * Lee el conjunto peso + cintura. Es la señal que de verdad importa en un
 * superávit: subir de peso sin que la cintura se mueva es masa magra; si la
 * cintura sube más rápido que el peso, es grasa.
 */
export function readComposition(state: MealPrepState): string | null {
  const weights = [...state.weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const waist = getMeasurementTrends(state).find((t) => t.site === "cintura");
  if (weights.length < 2 || !waist) return null;

  const kg = round(weights[weights.length - 1].kg - weights[0].kg, 1);
  if (Math.abs(kg) < 0.5) return null;

  // ~1 cm de cintura por cada 1,5 kg es la referencia de una ganancia limpia.
  const expected = kg / 1.5;
  if (kg > 0 && waist.delta <= expected * 0.5) {
    return `Subiste ${kg} kg y la cintura sólo ${waist.delta} cm: buena parte de eso es masa magra.`;
  }
  if (kg > 0 && waist.delta > expected * 1.5) {
    return `Subiste ${kg} kg y la cintura ${waist.delta} cm: la ganancia está siendo más grasa que músculo. Vale la pena bajar el superávit o sumar entrenamiento de fuerza.`;
  }
  return `Subiste ${kg} kg y ${waist.delta} cm de cintura: proporción normal para un superávit de este tamaño.`;
}

// ---------- precios corregidos en tienda ----------

/** Aplica los precios reales registrados en caja sobre el catálogo. */
export function resolvedIngredients(state: MealPrepState): Ingredient[] {
  const overrides = state.priceOverrides;
  if (!overrides || Object.keys(overrides).length === 0) return state.ingredients;
  return state.ingredients.map((ingredient) => ({
    ...ingredient,
    formats: ingredient.formats.map((format) =>
      overrides[format.id] !== undefined ? { ...format, price: overrides[format.id] } : format),
  }));
}

// ---------- consumo del día ----------

const EMPTY: RecipeTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };

/**
 * Lo que realmente se comió un día, contra lo que estaba planificado.
 * Sin registro se asume que no ha comido nada todavía, no que cumplió el plan:
 * el objetivo es que el número refleje la realidad, no que se vea bonito.
 */
export function getConsumed(state: MealPrepState, dayIndex: number, dateKey: string): ConsumedTotals {
  const ingredients = resolvedIngredients(state);
  const recipes = new Map(state.recipes.map((r) => [r.id, r]));
  const log = state.dayLog[dateKey];
  const meals = state.plannedMeals.filter((m) => m.day === dayIndex);

  const totals = { ...EMPTY };
  const planned = { ...EMPTY };

  for (const meal of meals) {
    const recipe = recipes.get(meal.recipeId);
    if (!recipe || recipe.servings <= 0) continue;
    const t = getRecipeTotals(recipe, ingredients);
    const factor = meal.servings / recipe.servings;
    planned.calories += t.calories * factor;
    planned.protein += t.protein * factor;
    planned.carbs += t.carbs * factor;
    planned.fat += t.fat * factor;
    planned.cost += t.cost * factor;

    if (log?.eaten.includes(meal.id)) {
      totals.calories += t.calories * factor;
      totals.protein += t.protein * factor;
      totals.carbs += t.carbs * factor;
      totals.fat += t.fat * factor;
      totals.cost += t.cost * factor;
    }
  }

  for (const extra of log?.extras ?? []) {
    totals.calories += extra.calories;
    totals.protein += extra.protein;
    totals.carbs += extra.carbs;
    totals.fat += extra.fat;
  }

  const round1 = (t: RecipeTotals): RecipeTotals => ({
    calories: round(t.calories), protein: round(t.protein, 1),
    carbs: round(t.carbs, 1), fat: round(t.fat, 1), cost: round(t.cost),
  });
  return { ...round1(totals), planned: round1(planned) };
}

// ---------- sugerencia de porciones ----------

/**
 * Compara el ritmo real de los pesajes con un rango sano de ganancia
 * (0,25-0,5 % del peso corporal por semana) y propone un ajuste.
 *
 * Devuelve null si no hay datos suficientes. Es una sugerencia: la decide el
 * usuario, la app no toca las porciones sola.
 */
export function getPortionSuggestion(state: MealPrepState): PortionSuggestion | null {
  const log = [...state.weightLog].sort((a, b) => a.date.localeCompare(b.date));
  if (log.length < 2) return null;

  const first = log[0];
  const last = log[log.length - 1];
  const days = daysBetween(first.date, last.date);
  if (days < 14) return null; // menos de dos semanas es ruido de agua y sal

  const observedRate = round(((last.kg - first.kg) / days) * 7, 2);
  const targetLow = round(last.kg * 0.0025, 2);
  const targetHigh = round(last.kg * 0.005, 2);

  let gap = 0;
  let reason = "";
  if (observedRate > targetHigh) {
    gap = targetHigh - observedRate;
    reason = `Vas subiendo ${observedRate} kg por semana y el rango sano para tus ${last.kg} kg es ${targetLow}–${targetHigh}. A este ritmo buena parte va a ser grasa.`;
  } else if (observedRate < targetLow) {
    gap = targetLow - observedRate;
    reason = observedRate < 0
      ? `Estás bajando ${Math.abs(observedRate)} kg por semana en vez de subir. El superávit no está alcanzando.`
      : `Vas subiendo ${observedRate} kg por semana y el mínimo del rango sano es ${targetLow}. Vas más lento de lo necesario.`;
  } else {
    return null; // dentro del rango: no hay nada que sugerir
  }

  const deltaCalories = Math.round((gap * 7700) / 7);
  if (Math.abs(deltaCalories) < 60) return null; // ajustar por menos no vale la pena

  // Se reparte entre arroz y pollo, que son las palancas más baratas del plan.
  const halves = deltaCalories / 2;
  return {
    observedRate, targetLow, targetHigh, deltaCalories,
    riceGrams: Math.round(halves / 3.25 / 5) * 5,   // 325 kcal por 100 g
    chickenGrams: Math.round(halves / 1.33 / 5) * 5, // 133 kcal por 100 g
    reason,
  };
}

/**
 * El plan según la configuración guardada. Todas las pantallas deben usar esto
 * y no llamar a `getTripPlan` con parámetros propios: si cada una elige los
 * suyos, el resumen y el detalle muestran cifras distintas.
 */
export function getPlan(state: MealPrepState, startDate: string, months = 11): TripPlan {
  const s = state.planSettings;
  return getTripPlan(state, startDate, months, s.cadenceDays, s.strategy, {
    days: s.firstTripDays,
    strategy: s.firstTripStrategy,
  });
}

// ---------- tanda de cocina ----------

/**
 * Lo que va en el plato, ya cocido. Las cantidades del plan son en crudo porque
 * así se compra y así se pesa, pero sirviendo desde la olla eso no sirve: 200 g
 * de arroz crudo son más de medio kilo en el plato.
 */
function getPlate(recipe: Recipe, map: Map<string, Ingredient>): PlateComponent[] {
  const per = recipe.servings || 1;
  const groups = new Map<string, PlateComponent>();

  for (const line of recipe.ingredients) {
    if (!line.component) continue;
    const ingredient = map.get(line.ingredientId);
    if (!ingredient) continue;

    const raw = line.quantity / per;
    // En los ingredientes por unidad el rendimiento son gramos por unidad.
    const cooked = ingredient.unit === "unidad"
      ? raw * (ingredient.cookedYield ?? 0)
      : raw * (ingredient.cookedYield ?? 1);

    const group = groups.get(line.component)
      ?? { name: line.component, grams: 0, parts: [] };
    group.grams += cooked;
    group.parts.push({
      name: ingredient.name,
      raw: round(raw, 1),
      cooked: round(cooked),
      unit: ingredient.unit,
    });
    groups.set(line.component, group);
  }

  return [...groups.values()]
    .map((g) => ({ ...g, grams: round(g.grams) }))
    .sort((a, b) => b.grams - a.grams);
}

/**
 * Las cantidades de una receta ya vienen para la tanda completa (`servings`
 * días), así que aquí sólo se resuelven nombres y se calcula el por-porción.
 */
export function getBatch(state: MealPrepState): BatchRecipe[] {
  const map = new Map(resolvedIngredients(state).map((i) => [i.id, i]));
  return state.recipes.map((recipe) => {
    const per = recipe.servings || 1;
    const lines: BatchLine[] = recipe.ingredients
      .map((line) => {
        const ingredient = map.get(line.ingredientId);
        if (!ingredient) return null;
        return {
          ingredientId: line.ingredientId,
          name: ingredient.name,
          unit: ingredient.unit,
          total: round(line.quantity, 1),
          perServing: round(line.quantity / per, 1),
        };
      })
      .filter((l): l is BatchLine => l !== null)
      .sort((a, b) => b.total - a.total);

    const plate = getPlate(recipe, map);

    const activeMinutes = recipe.steps
      .filter((s) => !s.passive)
      .reduce((sum, s) => sum + (s.minutes ?? 0), 0);
    const totalMinutes = recipe.steps.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
    return { recipe, lines, activeMinutes, totalMinutes, plate };
  });
}

/**
 * El tiempo real de una tanda no es la suma de las recetas: mientras hierven las
 * papas y las lentejas se pica y se saltea. Se estima como el mayor tiempo total
 * de una receta más el trabajo activo de las otras.
 */
export function getBatchSession(batches: BatchRecipe[]) {
  if (batches.length === 0) return { minutes: 0, active: 0 };
  const longest = Math.max(...batches.map((b) => b.totalMinutes));
  const otherActive = batches
    .filter((b) => b.totalMinutes !== longest)
    .reduce((sum, b) => sum + b.activeMinutes, 0);
  return {
    minutes: longest + otherActive,
    active: batches.reduce((sum, b) => sum + b.activeMinutes, 0),
  };
}

/**
 * Reemplaza los marcadores de un paso por las cantidades reales de la receta.
 * Sin esto, ajustar las porciones deja las instrucciones desfasadas.
 *
 *   {arroz}    → total de la tanda        {arroz/}  → por porción
 *   {arroz*2}  → total × 2 (agua, etc.)
 */
export function renderStep(text: string, recipe: Recipe, ingredients: Ingredient[]): string {
  const map = new Map(ingredients.map((i) => [i.id, i]));
  const per = recipe.servings || 1;

  // {plato:Puré} → gramos servidos de esa parte del plato, ya cocida.
  const plate = getPlate(recipe, map);
  text = text.replace(/\{plato:([^}]+)\}/g, (whole, name) => {
    const component = plate.find((c) => c.name === name);
    return component ? `${component.grams.toLocaleString("es-CL")} g` : whole;
  });

  return text.replace(/\{(\w+)(\/)?(?:\*([\d.]+))?(?:\|(\w+))?\}/g,
    (whole, id, perServing, factor, unitOverride) => {
    if (id === "porciones") return String(per);
    const line = recipe.ingredients.find((l) => l.ingredientId === id);
    const ingredient = map.get(id);
    if (!line || !ingredient) return whole;

    let value = perServing ? line.quantity / per : line.quantity;
    if (factor) value *= Number(factor);

    // El agua del arroz se calcula desde los gramos de arroz pero se sirve en
    // litros, así que la unidad se puede forzar.
    if (unitOverride === "L") {
      return `${(Math.round(value / 100) / 10).toLocaleString("es-CL")} L`;
    }
    // Las unidades van sólo como número: el sustantivo lo pone la frase, para
    // que no salga "los 2 unidades de huevo".
    if (ingredient.unit === "unidad") return String(Math.round(value));
    if (value >= 1000) {
      const big = value / 1000;
      const label = ingredient.unit === "ml" ? "L" : "kg";
      return `${(Math.round(big * 10) / 10).toLocaleString("es-CL")} ${label}`;
    }
    return `${Math.round(value).toLocaleString("es-CL")} ${ingredient.unit}`;
  });
}
