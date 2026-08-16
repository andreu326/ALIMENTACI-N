"use client";

import { useMemo, useState } from "react";
import { PLAN_START } from "@/data/seed";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { CheckMark, Chevron, Figure, durationLabel } from "@/components/app/bits";
import { formatCLP, formatDate, getPlan, todayKey } from "@/utils/mealprep-calculations";
import { ShareList } from "@/components/app/share-list";
import { PriceField } from "@/components/app/price-field";
import type { TripStatus } from "@/types/mealprep";

const STATUSES: { id: TripStatus; label: string }[] = [
  { id: "pendiente", label: "Pendiente" },
  { id: "hecho", label: "Hecho" },
  { id: "saltado", label: "Saltado" },
];

export function TripView({ index, onBack }: { index: number; onBack: () => void }) {
  const { state, actions } = useMealPrep();
  const plan = useMemo(() => getPlan(state, PLAN_START, 11), [state]);
  const trip = plan.trips.find((t) => t.index === index);

  if (!trip) {
    return (
      <div className="page">
        <button type="button" className="back" onClick={onBack}>
          <Chevron dir="left" /> Volver
        </button>
        <p className="empty">Ese viaje ya no existe en el plan.</p>
      </div>
    );
  }

  const keyFor = (ingredientId: string) => `${trip.index}:${ingredientId}`;
  const done = trip.items.filter((i) => state.checkedShoppingIds.includes(keyFor(i.ingredientId)));
  const spent = done.reduce((sum, i) => sum + i.cost, 0);
  const log = state.tripLog[trip.index];
  const status: TripStatus = log?.status ?? "pendiente";

  const setStatus = (next: TripStatus) => {
    if (next === "pendiente") { actions.setTripStatus(trip.index, null); return; }
    actions.setTripStatus(trip.index, {
      status: next,
      doneDate: next === "hecho" ? todayKey() : undefined,
      // Al marcar como hecho se guarda lo efectivamente marcado en la lista.
      actualCost: next === "hecho" ? spent || trip.cost : undefined,
    });
  };

  return (
    <div className="page stagger">
      <header style={{ ["--i" as string]: 0 }}>
        <button type="button" className="back" onClick={onBack}>
          <Chevron dir="left" /> Todos los viajes
        </button>
        <p className="eyebrow" style={{ marginTop: 10 }}>
          Viaje {trip.index} de {plan.trips.length} · {formatDate(trip.date)}
        </p>
        <h1 className="title">
          {trip.index === 1 ? "Primera compra" : `Reposición de ${trip.spanDays} días`}
        </h1>
        <Figure value={trip.cost} unit={`${trip.items.length} ítems`} />

        <p className="covers">
          Te dura hasta el <strong>{formatDate(trip.coversUntil)}</strong>
          <span className="covers-sub">
            {trip.spanDays} días · {formatCLP(Math.round(trip.cost / trip.spanDays))} por día
          </span>
        </p>

        <div className="pips" aria-hidden="true">
          {trip.items.map((item) => (
            <span key={item.ingredientId}
              data-on={state.checkedShoppingIds.includes(keyFor(item.ingredientId))} />
          ))}
        </div>
        <p className="section-meta" style={{ marginTop: 10 }}>
          Llevas <span className="num">{formatCLP(spent)}</span> de{" "}
          <span className="num">{formatCLP(trip.cost)}</span> · {done.length}/{trip.items.length}
        </p>
      </header>

      <section className="section" style={{ ["--i" as string]: 1 }}>
        <div className="section-head">
          <h2 className="section-title">Cumplimiento</h2>
          {log?.doneDate ? (
            <span className="section-meta">registrado el {formatDate(log.doneDate)}</span>
          ) : null}
        </div>
        <div className="segments" style={{ marginTop: 0 }} role="tablist" aria-label="Estado del viaje">
          {STATUSES.map((s) => (
            <button key={s.id} type="button" role="tab" className="segment"
              aria-selected={status === s.id} onClick={() => setStatus(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        {status === "hecho" && log?.actualCost !== undefined ? (
          <p className="section-meta" style={{ marginTop: "var(--sp-sm)" }}>
            Gastaste <span className="num">{formatCLP(log.actualCost)}</span>
            {log.actualCost !== trip.cost ? (
              <> · <span className="num">{log.actualCost > trip.cost ? "+" : ""}{formatCLP(log.actualCost - trip.cost)}</span> respecto del plan</>
            ) : null}
          </p>
        ) : null}
      </section>

      <section className="section" style={{ ["--i" as string]: 2 }}>
        <div className="section-head">
          <h2 className="section-title">Lista</h2>
          <span className="section-meta">toca para marcar</span>
        </div>
        <ShareList trip={trip} />
        <ul className="rows">
          {trip.items.map((item) => {
            const isDone = state.checkedShoppingIds.includes(keyFor(item.ingredientId));
            return (
              <li key={item.ingredientId}>
                <button
                  type="button"
                  className="check"
                  data-done={isDone}
                  aria-pressed={isDone}
                  onClick={() => {
                    const yaEstaba = state.checkedShoppingIds.includes(keyFor(item.ingredientId));
                    actions.toggleShopping(keyFor(item.ingredientId));
                    // Marcarlo como comprado sube el nivel de despensa.
                    if (!yaEstaba) {
                      const ing = state.ingredients.find((x) => x.id === item.ingredientId);
                      const fmt = ing?.formats.find((f) => f.id === item.formatId);
                      if (fmt) actions.addStock(item.ingredientId, fmt.quantity * item.packages);
                    }
                  }}
                >
                  <span className="check-box"><CheckMark /></span>
                  <span className="row-main">
                    <span className="check-name">
                      <span className="num">{item.packages}×</span> {item.name}
                    </span>
                    <span className="check-sub">
                      {item.formatLabel} · hasta el {formatDate(item.runsOut)}
                    </span>
                    {item.forcedByMinimum ? (
                      <span className="flag">mínimo de compra</span>
                    ) : null}
                  </span>
                  <span className="check-cost num">{formatCLP(item.cost)}</span>
                </button>
                <PriceField item={item} />
              </li>
            );
          })}
        </ul>
      </section>

      {trip.bottleneck ? (
        <p className="note" style={{ ["--i" as string]: 3 }}>
          Vuelves el <strong>{formatDate(trip.bottleneck.date)}</strong> porque se acaba{" "}
          <strong>{trip.bottleneck.name.toLowerCase()}</strong>. Todo lo demás alcanza más allá de
          esa fecha, así que ese es el ítem que fija la cadencia.
        </p>
      ) : null}
    </div>
  );
}
