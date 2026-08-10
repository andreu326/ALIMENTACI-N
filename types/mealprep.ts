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
  /**
   * Cuánto pesa cocido respecto del crudo. El arroz casi triplica al absorber
   * agua; el pollo y la carne pierden un tercio. Sin esto las cantidades del
   * plan no sirven para servir desde la olla.
   */
  cookedYield?: number;
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
  /** Siempre en crudo, que es como se compra y como se pesa al cocinar. */
  quantity: number;
  /** Parte del plato a la que va: "Puré", "Guiso", "Arroz"… */
  component?: string;
};

export type RecipeStep = {
  /**
   * Puede traer marcadores `{ingredienteId}` que se reemplazan por la cantidad
   * real de la receta al mostrarse. Escribir los gramos a mano hace que las
   * instrucciones queden mintiendo apenas se ajustan las porciones.
   * `{arroz}` → cantidad de la tanda · `{arroz/}` → por porción
   * `{arroz*2}` → cantidad de la tanda multiplicada (agua, por ejemplo)
   */
  text: string;
  /** Minutos que toma el paso. Los que son de espera se marcan aparte. */
  minutes?: number;
  /** Espera sin atención: el tiempo corre mientras haces otra cosa. */
  passive?: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  servings: number;
  prepMinutes: number;
  notes?: string;
  ingredients: RecipeIngredient[];
  /**
   * `batch` — se cocina una vez para toda la semana y los pasos son de la tanda.
   * `daily` — se hace fresco cada día y los pasos son de UNA porción. Los huevos
   * fritos no aguantan tanda, así que forzarlos al molde semanal no sirve.
   */
  prepMode: "batch" | "daily";
  /** Paso a paso, en la escala que indique `prepMode`. */
  steps: RecipeStep[];
  /** Cómo guardar lo que sobra y cuánto aguanta. */
  storage?: string;
  /** Qué hacer cada día con la porción ya cocinada. */
  daily?: string;
};

/** Una línea de la tanda: cuánto va en total, no por porción. */
export type BatchLine = {
  ingredientId: string;
  name: string;
  unit: BaseUnit;
  total: number;
  perServing: number;
};

/** Lo que va en el plato, ya cocido. */
export type PlateComponent = {
  name: string;
  /** Gramos servidos por plato. */
  grams: number;
  parts: { name: string; raw: number; cooked: number; unit: BaseUnit }[];
};

export type BatchRecipe = {
  recipe: Recipe;
  lines: BatchLine[];
  activeMinutes: number;
  totalMinutes: number;
  plate: PlateComponent[];
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

/** Algo que se comió fuera del plan. */
export type ExtraFood = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** Lo que realmente se comió un día. */
export type DayLog = {
  /** Ids de `plannedMeals` marcados como comidos. */
  eaten: string[];
  extras: ExtraFood[];
};

export type ConsumedTotals = RecipeTotals & { planned: RecipeTotals };

export type PortionSuggestion = {
  /** kg por semana observados en los últimos pesajes. */
  observedRate: number;
  /** Rango sano para su peso: 0,25-0,5 % del peso corporal por semana. */
  targetLow: number;
  targetHigh: number;
  /** kcal diarias que habría que sumar (+) o restar (-). */
  deltaCalories: number;
  /** Traducción a gramos, para que sea accionable. */
  riceGrams: number;
  chickenGrams: number;
  reason: string;
};

/**
 * Cadencia del plan. El primer viaje puede ir con otros parámetros: sirve para
 * un arranque parche cuando la restricción de ese día es la caja y no el costo
 * total, sin cambiar el régimen que viene después.
 */
export type PlanSettings = {
  firstTripDays: number;
  firstTripStrategy: "value" | "cash";
  cadenceDays: number;
  strategy: "value" | "cash";
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
  version: 10;
  targets: NutritionTargets;
  ingredients: Ingredient[];
  recipes: Recipe[];
  plannedMeals: PlannedMeal[];
  checkedShoppingIds: string[];
  /** null hasta que el usuario ingrese sus datos. */
  profile: Profile | null;
  weightLog: WeightEntry[];
  measurementLog: MeasurementEntry[];
  /** Indexado por fecha YYYY-MM-DD. */
  dayLog: Record<string, DayLog>;
  /** Precio corregido en tienda, por id de formato. */
  priceOverrides: Record<string, number>;
  planSettings: PlanSettings;
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
  formatId: string;
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
  toggleEaten: (date: string, mealId: string) => void;
  addExtra: (date: string, extra: Omit<ExtraFood, "id">) => void;
  removeExtra: (date: string, id: string) => void;
  setPriceOverride: (formatId: string, price: number | null) => void;
  setPlanSettings: (settings: Partial<PlanSettings>) => void;
  scalePortions: (factorByIngredient: Record<string, number>) => void;
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
  replaceState: (state: MealPrepState) => void;
};

export type MealPrepContextValue = {
  state: MealPrepState;
  actions: MealPrepActions;
  meta: { hydrated: boolean; storageAvailable: boolean };
};
