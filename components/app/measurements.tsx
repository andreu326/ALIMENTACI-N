"use client";

import { useMemo, useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { MeasurementEntry, MeasurementSite } from "@/types/mealprep";
import {
  MEASUREMENT_SITES, formatDate, getMeasurementTrends, readComposition, todayKey,
} from "@/utils/mealprep-calculations";

export function MeasurementsSection() {
  const { state, actions } = useMealPrep();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const trends = useMemo(() => getMeasurementTrends(state), [state]);
  const reading = useMemo(() => readComposition(state), [state]);

  const parsed: MeasurementEntry["values"] = {};
  for (const site of MEASUREMENT_SITES) {
    const raw = draft[site.id];
    if (!raw) continue;
    const n = Number(raw.replace(",", "."));
    if (n >= 10 && n <= 250) parsed[site.id] = n;
  }
  const canSave = Object.keys(parsed).length > 0;

  const save = () => {
    if (!canSave) return;
    actions.logMeasurements(todayKey(), parsed);
    setDraft({});
    setOpen(false);
  };

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Medidas</h2>
        <button type="button" className="link" onClick={() => setOpen((v) => !v)}>
          {open ? "Cancelar" : "Registrar"}
        </button>
      </div>

      {trends.length === 0 && !open ? (
        <button type="button" className="band" onClick={() => setOpen(true)}>
          <span>
            <span className="meal-slot">Sin medidas todavía</span>
            <span style={{ display: "block", marginTop: 4, fontSize: "var(--text-md)", fontWeight: 500, letterSpacing: "-0.02em" }}>
              Toma tu primera vuelta con la cinta
            </span>
            <span className="row-sub" style={{ marginTop: 3 }}>
              La cintura junto al peso dice si estás subiendo músculo o grasa
            </span>
          </span>
        </button>
      ) : null}

      {trends.length > 0 ? (
        <ul className="rows">
          {trends.map((t) => (
            <li key={t.site} className="row">
              <span className="row-main">
                <span className="row-name">{t.label}</span>
                <span className="row-sub">
                  {t.firstDate === t.lastDate
                    ? <>medido el {formatDate(t.lastDate)}</>
                    : <>desde <span className="num">{t.first.toFixed(1)}</span> cm el{" "}
                        {formatDate(t.firstDate)}</>}
                </span>
              </span>
              <span className="row-value num">
                {t.last.toFixed(1)} cm{" "}
                <span style={{ color: t.delta === 0 ? "var(--c5)" : "var(--c6)" }}>
                  {t.delta > 0 ? "+" : ""}{t.delta.toFixed(1)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="reveal" data-open={open}>
        <div>
          <ul className="measure-grid">
            {MEASUREMENT_SITES.map((site) => (
              <li key={site.id}>
                <label className="field">
                  <span className="field-label">{site.label}</span>
                  <input
                    className="input num"
                    inputMode="decimal"
                    placeholder={lastValue(state.measurementLog, site.id) ?? "cm"}
                    value={draft[site.id] ?? ""}
                    onChange={(e) => setDraft((d) => ({
                      ...d,
                      [site.id]: e.target.value.replace(/[^\d.,]/g, "").slice(0, 5),
                    }))}
                  />
                  <span className="field-hint">{site.hint}</span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className="btn" disabled={!canSave} onClick={save}
            style={{ width: "100%", marginTop: "var(--sp-md)" }}>
            Guardar medidas
          </button>
          <p className="field-note" style={{ marginTop: "var(--sp-sm)" }}>
            Mide siempre a la misma hora, sin ropa apretada y sin apretar la cinta.
            Puedes llenar sólo las que midas hoy.
          </p>
        </div>
      </div>

      {reading ? <p className="note">{reading}</p> : null}
    </section>
  );
}

function lastValue(log: MeasurementEntry[], site: MeasurementSite): string | undefined {
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const v = log[i].values[site];
    if (typeof v === "number") return v.toFixed(1);
  }
  return undefined;
}
