"use client";

import { useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { ExtraFood } from "@/types/mealprep";

const FIELDS = [
  { id: "calories", label: "kcal", max: 5000 },
  { id: "protein", label: "P", max: 400 },
  { id: "carbs", label: "C", max: 900 },
  { id: "fat", label: "G", max: 400 },
] as const;

/** Lo que se comió fuera del plan. Sin esto los anillos mienten. */
export function ExtrasEditor({ dateKey, extras }: { dateKey: string; extras: ExtraFood[] }) {
  const { actions } = useMealPrep();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const num = (id: string) => Number((values[id] ?? "").replace(",", ".")) || 0;
  const canAdd = name.trim().length > 0 && num("calories") > 0;

  const add = () => {
    if (!canAdd) return;
    actions.addExtra(dateKey, {
      name: name.trim(),
      calories: num("calories"), protein: num("protein"),
      carbs: num("carbs"), fat: num("fat"),
    });
    setName(""); setValues({}); setOpen(false);
  };

  return (
    <>
      {extras.length > 0 ? (
        <ul className="rows" style={{ marginTop: "var(--sp-xs)" }}>
          {extras.map((extra) => (
            <li key={extra.id} className="row">
              <span className="row-main">
                <span className="row-name">{extra.name}</span>
                <span className="row-sub num">
                  {extra.calories} kcal · {extra.protein} P · {extra.carbs} C · {extra.fat} G
                </span>
              </span>
              <button type="button" className="link"
                onClick={() => actions.removeExtra(dateKey, extra.id)}
                aria-label={`Quitar ${extra.name}`}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div className="extra-form">
          <label className="field">
            <span className="field-label">Qué comiste</span>
            <input className="input" value={name} autoFocus
              placeholder="Empanada, completo, cerveza…"
              onChange={(e) => setName(e.target.value.slice(0, 50))} />
          </label>
          <ul className="extra-grid">
            {FIELDS.map((f) => (
              <li key={f.id}>
                <label className="field">
                  <span className="field-label">{f.label}</span>
                  <input className="input num" inputMode="numeric" placeholder="0"
                    value={values[f.id] ?? ""}
                    onChange={(e) => setValues((v) => ({
                      ...v, [f.id]: e.target.value.replace(/[^\d.,]/g, "").slice(0, 5),
                    }))} />
                </label>
              </li>
            ))}
          </ul>
          <div className="extra-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button type="button" className="btn" disabled={!canAdd} onClick={add}>
              Agregar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="add-row" onClick={() => setOpen(true)}>
          <span aria-hidden="true">+</span> Comí algo más
        </button>
      )}
    </>
  );
}
