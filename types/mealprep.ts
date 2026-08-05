export type BaseUnit = "g" | "ml" | "unidad";
export type MealSlot = "Desayuno" | "Almuerzo" | "Cena" | "Snack 1" | "Snack 2";

export type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weeklyBudget: number;
};

export type PurchaseFormat = {
  id: string;
  label: string;
  quantity: number;
  price: number;
};

export type Ingredient = {
  id: string;
  name: string;
  category: string;
  unit: BaseUnit;
  nutritionBasis: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  brand?: string;
  formats: PurchaseFormat[];
};

export type RecipeIngredient = {
  ingredientId: string;
  quantity: number;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  servings: number;
  prepMinutes: number;
  notes?: string;
  ingredients: RecipeIngredient[];
};

export type PlannedMeal = {
  id: string;
  day: number;
  slot: MealSlot;
  recipeId: string;
  servings: number;
};

export type MealPrepState = {
  version: 1;
  targets: NutritionTargets;
  ingredients: Ingredient[];
  recipes: Recipe[];
  plannedMeals: PlannedMeal[];
  checkedShoppingIds: string[];
};

export type RecipeTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number;
};

export type ShoppingLine = {
  ingredientId: string;
  name: string;
  unit: BaseUnit;
  required: number;
  formatLabel: string;
  packages: number;
  purchased: number;
  surplus: number;
  cost: number;
  weeksCovered: number;
  weeklyCost: number;
};

export type PurchaseProjectionItem = {
  ingredientId: string;
  name: string;
  packages: number;
  formatLabel: string;
  cost: number;
};

export type PurchaseProjectionWeek = {
  week: number;
  purchaseDate: string;
  cookDate: string;
  cost: number;
  items: PurchaseProjectionItem[];
};

export type PurchaseProjectionPeriod = {
  label: string;
  startDate: string;
  endDate: string;
  weeks: number;
  purchaseDays: number;
  cost: number;
};

export type PurchaseProjection = {
  startDate: string;
  endDate: string;
  weeks: PurchaseProjectionWeek[];
  periods: PurchaseProjectionPeriod[];
  totalCost: number;
  firstPurchaseCost: number;
  averageWeeklyCost: number;
  averageMonthlyCost: number;
};

export type MealPrepActions = {
  setTargets: (targets: NutritionTargets) => void;
  saveIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  saveRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  assignMeal: (meal: Omit<PlannedMeal, "id"> & { id?: string }) => void;
  removeMeal: (id: string) => void;
  duplicateMeal: (id: string, targetDay: number) => void;
  toggleShopping: (ingredientId: string) => void;
  resetData: () => void;
};

export type MealPrepContextValue = {
  state: MealPrepState;
  actions: MealPrepActions;
  meta: { hydrated: boolean; storageAvailable: boolean };
};
