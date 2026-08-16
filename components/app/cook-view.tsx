"use client";

import { useMemo, useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { MealArt } from "@/components/app/meal-art";
import { quantityLabel } from "@/components/app/bits";
import { getBatch, getBatchSession, renderStep, resolvedIngredients } from "@/utils/mealprep-calculations";

/** Minutos en algo legible: 95 → "1 h 35". */
function hhmm(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

export function CookView() {
  const { state } = useMealPrep();
  const batches = useMemo(() => getBatch(state), [state]);
  const ingredients = useMemo(() => resolvedIngredients(state), [state]);
  const session = useMemo(() => getBatchSession(batches), [batches]);
  const [open, setOpen] = useState<string | null>(batches[0]?.recipe.id ?? null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggleStep = (key: string) => {
    setDone((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const tanda = batches.filter((b) => b.recipe.prepMode !== "daily");
  const diarias = batches.filter((b) => b.recipe.prepMode === "daily");

  // Las tandas largas parten primero: mientras hierven se cocinan las otras.
  const orden = [...tanda].sort((a, b) => b.totalMinutes - a.totalMinutes);

  return (
    <div className="page stagger">
      <header style={{ ["--i" as string]: 0, paddingTop: "var(--sp-lg)" }}>
        <p className="eyebrow">
          {tanda.length} en tanda · {diarias.length} cada mañana
        </p>
        <h1 className="title">Cocina</h1>
        <p className="num" style={{ fontSize: "var(--text-2xl)", fontWeight: 500, letterSpacing: "-0.045em", marginTop: "var(--sp-md)", lineHeight: 1 }}>
          {hhmm(session.minutes)}
        </p>
        <p className="section-meta" style={{ marginTop: 6 }}>
          {hhmm(session.active)} de trabajo real · el resto es hervir y esperar
        </p>
        {diarias.length > 0 ? (
          <p className="section-meta" style={{ marginTop: 4 }}>
            Más {hhmm(diarias.reduce((sum, b) => sum + b.totalMinutes, 0))} cada
            mañana para el desayuno, que se hace fresco.
          </p>
        ) : null}
      </header>

      <section className="section" style={{ ["--i" as string]: 1 }}>
        <div className="section-head">
          <h2 className="section-title">Orden de la tanda</h2>
          <span className="section-meta">para no perder tiempo</span>
        </div>
        <ol className="order">
          {orden.map((b, i) => (
            <li key={b.recipe.id}>
              <span className="order-num num">{i + 1}</span>
              <span>
                <span className="order-name">{b.recipe.name}</span>
                <span className="order-hint">
                  {i === 0
                    ? "Parte por acá: es lo que más tarda y buena parte es espera."
                    : "Mientras lo anterior hierve."}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {[...tanda, ...diarias].map((b, index) => {
        const isOpen = open === b.recipe.id;
        const primeraTanda = index === 0 && tanda.length > 0;
        const primeraDiaria = index === tanda.length && diarias.length > 0;
        return (
          <section key={b.recipe.id} className="section" style={{ ["--i" as string]: 2 + index }}>
            {primeraTanda ? (
              <div className="group-head">
                <h2 className="section-title">Tanda semanal</h2>
                <p className="group-hint">
                  Se cocina una vez y rinde {b.recipe.servings} días. Las cantidades
                  de los pasos son <strong>el total de la semana</strong>.
                </p>
              </div>
            ) : null}
            {primeraDiaria ? (
              <div className="group-head">
                <h2 className="section-title">Al momento</h2>
                <p className="group-hint">
                  Se hace fresco cada día. Las cantidades de los pasos son{" "}
                  <strong>de una sola porción</strong>.
                </p>
              </div>
            ) : null}
            <button
              type="button"
              className="meal"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : b.recipe.id)}
            >
              <MealArt recipeId={b.recipe.id} />
              <span>
                <span className="meal-slot">
                  {b.recipe.prepMode === "daily" ? "Cada mañana" : b.recipe.category}
                </span>
                <span className="meal-name">{b.recipe.name}</span>
                <span className="meal-macros num">
                  {b.recipe.prepMode === "daily"
                    ? `1 porción · ${hhmm(b.totalMinutes)}`
                    : `${b.recipe.servings} porciones · ${hhmm(b.totalMinutes)}`}
                </span>
              </span>
            </button>

            <div className="reveal" data-open={isOpen}>
              <div>
                {b.plate.length > 0 ? (
                  <>
                    <div className="section-head" style={{ marginTop: "var(--sp-md)", marginBottom: 0 }}>
                      <p className="field-label">Por pote, ya cocido</p>
                      {b.recipe.prepMode !== "daily" ? (
                        <span className="section-meta num"
                          style={{ color: b.plateMl > state.containerMl ? "var(--c8)" : undefined }}>
                          {b.plateMl} / {state.containerMl} ml
                          {b.plateMl > state.containerMl ? " · no cabe" : ""}
                        </span>
                      ) : null}
                    </div>
                    <ul className="plate">
                      {b.plate.map((c) => (
                        <li key={c.name}>
                          <div className="plate-head">
                            <span className="plate-name">{c.name}</span>
                            <span className="plate-grams num">{c.ml} ml · {c.grams} g</span>
                          </div>
                          <div className="plate-bar" aria-hidden="true">
                            <span style={{ width: `${(c.ml / b.plate[0].ml) * 100}%` }} />
                          </div>
                          <p className="plate-parts num">
                            {c.parts
                              .filter((part) => part.cooked >= 5)
                              .map((part) => `${part.raw} ${part.unit === "unidad" ? "un" : part.unit} ${part.name.toLowerCase()}`)
                              .join(" · ")}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className="field-note" style={{ marginTop: "var(--sp-md)" }}>
                      Bajo cada parte va lo que aporta <strong>en crudo</strong>. Lo
                      que decide si cabe en el pote son los mililitros, no los gramos:
                      los fideos pesan poco pero ocupan mucho.
                    </p>
                  </>
                ) : null}

                <p className="field-label" style={{ marginTop: "var(--sp-lg)" }}>
                  {b.recipe.prepMode === "daily"
                    ? "Cantidades de una porción"
                    : `Cantidades para los ${b.recipe.servings} días`}
                </p>
                <ul className="rows" style={{ marginTop: "var(--sp-xs)" }}>
                  {b.lines.map((line) => (
                    <li key={line.ingredientId} className="row">
                      <span className="row-main">
                        <span className="row-name">{line.name}</span>
                        <span className="row-sub num">
                          {b.recipe.prepMode === "daily"
                            ? `${quantityLabel(line.total, line.unit)} en la semana`
                            : `${quantityLabel(line.perServing, line.unit)} por día`}
                        </span>
                      </span>
                      <span className="row-value num">
                        {quantityLabel(
                          b.recipe.prepMode === "daily" ? line.perServing : line.total,
                          line.unit,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="field-label" style={{ marginTop: "var(--sp-lg)" }}>Paso a paso</p>
                <ol className="steps">
                  {b.recipe.steps.map((step, i) => {
                    const key = `${b.recipe.id}:${i}`;
                    const checked = done.has(key);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          className="step"
                          data-done={checked}
                          aria-pressed={checked}
                          onClick={() => toggleStep(key)}
                        >
                          <span className="step-num num">{i + 1}</span>
                          <span>
                            <span className="step-text">{renderStep(step.text, b.recipe, ingredients)}</span>
                            {step.minutes ? (
                              <span className="step-time num">
                                {step.minutes} min{step.passive ? " · sin atender" : ""}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>

                {b.recipe.storage ? (
                  <p className="note"><strong>Guardar.</strong> {b.recipe.storage}</p>
                ) : null}
                {b.recipe.daily ? (
                  <p className="note"><strong>Cada día.</strong> {renderStep(b.recipe.daily, b.recipe, ingredients)}</p>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}

      <p className="note" style={{ ["--i" as string]: 6 }}>
        Enfría todo destapado antes de tapar y guardar. Tapar en caliente genera
        condensación, y esa agua es donde se echa a perder la comida.
      </p>
    </div>
  );
}
