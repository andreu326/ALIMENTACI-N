import type { DaySummary, MacroSummary, Meal, ShoppingItem } from "@/types/domain";

export const weekDays: DaySummary[] = [
  { id: "lun", short: "Lun", date: 4, cost: 4860, calories: 2010, targetCalories: 2200, status: "balanced" },
  { id: "mar", short: "Mar", date: 5, cost: 5240, calories: 2180, targetCalories: 2200, status: "balanced" },
  { id: "mie", short: "Mié", date: 6, cost: 4380, calories: 1850, targetCalories: 2200, status: "low" },
  { id: "jue", short: "Jue", date: 7, cost: 5120, calories: 2240, targetCalories: 2200, status: "high" },
  { id: "vie", short: "Vie", date: 8, cost: 4680, calories: 2080, targetCalories: 2200, status: "balanced" },
  { id: "sab", short: "Sáb", date: 9, cost: 5860, calories: 2300, targetCalories: 2200, status: "high" },
  { id: "dom", short: "Dom", date: 10, cost: 5340, calories: 2150, targetCalories: 2200, status: "balanced" },
];

export const macros: MacroSummary[] = [
  { key: "calories", label: "Calorías", unit: "kcal", planned: 2108, target: 2200, color: "#57745A" },
  { key: "protein", label: "Proteínas", unit: "g", planned: 142, target: 160, color: "#F07A5A" },
  { key: "carbs", label: "Carbohidratos", unit: "g", planned: 238, target: 250, color: "#6E7FAD" },
  { key: "fat", label: "Grasas", unit: "g", planned: 68, target: 70, color: "#C49A58" },
];

export const recentMeals: Meal[] = [
  { id: "1", name: "Pollo cítrico con arroz", slot: "Almuerzo", meta: "5 porciones · 35 min", calories: 620, cost: 1840, accent: "#DBE8D5" },
  { id: "2", name: "Avena, manzana y canela", slot: "Desayuno", meta: "1 porción · 8 min", calories: 410, cost: 760, accent: "#F2E4CD" },
  { id: "3", name: "Pasta al pesto de espinaca", slot: "Cena", meta: "4 porciones · 25 min", calories: 540, cost: 1530, accent: "#D8E3E1" },
];

export const initialShoppingItems: ShoppingItem[] = [
  { id: "1", name: "Pechuga de pollo", required: "2,4 kg", format: "3 × 1 kg", cost: 12900, checked: true },
  { id: "2", name: "Arroz largo", required: "1,8 kg", format: "2 × 1 kg", cost: 4200, checked: false },
  { id: "3", name: "Huevos", required: "27 un", format: "1 bandeja × 30", cost: 8200, checked: false },
  { id: "4", name: "Tomates", required: "900 g", format: "1 malla × 1 kg", cost: 1990, checked: false },
];

export const chartData = weekDays.map((day) => ({ day: day.short, costo: day.cost, objetivo: 5000 }));
