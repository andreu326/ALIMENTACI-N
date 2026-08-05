import { ArrowUpRight, Clock3 } from "lucide-react";
import { recentMeals } from "@/data/dashboard";
import { formatCLP } from "@/utils/format";

export function MealsList() {
  return (
    <section className="panel meals-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Repite sin esfuerzo</span><h2>Recetas de esta semana</h2></div>
        <button className="text-button" type="button">Ver biblioteca <ArrowUpRight size={14} /></button>
      </div>
      <div className="meal-list">
        {recentMeals.map((meal) => (
          <button type="button" className="meal-row" key={meal.id}>
            <span className="meal-swatch" style={{ background: meal.accent }}>{meal.name.charAt(0)}</span>
            <span className="meal-copy"><strong>{meal.name}</strong><span><Clock3 size={12} />{meal.slot} · {meal.meta}</span></span>
            <span className="meal-nutrition"><strong>{meal.calories}</strong><span>kcal</span></span>
            <span className="meal-price">{formatCLP(meal.cost)}<small>/porción</small></span>
          </button>
        ))}
      </div>
    </section>
  );
}
