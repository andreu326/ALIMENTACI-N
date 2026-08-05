"use client";

import { Copy, Minus, Plus, Trash2 } from "lucide-react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { MealSlot } from "@/types/mealprep";
import { formatCLP } from "@/utils/format";
import { getDailyTotals, getRecipeTotals, round } from "@/utils/mealprep-calculations";

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const slots: MealSlot[] = ["Desayuno", "Almuerzo", "Cena", "Snack 1", "Snack 2"];

export function FunctionalPlanner() {
  const { state, actions } = useMealPrep();
  return (
    <div className="module-view planner-module">
      <div className="planner-help"><div><strong>Planifica una celda a la vez</strong><span>Todo se guarda automáticamente en este navegador.</span></div><span className="auto-save-dot">Guardado automático</span></div>
      {state.recipes.length === 0 ? <div className="notice-banner">Crea una receta antes de planificar tu semana.</div> : null}
      <div className="functional-planner-grid">
        {days.map((dayName, day) => { const daily = getDailyTotals(state, day); const caloriePercent = Math.min((daily.calories / state.targets.calories) * 100, 120); return <article className="functional-day" key={dayName}>
          <header><div><span>{dayName}</span><strong>{4 + day}</strong></div><div className="day-total"><strong>{formatCLP(daily.cost)}</strong><span>{daily.calories} kcal</span></div></header>
          <div className="day-progress"><span style={{ width: `${Math.min(caloriePercent, 100)}%` }} className={caloriePercent > 105 ? "over" : caloriePercent > 85 ? "good" : "low"} /></div>
          <div className="functional-slots">{slots.map((slot) => { const meal = state.plannedMeals.find((item) => item.day === day && item.slot === slot); const recipe = meal ? state.recipes.find((item) => item.id === meal.recipeId) : undefined; const totals = recipe ? getRecipeTotals(recipe, state.ingredients) : null; const perMealFactor = meal && recipe ? meal.servings / recipe.servings : 0; return <div className={`functional-slot ${meal ? "filled" : ""}`} key={slot}><div className="slot-label"><span>{slot}</span>{meal ? <div><button type="button" onClick={() => actions.duplicateMeal(meal.id, (day + 1) % 7)} aria-label={`Duplicar en ${days[(day + 1) % 7]}`} title={`Duplicar en ${days[(day + 1) % 7]}`}><Copy size={12} /></button><button type="button" onClick={() => actions.removeMeal(meal.id)} aria-label="Quitar comida"><Trash2 size={12} /></button></div> : null}</div>
            <select aria-label={`Receta para ${slot} del ${dayName}`} value={meal?.recipeId ?? ""} onChange={(event) => { if (!event.target.value) { if (meal) actions.removeMeal(meal.id); return; } actions.assignMeal({ id: meal?.id, day, slot, recipeId: event.target.value, servings: meal?.servings ?? 1 }); }}><option value="">+ Añadir receta</option>{state.recipes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            {meal && recipe && totals ? <div className="slot-meta"><span>{round(totals.calories * perMealFactor)} kcal · {formatCLP(totals.cost * perMealFactor)}</span><div className="serving-stepper"><button type="button" aria-label={`Reducir porciones de ${recipe.name}`} onClick={() => actions.assignMeal({ ...meal, servings: Math.max(.5, meal.servings - .5) })}><Minus size={11} /></button><span>{meal.servings} por.</span><button type="button" aria-label={`Aumentar porciones de ${recipe.name}`} onClick={() => actions.assignMeal({ ...meal, servings: meal.servings + .5 })}><Plus size={11} /></button></div></div> : null}
          </div>; })}</div>
          <footer><span>P {daily.protein}g</span><span>C {daily.carbs}g</span><span>G {daily.fat}g</span><strong>{round(caloriePercent)}%</strong></footer>
        </article>; })}
      </div>
    </div>
  );
}
