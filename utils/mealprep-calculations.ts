import type { Ingredient, MealPrepState, PurchaseProjection, Recipe, RecipeTotals, ShoppingLine } from "@/types/mealprep";

export const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function ingredientUnitCost(ingredient: Ingredient): number {
  if (ingredient.formats.length === 0) return 0;
  let cheapest = Number.POSITIVE_INFINITY;
  for (const format of ingredient.formats) {
    if (format.quantity > 0) cheapest = Math.min(cheapest, format.price / format.quantity);
  }
  return Number.isFinite(cheapest) ? cheapest : 0;
}

export function getRecipeTotals(recipe: Recipe, ingredients: Ingredient[]): RecipeTotals {
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const totals: RecipeTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };
  for (const line of recipe.ingredients) {
    const ingredient = ingredientMap.get(line.ingredientId);
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
  const recipeMap = new Map(state.recipes.map((recipe) => [recipe.id, recipe]));
  const totals: RecipeTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };
  for (const meal of state.plannedMeals) {
    if (meal.day !== day) continue;
    const recipe = recipeMap.get(meal.recipeId);
    if (!recipe) continue;
    const recipeTotals = getRecipeTotals(recipe, state.ingredients);
    const factor = meal.servings / recipe.servings;
    totals.calories += recipeTotals.calories * factor;
    totals.protein += recipeTotals.protein * factor;
    totals.carbs += recipeTotals.carbs * factor;
    totals.fat += recipeTotals.fat * factor;
    totals.cost += recipeTotals.cost * factor;
  }
  return { calories: round(totals.calories), protein: round(totals.protein, 1), carbs: round(totals.carbs, 1), fat: round(totals.fat, 1), cost: round(totals.cost) };
}

export function getWeeklyTotals(state: MealPrepState): RecipeTotals {
  const totals: RecipeTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 };
  for (let day = 0; day < 7; day += 1) {
    const daily = getDailyTotals(state, day);
    totals.calories += daily.calories;
    totals.protein += daily.protein;
    totals.carbs += daily.carbs;
    totals.fat += daily.fat;
    totals.cost += daily.cost;
  }
  return { calories: round(totals.calories), protein: round(totals.protein, 1), carbs: round(totals.carbs, 1), fat: round(totals.fat, 1), cost: round(totals.cost) };
}

export function getShoppingList(state: MealPrepState): ShoppingLine[] {
  const required = new Map<string, number>();
  const recipeMap = new Map(state.recipes.map((recipe) => [recipe.id, recipe]));
  for (const meal of state.plannedMeals) {
    const recipe = recipeMap.get(meal.recipeId);
    if (!recipe) continue;
    const factor = meal.servings / recipe.servings;
    for (const line of recipe.ingredients) required.set(line.ingredientId, (required.get(line.ingredientId) ?? 0) + line.quantity * factor);
  }

  const result: ShoppingLine[] = [];
  for (const ingredient of state.ingredients) {
    const quantity = required.get(ingredient.id) ?? 0;
    if (quantity <= 0 || ingredient.formats.length === 0) continue;
    let best: { label: string; packages: number; purchased: number; cost: number } | null = null;
    for (const format of ingredient.formats) {
      const packages = Math.max(1, Math.ceil(quantity / format.quantity));
      const candidate = { label: format.label, packages, purchased: packages * format.quantity, cost: packages * format.price };
      if (!best || candidate.cost < best.cost || (candidate.cost === best.cost && candidate.purchased < best.purchased)) best = candidate;
    }
    if (!best) continue;
    const exactWeeksCovered = best.purchased / quantity;
    result.push({
      ingredientId: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      required: round(quantity, ingredient.unit === "unidad" ? 0 : 1),
      formatLabel: best.label,
      packages: best.packages,
      purchased: best.purchased,
      surplus: round(best.purchased - quantity, ingredient.unit === "unidad" ? 0 : 1),
      cost: best.cost,
      weeksCovered: round(exactWeeksCovered, 1),
      weeklyCost: round(best.cost / exactWeeksCovered),
    });
  }
  return result.sort((a, b) => b.cost - a.cost);
}

export function getAmortizedWeeklyShoppingCost(lines: ShoppingLine[]): number {
  return round(lines.reduce((total, line) => total + line.weeklyCost, 0));
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(date).replace(".", "");
}

export function getPurchaseProjection(lines: ShoppingLine[], startDate = "2026-08-07", months = 11): PurchaseProjection {
  const start = parseLocalDate(startDate);
  const end = addMonths(start, months);
  const inventory = new Map<string, number>();
  const weeks: PurchaseProjection["weeks"] = [];

  for (let purchaseDate = start, week = 1; purchaseDate < end; purchaseDate = addDays(purchaseDate, 7), week += 1) {
    const items: PurchaseProjection["weeks"][number]["items"] = [];
    for (const line of lines) {
      const packageQuantity = line.purchased / line.packages;
      const packageCost = line.cost / line.packages;
      let available = inventory.get(line.ingredientId) ?? 0;
      if (available + 0.0001 < line.required) {
        const packages = Math.ceil((line.required - available) / packageQuantity);
        available += packages * packageQuantity;
        items.push({ ingredientId: line.ingredientId, name: line.name, packages, formatLabel: line.formatLabel, cost: round(packages * packageCost) });
      }
      inventory.set(line.ingredientId, available - line.required);
    }
    weeks.push({
      week,
      purchaseDate: toDateKey(purchaseDate),
      cookDate: toDateKey(addDays(purchaseDate, 2)),
      cost: items.reduce((sum, item) => sum + item.cost, 0),
      items: items.sort((a, b) => b.cost - a.cost),
    });
  }

  const periods: PurchaseProjection["periods"] = Array.from({ length: months }, (_, index) => {
    const periodStart = addMonths(start, index);
    const periodEnd = addMonths(start, index + 1);
    const periodWeeks = weeks.filter((week) => {
      const date = parseLocalDate(week.purchaseDate);
      return date >= periodStart && date < periodEnd;
    });
    return {
      label: `${shortDate(periodStart)} – ${shortDate(addDays(periodEnd, -1))}`,
      startDate: toDateKey(periodStart),
      endDate: toDateKey(addDays(periodEnd, -1)),
      weeks: periodWeeks.length,
      purchaseDays: periodWeeks.filter((week) => week.cost > 0).length,
      cost: periodWeeks.reduce((sum, week) => sum + week.cost, 0),
    };
  });
  const totalCost = weeks.reduce((sum, week) => sum + week.cost, 0);
  return {
    startDate,
    endDate: toDateKey(addDays(end, -1)),
    weeks,
    periods,
    totalCost,
    firstPurchaseCost: weeks[0]?.cost ?? 0,
    averageWeeklyCost: round(totalCost / Math.max(weeks.length, 1)),
    averageMonthlyCost: round(totalCost / Math.max(months, 1)),
  };
}
