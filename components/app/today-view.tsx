"use client";

import { useMemo, useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { MacroRings } from "@/components/app/rings";
import { MealArt } from "@/components/app/meal-art";
import { Chevron } from "@/components/app/bits";
import { WeightSection } from "@/components/app/weight-view";
import { MeasurementsSection } from "@/components/app/measurements";
import { ExtrasEditor } from "@/components/app/extras";
import { PortionSuggestion } from "@/components/app/suggestion";
import { CheckMark } from "@/components/app/bits";
import {
  daysBetween, formatCLP, getPlanStart, formatDate, getConsumed, getRecipeTotals, getPlan, todayKey,
} from "@/utils/mealprep-calculations";

const LETTERS = ["L", "M", "M", "J", "V", "S", "D"];
const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const SLOT_ORDER = ["Desayuno", "Almuerzo", "Cena", "Snack 1", "Snack 2"];
const UNIT_LABEL: Record<string, string> = { g: "g", ml: "ml", unidad: "un" };

/** Índice de día del plan: 0 = lunes … 6 = domingo. */
function weekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

/** Los siete días de la semana que contiene `date`, empezando el lunes. */
function weekDates(date: Date) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - weekdayIndex(date));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

export function TodayView({ onOpenTrips, onOpenProfile }: { onOpenTrips: () => void; onOpenProfile: () => void }) {
  const { state, actions } = useMealPrep();

  // La semana y el día seleccionado salen de la fecha real, no del inicio del plan.
  const today = useMemo(() => new Date(), []);
  const todayIndex = weekdayIndex(today);
  const dates = useMemo(() => weekDates(today), [today]);

  const [day, setDay] = useState(todayIndex);
  const [openMeal, setOpenMeal] = useState<string | null>(null);

  const dateKey = useMemo(() => {
    const d = dates[day];
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [dates, day]);
  const totals = useMemo(() => getConsumed(state, day, dateKey), [state, day, dateKey]);
  const dayLog = state.dayLog[dateKey];
  const plan = useMemo(() => getPlan(state, getPlanStart(state), 11), [state]);
  const ingredients = useMemo(
    () => new Map(state.ingredients.map((i) => [i.id, i])),
    [state.ingredients],
  );

  const meals = state.plannedMeals
    .filter((m) => m.day === day)
    .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

  const now = todayKey();
  const next = plan.trips.find((t) => t.date >= now) ?? plan.trips[0];
  const daysToNext = next ? daysBetween(now, next.date) : 0;
  const t = state.targets;

  return (
    <div className="page stagger">
      <nav className="week" aria-label="Días de la semana" style={{ ["--i" as string]: 0 }}>
        {LETTERS.map((letter, i) => (
          <button
            key={i}
            type="button"
            className="week-day"
            aria-selected={day === i}
            data-today={i === todayIndex}
            aria-label={`${DAY_NAMES[i]} ${dates[i].getDate()}${i === todayIndex ? ", hoy" : ""}`}
            onClick={() => { setDay(i); setOpenMeal(null); }}
          >
            <span className="week-letter">{letter}</span>
            <span className="week-num num">{dates[i].getDate()}</span>
            <span className="week-dot" />
          </button>
        ))}
      </nav>

      <p className="eyebrow" style={{ ["--i" as string]: 1, marginBottom: "var(--sp-xs)" }}>
        {day === todayIndex ? "Hoy" : DAY_NAMES[day]} · {formatDate(
          `${dates[day].getFullYear()}-${String(dates[day].getMonth() + 1).padStart(2, "0")}-${String(dates[day].getDate()).padStart(2, "0")}`
        )}
      </p>

      <section style={{ ["--i" as string]: 2 }}>
        <MacroRings
          calories={totals.calories}
          protein={totals.protein}
          carbs={totals.carbs}
          fat={totals.fat}
          targets={t}
        />
        <p className="section-meta" style={{ marginTop: "var(--sp-xs)" }}>
          {totals.calories === 0
            ? <>Sin registrar. El plan del día trae <span className="num">{totals.planned.calories}</span> kcal.</>
            : <>Llevas <span className="num">{totals.calories}</span> de{" "}
                <span className="num">{t.calories}</span> kcal · faltan{" "}
                <span className="num">{Math.max(0, t.calories - totals.calories)}</span></>}
        </p>
      </section>

      <div style={{ ["--i" as string]: 3 }}>
        <WeightSection onOpenProfile={onOpenProfile} />
      </div>

      <div style={{ ["--i" as string]: 4 }}>
        <MeasurementsSection />
      </div>

      <section className="section" style={{ ["--i" as string]: 5 }}>
        <div className="section-head">
          <h2 className="section-title">Comidas</h2>
          <span className="section-meta num">{formatCLP(totals.planned.cost)} el día</span>
        </div>

        <ul>
          {meals.map((meal) => {
            const recipe = state.recipes.find((r) => r.id === meal.recipeId);
            if (!recipe) return null;
            const rt = getRecipeTotals(recipe, state.ingredients);
            const per = recipe.servings || 1;
            const open = openMeal === meal.id;
            return (
              <li key={meal.id}>
                <div className="meal-row" data-eaten={dayLog?.eaten.includes(meal.id) ?? false}>
                  <button
                    type="button"
                    className="meal-tick"
                    aria-pressed={dayLog?.eaten.includes(meal.id) ?? false}
                    aria-label={`Marcar ${recipe.name} como comido`}
                    onClick={() => actions.toggleEaten(dateKey, meal.id)}
                  >
                    <span className="check-box"><CheckMark /></span>
                  </button>
                  <button
                    type="button"
                    className="meal"
                    aria-expanded={open}
                    onClick={() => setOpenMeal(open ? null : meal.id)}
                  >
                    <MealArt recipeId={recipe.id} />
                    <span>
                      <span className="meal-slot">{meal.slot}</span>
                      <span className="meal-name">{recipe.name}</span>
                      <span className="meal-macros num">
                        <b>{Math.round(rt.calories / per)}</b> kcal ·{" "}
                        <b>{Math.round(rt.protein / per)}</b> P ·{" "}
                        <b>{Math.round(rt.carbs / per)}</b> C ·{" "}
                        <b>{Math.round(rt.fat / per)}</b> G
                      </span>
                    </span>
                  </button>
                </div>

                <div className="reveal" data-open={open}>
                  <div>
                    <ul style={{ padding: "0 0 var(--sp-md) 72px" }}>
                      {recipe.ingredients.map((line) => {
                        const ing = ingredients.get(line.ingredientId);
                        if (!ing) return null;
                        const perDay = line.quantity / per;
                        return (
                          <li key={line.ingredientId} className="row" style={{ padding: "8px 0" }}>
                            <span className="row-sub" style={{ color: "var(--c6)" }}>{ing.name}</span>
                            <span className="row-sub num">
                              {perDay >= 10 ? Math.round(perDay) : perDay.toFixed(1)}{" "}
                              {UNIT_LABEL[ing.unit]}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <ExtrasEditor dateKey={dateKey} extras={dayLog?.extras ?? []} />
      </section>

      <div style={{ ["--i" as string]: 5 }}>
        <PortionSuggestion />
      </div>

      {next ? (
        <section className="section" style={{ ["--i" as string]: 6 }}>
          <div className="section-head">
            <h2 className="section-title">Próxima compra</h2>
            <span className="section-meta">
              {daysToNext === 0 ? "es hoy" : `en ${daysToNext} días`}
            </span>
          </div>
          <button type="button" className="band" onClick={onOpenTrips}>
            <span>
              <span className="meal-slot">{formatDate(next.date)}</span>
              <span className="band-amount num" style={{ display: "block", marginTop: 4 }}>
                {formatCLP(next.cost)}
              </span>
              <span className="row-sub" style={{ marginTop: 3 }}>
                {next.items.length} ítems · te dura hasta el {formatDate(next.coversUntil)}
              </span>
            </span>
            <Chevron />
          </button>
        </section>
      ) : null}
    </div>
  );
}
