export type BaseUnit = "g" | "ml" | "unidad";
export type MealSlot = "Desayuno" | "Almuerzo" | "Cena" | "Snack 1" | "Snack 2";

/** Dónde se compra. Sólo `mayorista` genera viajes a Central Mayorista. */
export type SupplySource = "mayorista" | "feria" | "aparte";

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
  /** Contenido de UN pack, en la unidad base del ingrediente. */
  quantity: number;
  /** Precio de UN pack. */
  price: number;
  /** Packs mínimos por compra. Central Mayorista lo exige en 344 de 605 SKU. */
  minQty: number;
  sku?: string;
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
  source: SupplySource;
  /** Días que aguanta cerrado, en su envase original. */
  shelfLifeDays: number;
  /**
   * Días que aguanta una vez abierto (o descongelado). Limita el TAMAÑO del
   * envase que tiene sentido comprar: un bidón de 5 L es barato por litro pero
   * se enrancia mucho antes de que te lo acabes.
   */
  openLifeDays: number;
  formats: PurchaseFormat[];
  note?: string;
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

/** Datos corporales. Sin esto no hay proyección de peso posible. */
export type Profile = {
  sex: "m" | "f";
  age: number;
  heightCm: number;
  /** Multiplicador sobre el metabolismo basal. 1.2 sedentario … 1.9 muy activo. */
  activity: number;
};

export type WeightEntry = {
  /** YYYY-MM-DD */
  date: string;
  kg: number;
};

/** Sitios de medición. En cm, con cinta métrica, siempre a la misma hora. */
export type MeasurementSite =
  | "cuello" | "pecho" | "brazo" | "cintura" | "cadera" | "muslo";

export type MeasurementEntry = {
  /** YYYY-MM-DD */
  date: string;
  /** Puede venir incompleto: se registra sólo lo que se midió ese día. */
  values: Partial<Record<MeasurementSite, number>>;
};

export type MeasurementTrend = {
  site: MeasurementSite;
  label: string;
  first: number;
  firstDate: string;
  last: number;
  delta: number;
  lastDate: string;
};

export type TripStatus = "pendiente" | "hecho" | "saltado";

export type TripLogEntry = {
  status: TripStatus;
  /** Fecha real en que se hizo, si difiere de la planificada. */
  doneDate?: string;
  /** Lo que realmente salió en caja. */
  actualCost?: number;
};

export type MealPrepState = {
  version: 5;
  targets: NutritionTargets;
  ingredients: Ingredient[];
  recipes: Recipe[];
  plannedMeals: PlannedMeal[];
  checkedShoppingIds: string[];
  /** null hasta que el usuario ingrese sus datos. */
  profile: Profile | null;
  weightLog: WeightEntry[];
  measurementLog: MeasurementEntry[];
  /** Indexado por número de viaje. */
  tripLog: Record<number, TripLogEntry>;
};

export type WeightPoint = {
  date: string;
  /** Kilos proyectados según el superávit calórico. */
  projected: number;
  /** Kilos registrados ese día, si los hay. */
  actual?: number;
};

export type WeightProjection = {
  /** Gasto energético total diario, al peso inicial. */
  tdeeStart: number;
  /** Gasto al peso proyectado final. El superávit se achica al engordar. */
  tdeeEnd: number;
  intake: number;
  surplusStart: number;
  surplusEnd: number;
  startWeight: number;
  endWeight: number;
  /** Ritmo de la primera semana, en kg. */
  weeklyRateStart: number;
  points: WeightPoint[];
  /** Diferencia entre el último peso registrado y su proyección. */
  drift: number | null;
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
  source: SupplySource;
  required: number;
  formatLabel: string;
  packages: number;
  purchased: number;
  surplus: number;
  cost: number;
  weeksCovered: number;
  weeklyCost: number;
  /** true si el mínimo de compra obligó a llevar más de lo necesario. */
  forcedByMinimum: boolean;
};

export type TripItem = {
  ingredientId: string;
  name: string;
  packages: number;
  formatLabel: string;
  cost: number;
  /** Días que alcanza el stock tras esta compra. */
  coversDays: number;
  forcedByMinimum: boolean;
};

export type Trip = {
  index: number;
  date: string;
  /** Días hasta el siguiente viaje. */
  spanDays: number;
  cost: number;
  items: TripItem[];
  /** Ingrediente que obliga a volver, y cuándo. */
  bottleneck: { name: string; date: string } | null;
};

export type TripPlan = {
  startDate: string;
  endDate: string;
  trips: Trip[];
  totalCost: number;
  dailyCost: number;
  averageTripCost: number;
  monthlyCost: number;
};

export type MealPrepActions = {
  setTargets: (targets: NutritionTargets) => void;
  setProfile: (profile: Profile | null) => void;
  logWeight: (date: string, kg: number) => void;
  removeWeight: (date: string) => void;
  logMeasurements: (date: string, values: MeasurementEntry["values"]) => void;
  setTripStatus: (index: number, entry: TripLogEntry | null) => void;
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
