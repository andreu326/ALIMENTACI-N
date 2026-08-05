export type MacroKey = "calories" | "protein" | "carbs" | "fat";

export type DaySummary = {
  id: string;
  short: string;
  date: number;
  cost: number;
  calories: number;
  targetCalories: number;
  status: "balanced" | "low" | "high";
};

export type MacroSummary = {
  key: MacroKey;
  label: string;
  unit: string;
  planned: number;
  target: number;
  color: string;
};

export type Meal = {
  id: string;
  name: string;
  slot: string;
  meta: string;
  calories: number;
  cost: number;
  accent: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  required: string;
  format: string;
  cost: number;
  checked: boolean;
};
