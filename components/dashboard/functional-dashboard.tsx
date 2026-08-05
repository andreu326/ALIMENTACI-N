"use client";

import { ArrowRight, CheckCircle2, CircleDollarSign, Target, Utensils } from "lucide-react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCLP } from "@/utils/format";
import { getAmortizedWeeklyShoppingCost, getDailyTotals, getRecipeTotals, getShoppingList, getWeeklyTotals, round } from "@/utils/mealprep-calculations";

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function FunctionalDashboard({ onNavigate }: { onNavigate: (view: "planner" | "shopping" | "targets") => void }) {
  const { state } = useMealPrep();
  const weekly = getWeeklyTotals(state);
  const shopping = getShoppingList(state);
  const purchaseTotal = shopping.reduce((sum, line) => sum + line.cost, 0);
  const weeklyShoppingCost = getAmortizedWeeklyShoppingCost(shopping);
  const mealsCount = state.plannedMeals.length;
  const daily = days.map((day, index) => ({ day, ...getDailyTotals(state, index) }));
  const averages = { calories: round(weekly.calories / 7), protein: round(weekly.protein / 7, 1), carbs: round(weekly.carbs / 7, 1), fat: round(weekly.fat / 7, 1) };
  const macroRows = [
    { label: "Calorías", value: averages.calories, target: state.targets.calories, unit: "kcal", color: "#57745A" },
    { label: "Proteínas", value: averages.protein, target: state.targets.protein, unit: "g", color: "#F07A5A" },
    { label: "Carbohidratos", value: averages.carbs, target: state.targets.carbs, unit: "g", color: "#6E7FAD" },
    { label: "Grasas", value: averages.fat, target: state.targets.fat, unit: "g", color: "#C49A58" },
  ];
  const topRecipes = state.recipes.map((recipe) => ({ recipe, uses: state.plannedMeals.filter((meal) => meal.recipeId === recipe.id).length, totals: getRecipeTotals(recipe, state.ingredients) })).sort((a, b) => b.uses - a.uses).slice(0, 4);
  return (
    <div className="dashboard-content functional-dashboard">
      <section className="live-week-strip">{daily.map((item, index) => { const percent = Math.min(item.calories / state.targets.calories * 100, 100); return <button type="button" key={item.day} onClick={() => onNavigate("planner")}><div><strong>{item.day}</strong><span>{4 + index}</span></div><b>{formatCLP(item.cost)}</b><span className="live-track"><span style={{ width: `${percent}%` }} /></span><small>{item.calories} kcal</small></button>; })}</section>
      <section className="metrics-grid"><MetricCard label="Costo consumido" value={formatCLP(weekly.cost)} detail={`${round(weekly.cost / Math.max(mealsCount, 1))} CLP por comida`} trend="flat" tone="accent" /><MetricCard label="Compra recomendada" value={formatCLP(purchaseTotal)} detail={`${shopping.length} productos · ${formatCLP(weeklyShoppingCost)}/sem. real`} trend="flat" /><MetricCard label="Estimación mensual" value={formatCLP(weeklyShoppingCost * 4.33)} detail={weeklyShoppingCost <= state.targets.weeklyBudget ? "Dentro del presupuesto" : "Sobre tu presupuesto"} trend={weeklyShoppingCost <= state.targets.weeklyBudget ? "down" : "up"} /><MetricCard label="Comidas planificadas" value={`${mealsCount}`} detail={`${state.recipes.length} recetas disponibles`} trend="flat" /></section>
      <section className="overview-grid"><article className="panel macro-panel"><div className="panel-heading"><div><span className="eyebrow">Promedio diario real</span><h2>Objetivo vs. planificado</h2></div><button className="text-button" type="button" onClick={() => onNavigate("targets")}>Editar objetivos <ArrowRight size={14} /></button></div><div className="macro-list functional-macros">{macroRows.map((macro) => { const percent = round(macro.value / Math.max(macro.target, 1) * 100); return <div className="macro-row" key={macro.label}><div className="macro-name"><span style={{ background: macro.color }} /><strong>{macro.label}</strong></div><div className="macro-values"><span><strong>{macro.value}</strong> / {macro.target} {macro.unit}</span><span className="difference">{round(macro.target - macro.value, 1)} {macro.unit} de diferencia</span></div><div className="macro-bar"><span style={{ width: `${Math.min(percent, 100)}%`, background: macro.color }} /></div><span className="macro-percent">{percent}%</span></div>; })}</div></article>
        <article className="panel live-cost-chart"><div className="panel-heading"><div><span className="eyebrow">Costo diario</span><h2>Ritmo de gasto</h2></div><CircleDollarSign size={20} /></div><div className="css-chart">{daily.map((item) => { const max = Math.max(...daily.map((day) => day.cost), 1); return <div key={item.day}><span className="bar-value">{formatCLP(item.cost)}</span><span className="bar-column"><span style={{ height: `${Math.max(item.cost / max * 100, 4)}%` }} /></span><strong>{item.day}</strong></div>; })}</div></article></section>
      <section className="lower-grid"><article className="panel live-recipes"><div className="panel-heading"><div><span className="eyebrow">Más usadas</span><h2>Recetas de la semana</h2></div><Utensils size={19} /></div><div>{topRecipes.map(({ recipe, uses, totals }) => <div className="live-recipe-row" key={recipe.id}><span>{recipe.name.slice(0, 1)}</span><div><strong>{recipe.name}</strong><small>{uses} veces · {round(totals.calories / recipe.servings)} kcal/porción</small></div><b>{formatCLP(totals.cost / recipe.servings)}</b></div>)}</div></article><article className="panel shopping-snapshot"><div className="panel-heading"><div><span className="eyebrow">Próxima compra</span><h2>{shopping.length} productos pendientes</h2></div><Target size={19} /></div><div>{shopping.slice(0, 4).map((line) => <div key={line.ingredientId}><CheckCircle2 size={15} /><span><strong>{line.name}</strong><small>{line.packages} × {line.formatLabel} · cada {line.weeksCovered} sem.</small></span><b>{formatCLP(line.weeklyCost)}/sem.</b></div>)}</div><button className="shopping-cta" type="button" onClick={() => onNavigate("shopping")}>Abrir lista completa <ArrowRight size={15} /></button></article></section>
    </div>
  );
}
