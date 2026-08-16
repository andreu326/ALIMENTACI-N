"use client";

import { useMemo, useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { formatCLP, getPlanStart, getTripPlan } from "@/utils/mealprep-calculations";

const ARRANQUES = [
  { days: 7,  strategy: "cash" as const,  label: "Parche",   hint: "sólo la semana que viene" },
  { days: 30, strategy: "value" as const, label: "Completo", hint: "el mes entero de una" },
];

const CADENCIAS = [
  { days: 7,  label: "Semanal" },
  { days: 15, label: "Quincenal" },
  { days: 30, label: "Mensual" },
];

/**
 * Cadencia del plan. El primer viaje se configura aparte porque su restricción
 * suele ser otra: cuánta plata sale ese día, no cuánto cuesta el año.
 */
export function CadenceSettings() {
  const { state, actions } = useMealPrep();
  const s = state.planSettings;
  const [open, setOpen] = useState(false);

  // Se calcula cada opción para poder mostrar la consecuencia, no sólo el nombre.
  const preview = useMemo(() => {
    const build = (first: { days: number; strategy: "value" | "cash" }, cadence: number) =>
      getTripPlan(state, getPlanStart(state), 11, cadence, s.strategy, first);
    return {
      arranques: ARRANQUES.map((a) => ({
        ...a,
        cost: build({ days: a.days, strategy: a.strategy }, s.cadenceDays).trips[0].cost,
      })),
      cadencias: CADENCIAS.map((c) => {
        const plan = build({ days: s.firstTripDays, strategy: s.firstTripStrategy }, c.days);
        return { ...c, trips: plan.trips.length, total: plan.totalCost };
      }),
    };
  }, [state, s]);

  const current = preview.cadencias.find((c) => c.days === s.cadenceDays);

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Cadencia</h2>
        <button type="button" className="link" onClick={() => setOpen((v) => !v)}>
          {open ? "Listo" : "Cambiar"}
        </button>
      </div>

      {!open ? (
        <p className="section-meta">
          Arranque <strong style={{ color: "var(--c8)" }}>
            {s.firstTripDays === 7 ? "parche" : "completo"}
          </strong>{" "}
          y después{" "}
          <strong style={{ color: "var(--c8)" }}>
            {CADENCIAS.find((c) => c.days === s.cadenceDays)?.label.toLowerCase()}
          </strong>
          {current ? <> · <span className="num">{current.trips}</span> viajes en 11 meses</> : null}
        </p>
      ) : (
        <div className="cadence">
          <p className="field-label">Primer viaje</p>
          <ul className="choices">
            {preview.arranques.map((a) => (
              <li key={a.days}>
                <button type="button" className="choice"
                  aria-selected={s.firstTripDays === a.days}
                  onClick={() => actions.setPlanSettings({
                    firstTripDays: a.days, firstTripStrategy: a.strategy,
                  })}>
                  <span>
                    <span className="choice-name">{a.label}</span>
                    <span className="choice-hint">{a.hint}</span>
                  </span>
                  <span className="choice-side num">{formatCLP(a.cost)}</span>
                </button>
              </li>
            ))}
          </ul>

          <p className="field-label" style={{ marginTop: "var(--sp-lg)" }}>Después</p>
          <ul className="choices">
            {preview.cadencias.map((c) => (
              <li key={c.days}>
                <button type="button" className="choice"
                  aria-selected={s.cadenceDays === c.days}
                  onClick={() => actions.setPlanSettings({ cadenceDays: c.days })}>
                  <span>
                    <span className="choice-name">{c.label}</span>
                    <span className="choice-hint">
                      {c.trips} viajes · {formatCLP(c.total)} en 11 meses
                    </span>
                  </span>
                  <span className="choice-mark" />
                </button>
              </li>
            ))}
          </ul>

          <p className="field-note" style={{ marginTop: "var(--sp-md)" }}>
            Ir mensual cuesta un poco más en total que ir semanal, porque compras
            excedente que se queda guardado. A cambio son 36 viajes menos al año.
          </p>
        </div>
      )}
    </section>
  );
}
