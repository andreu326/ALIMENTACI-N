"use client";

import { createContext, use, useEffect, useMemo, useState } from "react";
import { seedState } from "@/data/seed";
import type { Ingredient, MealPrepContextValue, MealPrepState, NutritionTargets, PlannedMeal, Recipe } from "@/types/mealprep";

const STORAGE_KEY = "mealprep-planner:v1";
const MealPrepContext = createContext<MealPrepContextValue | null>(null);

function cloneSeed(): MealPrepState {
  return JSON.parse(JSON.stringify(seedState)) as MealPrepState;
}

function loadState(): { state: MealPrepState; storageAvailable: boolean } {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { state: cloneSeed(), storageAvailable: true };
    const parsed = JSON.parse(stored) as MealPrepState;
    if (parsed.version !== 1 || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.recipes)) return { state: cloneSeed(), storageAvailable: true };
    return { state: parsed, storageAvailable: true };
  } catch {
    return { state: cloneSeed(), storageAvailable: false };
  }
}

export function MealPrepProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MealPrepState>(() => cloneSeed());
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded.state);
    setStorageAvailable(loaded.storageAvailable);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageAvailable(false);
    }
  }, [hydrated, state, storageAvailable]);

  const actions = useMemo(() => ({
    setTargets: (targets: NutritionTargets) => setState((current) => ({ ...current, targets })),
    saveIngredient: (ingredient: Ingredient) => setState((current) => ({ ...current, ingredients: current.ingredients.some((item) => item.id === ingredient.id) ? current.ingredients.map((item) => item.id === ingredient.id ? ingredient : item) : [...current.ingredients, ingredient] })),
    deleteIngredient: (id: string) => setState((current) => ({ ...current, ingredients: current.ingredients.filter((item) => item.id !== id), recipes: current.recipes.map((recipe) => ({ ...recipe, ingredients: recipe.ingredients.filter((line) => line.ingredientId !== id) })), checkedShoppingIds: current.checkedShoppingIds.filter((item) => item !== id) })),
    saveRecipe: (recipe: Recipe) => setState((current) => ({ ...current, recipes: current.recipes.some((item) => item.id === recipe.id) ? current.recipes.map((item) => item.id === recipe.id ? recipe : item) : [...current.recipes, recipe] })),
    deleteRecipe: (id: string) => setState((current) => ({ ...current, recipes: current.recipes.filter((item) => item.id !== id), plannedMeals: current.plannedMeals.filter((meal) => meal.recipeId !== id) })),
    assignMeal: (meal: Omit<PlannedMeal, "id"> & { id?: string }) => setState((current) => {
      const id = meal.id ?? crypto.randomUUID();
      const next = { ...meal, id } as PlannedMeal;
      const matching = current.plannedMeals.find((item) => item.day === meal.day && item.slot === meal.slot);
      if (matching) return { ...current, plannedMeals: current.plannedMeals.map((item) => item.id === matching.id ? { ...next, id: matching.id } : item) };
      return { ...current, plannedMeals: [...current.plannedMeals, next] };
    }),
    removeMeal: (id: string) => setState((current) => ({ ...current, plannedMeals: current.plannedMeals.filter((meal) => meal.id !== id) })),
    duplicateMeal: (id: string, targetDay: number) => setState((current) => {
      const source = current.plannedMeals.find((meal) => meal.id === id);
      if (!source) return current;
      const duplicate = { ...source, id: crypto.randomUUID(), day: targetDay };
      const withoutTarget = current.plannedMeals.filter((meal) => !(meal.day === targetDay && meal.slot === source.slot));
      return { ...current, plannedMeals: [...withoutTarget, duplicate] };
    }),
    toggleShopping: (ingredientId: string) => setState((current) => ({ ...current, checkedShoppingIds: current.checkedShoppingIds.includes(ingredientId) ? current.checkedShoppingIds.filter((id) => id !== ingredientId) : [...current.checkedShoppingIds, ingredientId] })),
    resetData: () => setState(cloneSeed()),
  }), []);

  const value = useMemo<MealPrepContextValue>(() => ({ state, actions, meta: { hydrated, storageAvailable } }), [actions, hydrated, state, storageAvailable]);
  return <MealPrepContext value={value}>{children}</MealPrepContext>;
}

export function useMealPrep() {
  const context = use(MealPrepContext);
  if (!context) throw new Error("useMealPrep debe usarse dentro de MealPrepProvider");
  return context;
}
