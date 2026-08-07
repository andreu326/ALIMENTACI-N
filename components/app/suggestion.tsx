"use client";

import { useMemo, useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { getPortionSuggestion } from "@/utils/mealprep-calculations";

/**
 * Sugerencia de ajuste de porciones. Nunca se aplica sola: se muestra el número,
 * el porqué, y el usuario decide. Descartarla la silencia hasta que cambie.
 */
export function PortionSuggestion() {
  const { state, actions } = useMealPrep();
  const suggestion = useMemo(() => getPortionSuggestion(state), [state]);
  const [dismissed, setDismissed] = useState<number | null>(null);

  if (!suggestion || dismissed === suggestion.deltaCalories) return null;

  const { deltaCalories, riceGrams, chickenGrams, reason } = suggestion;
  const up = deltaCalories > 0;
  const sign = up ? "+" : "−";

  const apply = () => {
    const rice = state.recipes
      .flatMap((r) => r.ingredients)
      .find((l) => l.ingredientId === "arroz");
    const chicken = state.recipes
      .flatMap((r) => r.ingredients)
      .find((l) => l.ingredientId === "pollo");
    if (!rice || !chicken) return;

    // Los gramos son por día; las recetas guardan la semana completa.
    actions.scalePortions({
      arroz: (rice.quantity + riceGrams * 7) / rice.quantity,
      pollo: (chicken.quantity + chickenGrams * 7) / chicken.quantity,
    });
    setDismissed(deltaCalories);
  };

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Sugerencia</h2>
        <span className="section-meta">según tus pesajes</span>
      </div>

      <div className="suggest">
        <p className="suggest-lead">
          {up ? "Sumar" : "Bajar"}{" "}
          <span className="num">{Math.abs(deltaCalories)}</span> kcal al día
        </p>
        <p className="suggest-why">{reason}</p>

        <ul className="rows" style={{ marginTop: "var(--sp-md)" }}>
          <li className="row">
            <span className="row-name">Arroz</span>
            <span className="row-value num">
              {sign}{Math.abs(riceGrams)} g al día
            </span>
          </li>
          <li className="row">
            <span className="row-name">Pollo</span>
            <span className="row-value num">
              {sign}{Math.abs(chickenGrams)} g al día
            </span>
          </li>
        </ul>

        <div className="suggest-actions">
          <button type="button" className="btn btn-ghost"
            onClick={() => setDismissed(deltaCalories)}>
            Ahora no
          </button>
          <button type="button" className="btn" onClick={apply}>
            Aplicar al plan
          </button>
        </div>
        <p className="field-note" style={{ marginTop: "var(--sp-sm)" }}>
          Al aplicarla cambian las cantidades de las recetas, así que también se
          mueven los macros y el costo de los viajes. Puedes ignorarla sin problema.
        </p>
      </div>
    </section>
  );
}
