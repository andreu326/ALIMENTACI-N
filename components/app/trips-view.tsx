"use client";

import { useMemo, useState } from "react";
import { PLAN_START } from "@/data/seed";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { TripCalendar } from "@/components/app/calendar";
import { Chevron, quantityLabel } from "@/components/app/bits";
import type { TripStatus } from "@/types/mealprep";
import { formatCLP, formatDate, getFeriaPlan, getTripPlan } from "@/utils/mealprep-calculations";

type Mode = "calendario" | "lista";

const FERIA_CICLOS = [
  { days: 15, label: "Cada 2 semanas" },
  { days: 30, label: "Cada mes" },
];

export function TripsView({ onOpenTrip }: { onOpenTrip: (index: number) => void }) {
  const { state } = useMealPrep();
  const [mode, setMode] = useState<Mode>("calendario");
  const [feriaDays, setFeriaDays] = useState(30);

  const plan = useMemo(() => getTripPlan(state, PLAN_START, 11, 30), [state]);
  const feria = useMemo(() => getFeriaPlan(state, feriaDays), [state, feriaDays]);

  const statusOf = (index: number): TripStatus => state.tripLog[index]?.status ?? "pendiente";

  const hechos = plan.trips.filter((t) => statusOf(t.index) === "hecho");
  const gastoReal = hechos.reduce(
    (sum, t) => sum + (state.tripLog[t.index]?.actualCost ?? t.cost), 0);
  const planificadoHecho = hechos.reduce((sum, t) => sum + t.cost, 0);
  const desvio = gastoReal - planificadoHecho;

  return (
    <div className="page stagger">
      <header style={{ ["--i" as string]: 0, paddingTop: "var(--sp-lg)" }}>
        <p className="eyebrow">11 meses desde {formatDate(PLAN_START)}</p>
        <h1 className="title">{plan.trips.length} viajes</h1>
        <p className="num" style={{ fontSize: "var(--text-2xl)", fontWeight: 500, letterSpacing: "-0.045em", marginTop: "var(--sp-md)", lineHeight: 1 }}>
          {formatCLP(plan.totalCost)}
        </p>
        <p className="section-meta" style={{ marginTop: 6 }}>
          {formatCLP(plan.monthlyCost)} al mes · {formatCLP(plan.dailyCost)} al día
        </p>

        {hechos.length > 0 ? (
          <p className="section-meta" style={{ marginTop: "var(--sp-sm)" }}>
            <span className="num">{hechos.length}</span> de{" "}
            <span className="num">{plan.trips.length}</span> hechos · gastado{" "}
            <span className="num" style={{ color: "var(--c8)" }}>{formatCLP(gastoReal)}</span>
            {desvio !== 0 ? (
              <> · <span className="num">{desvio > 0 ? "+" : ""}{formatCLP(desvio)}</span> vs plan</>
            ) : null}
          </p>
        ) : null}

        <div className="segments" role="tablist" aria-label="Vista">
          {(["calendario", "lista"] as Mode[]).map((m) => (
            <button key={m} type="button" role="tab" className="segment"
              aria-selected={mode === m} onClick={() => setMode(m)}>
              {m === "calendario" ? "Calendario" : "Lista"}
            </button>
          ))}
        </div>
      </header>

      <section className="section" style={{ ["--i" as string]: 1, marginTop: "var(--sp-lg)" }}>
        {mode === "calendario" ? (
          <TripCalendar trips={plan.trips} statusOf={statusOf} onSelect={onOpenTrip} />
        ) : (
          <ul>
            {plan.trips.map((trip, i) => {
              const nextTrip = plan.trips[i + 1];
              const status = statusOf(trip.index);
              return (
                <li key={trip.index}>
                  <button
                    type="button"
                    className={`trip${trip.index === 1 ? " is-next" : ""}`}
                    data-status={status}
                    onClick={() => onOpenTrip(trip.index)}
                    aria-label={`Viaje ${trip.index}, ${formatDate(trip.date)}, ${formatCLP(trip.cost)}, ${status}`}
                  >
                    <span className="trip-index num">{String(trip.index).padStart(2, "0")}</span>
                    <span>
                      <span className="trip-date">{formatDate(trip.date)}</span>
                      <span className="trip-sub">
                        {trip.items.length} ítems ·{" "}
                        {nextTrip ? `hasta ${formatDate(nextTrip.date)}` : "cierra el plan"}
                      </span>
                      {status !== "pendiente" ? (
                        <span className="pill" data-status={status} style={{ marginTop: 6 }}>
                          {status === "hecho" ? "Hecho" : "Saltado"}
                        </span>
                      ) : null}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--c4)" }}>
                      <span className="trip-cost num" style={{ color: "var(--c8)" }}>
                        {formatCLP(trip.cost)}
                      </span>
                      <Chevron />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="section" style={{ ["--i" as string]: 2 }}>
        <div className="section-head">
          <h2 className="section-title">Feria, aparte</h2>
          <span className="section-meta num">
            {formatCLP(feria.cost * (30 / feriaDays))} / mes
          </span>
        </div>
        <div className="segments" style={{ marginTop: 0, marginBottom: "var(--sp-md)" }}
          role="tablist" aria-label="Frecuencia de feria">
          {FERIA_CICLOS.map((c) => (
            <button key={c.days} type="button" role="tab" className="segment"
              aria-selected={feriaDays === c.days} onClick={() => setFeriaDays(c.days)}>
              {c.label}
            </button>
          ))}
        </div>
        <ul className="rows">
          {feria.lines.map((line) => (
            <li key={line.ingredientId} className="row">
              <span className="row-main">
                <span className="row-name">{line.name}</span>
                <span className="row-sub">
                  <span className="num">{quantityLabel(line.perCycle, line.unit)}</span> por vuelta
                </span>
              </span>
              <span className="row-value num dim">{formatCLP(line.cost)}</span>
            </li>
          ))}
        </ul>
        <p className="note">
          La feria no cuenta como viaje al mayorista y{" "}
          <strong>no cambia la cadencia de Central Mayorista</strong>: el gasto total es el mismo,
          sólo cambia cuánto cargas cada vez.{" "}
          {feriaDays === 15
            ? "Cada dos semanas llevas 6 kg de papas en vez de 12: más frescas y menos riesgo de que se broten."
            : "Doce kilos de papas aguantan el mes en despensa oscura y ventilada, pero en un departamento cálido se brotan antes."}{" "}
          El café va por tu cuenta y tampoco entra en estas cifras.
        </p>
      </section>
    </div>
  );
}
