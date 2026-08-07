"use client";

import { useMemo, useState } from "react";
import type { Trip, TripStatus } from "@/types/mealprep";
import { formatCLP } from "@/utils/mealprep-calculations";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DOW = ["L", "M", "M", "J", "V", "S", "D"];

function parse(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = {
  trips: Trip[];
  statusOf: (index: number) => TripStatus;
  onSelect: (index: number) => void;
};

/**
 * Calendario mensual real. Los días con viaje se marcan según su estado, así se
 * ve de un vistazo qué se cumplió y qué se saltó.
 */
export function TripCalendar({ trips, statusOf, onSelect }: Props) {
  const byDate = useMemo(() => new Map(trips.map((t) => [t.date, t])), [trips]);

  const months = useMemo(() => {
    if (trips.length === 0) return [];
    const first = parse(trips[0].date);
    const last = parse(trips[trips.length - 1].date);
    const out: Date[] = [];
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1, 12);
    while (cursor <= last) {
      out.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return out;
  }, [trips]);

  const [monthIndex, setMonthIndex] = useState(0);
  const month = months[monthIndex];
  if (!month) return null;

  // Rejilla que empieza en lunes.
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const lead = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      new Date(month.getFullYear(), month.getMonth(), i + 1, 12)),
  ];

  const monthTrips = trips.filter((t) => {
    const d = parse(t.date);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  });

  return (
    <div className="cal">
      <div className="cal-head">
        <button
          type="button"
          className="cal-nav"
          disabled={monthIndex === 0}
          onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
          aria-label="Mes anterior"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.8 2.8 4.6 7l4.2 4.2" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="cal-title">
          {MESES[month.getMonth()]} <span className="num">{month.getFullYear()}</span>
        </p>
        <button
          type="button"
          className="cal-nav"
          disabled={monthIndex === months.length - 1}
          onClick={() => setMonthIndex((i) => Math.min(months.length - 1, i + 1))}
          aria-label="Mes siguiente"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5.2 2.8 9.4 7l-4.2 4.2" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="cal-dow" aria-hidden="true">
        {DOW.map((d, i) => <span key={i}>{d}</span>)}
      </div>

      <div className="cal-grid">
        {cells.map((date, i) => {
          if (!date) return <span key={`x${i}`} className="cal-cell is-empty" />;
          const trip = byDate.get(key(date));
          if (!trip) {
            return (
              <span key={key(date)} className="cal-cell">
                <span className="cal-num num">{date.getDate()}</span>
              </span>
            );
          }
          const status = statusOf(trip.index);
          return (
            <button
              key={key(date)}
              type="button"
              className="cal-cell is-trip"
              data-status={status}
              onClick={() => onSelect(trip.index)}
              aria-label={`Viaje ${trip.index}, ${date.getDate()} de ${MESES[date.getMonth()]}, ${status}`}
            >
              <span className="cal-num num">{date.getDate()}</span>
              <span className="cal-mark" />
            </button>
          );
        })}
      </div>

      {monthTrips.length === 0 ? (
        <p className="cal-none">Sin viajes este mes.</p>
      ) : (
        <ul className="cal-list">
          {monthTrips.map((trip) => {
            const status = statusOf(trip.index);
            return (
              <li key={trip.index}>
                <button type="button" className="cal-item" onClick={() => onSelect(trip.index)}>
                  <span className="cal-item-day num">{parse(trip.date).getDate()}</span>
                  <span>
                    <span className="cal-item-name">Viaje {trip.index}</span>
                    <span className="cal-item-sub">
                      {trip.items.length} ítems · {formatCLP(trip.cost)}
                    </span>
                  </span>
                  <span className="pill" data-status={status}>
                    {status === "hecho" ? "Hecho" : status === "saltado" ? "Saltado" : "Pendiente"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
