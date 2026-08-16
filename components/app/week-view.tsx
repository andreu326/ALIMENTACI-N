"use client";

import { useMemo, useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { quantityLabel } from "@/components/app/bits";
import type { SupplySource } from "@/types/mealprep";
import {
  formatCLP, formatDate, getDailyUsage, getStockLevels, ingredientUnitCost,
  resolvedIngredients, todayKey,
} from "@/utils/mealprep-calculations";

const SLOT_SHORT: Record<string, string> = {
  Desayuno: "des", Almuerzo: "alm", Cena: "cen", "Snack 1": "col", "Snack 2": "col",
};

type Tab = "cantidades" | "niveles";

export function WeekView() {
  const { state, actions } = useMealPrep();
  const [tab, setTab] = useState<Tab>("cantidades");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const ingredients = useMemo(() => resolvedIngredients(state), [state]);
  const usage = useMemo(() => getDailyUsage(state), [state]);
  const levels = useMemo(() => getStockLevels(state), [state]);

  /** Cuánto de cada ingrediente va a cada comida, para saber de dónde sale el total. */
  const breakdown = useMemo(() => {
    const recipes = new Map(state.recipes.map((r) => [r.id, r]));
    const map = new Map<string, Map<string, number>>();
    for (const meal of state.plannedMeals) {
      if (meal.day !== 0) continue;
      const recipe = recipes.get(meal.recipeId);
      if (!recipe || recipe.servings <= 0) continue;
      const factor = meal.servings / recipe.servings;
      for (const line of recipe.ingredients) {
        const per = map.get(line.ingredientId) ?? new Map<string, number>();
        per.set(meal.slot, (per.get(meal.slot) ?? 0) + line.quantity * factor);
        map.set(line.ingredientId, per);
      }
    }
    return map;
  }, [state]);

  const rows = (source: SupplySource) =>
    ingredients
      .filter((i) => i.source === source && (usage.get(i.id) ?? 0) > 0)
      .map((i) => {
        const perDay = usage.get(i.id) ?? 0;
        return { ing: i, perDay, week: perDay * 7, cost: ingredientUnitCost(i) * perDay * 7 };
      })
      .sort((a, b) => b.week * (b.ing.unit === "unidad" ? 100 : 1)
                    - a.week * (a.ing.unit === "unidad" ? 100 : 1));

  const mayorista = rows("mayorista");
  const feria = rows("feria");
  const total = [...mayorista, ...feria].reduce((s, r) => s + r.cost, 0);

  const saveStock = (id: string) => {
    const value = Number(draft.replace(",", "."));
    if (value >= 0) actions.setStock(id, value);
    setEditing(null); setDraft("");
  };

  return (
    <div className="page stagger">
      <header style={{ ["--i" as string]: 0, paddingTop: "var(--sp-lg)" }}>
        <p className="eyebrow">Lo que consumes, no lo que compras</p>
        <h1 className="title">La semana</h1>
        <p className="num" style={{ fontSize: "var(--text-2xl)", fontWeight: 500, letterSpacing: "-0.045em", marginTop: "var(--sp-md)", lineHeight: 1 }}>
          {formatCLP(total)}
        </p>
        <p className="section-meta" style={{ marginTop: 6 }}>
          en 7 días · {formatCLP(total / 7)} al día
        </p>
        <div className="segments" role="tablist" aria-label="Vista">
          {(["cantidades", "niveles"] as Tab[]).map((t) => (
            <button key={t} type="button" role="tab" className="segment"
              aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === "cantidades" ? "Cantidades" : "Niveles"}
            </button>
          ))}
        </div>
      </header>

      {tab === "cantidades" ? (
        <>
          {[["mayorista", "Central Mayorista", mayorista] as const,
            ["feria", "Feria", feria] as const].map(([key, titulo, lista]) => (
            <section key={key} className="section" style={{ ["--i" as string]: 1 }}>
              <div className="section-head">
                <h2 className="section-title">{titulo}</h2>
                <span className="section-meta">{lista.length} ingredientes</span>
              </div>
              <ul className="rows">
                {lista.map(({ ing, perDay, week }) => {
                  const per = breakdown.get(ing.id);
                  return (
                    <li key={ing.id} className="row">
                      <span className="row-main">
                        <span className="row-name">{ing.name}</span>
                        <span className="row-sub num">
                          {quantityLabel(perDay, ing.unit)} al día
                          {per && per.size > 0 ? (
                            <> · {[...per.entries()]
                              .map(([slot, q]) => `${SLOT_SHORT[slot] ?? slot} ${quantityLabel(q, ing.unit)}`)
                              .join(" · ")}</>
                          ) : null}
                        </span>
                      </span>
                      <span className="row-value num">{quantityLabel(week, ing.unit)}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <p className="note" style={{ ["--i" as string]: 2 }}>
            Estas son las cantidades que <strong>consumes</strong>. En la tienda los
            mínimos de compra y los formatos cambian los números: la salsa se vende
            de a 6 sachets, los fideos de a 3 bolsas y el pollo en bolsas de 4,5 kg.
            La lista real está en Viajes.
          </p>
        </>
      ) : (
        <>
          <section className="section" style={{ ["--i" as string]: 1 }}>
            <div className="section-head">
              <h2 className="section-title">Qué te queda</h2>
              <span className="section-meta">toca para corregir</span>
            </div>
            <ul className="rows">
              {levels.map((l) => (
                <li key={l.ingredientId}>
                  {editing === l.ingredientId ? (
                    <div className="row">
                      <span className="row-main">
                        <span className="row-name">{l.name}</span>
                        <span className="row-sub">cuánto te queda, en {l.unit}</span>
                      </span>
                      <span style={{ display: "flex", gap: "var(--sp-xs)" }}>
                        <input className="input num" inputMode="decimal" autoFocus
                          style={{ width: 96, padding: "8px 10px" }}
                          value={draft} placeholder={String(Math.round(l.qty))}
                          onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))} />
                        <button type="button" className="btn btn-sm"
                          onClick={() => saveStock(l.ingredientId)}>OK</button>
                      </span>
                    </div>
                  ) : (
                    <button type="button" className="row row-tap"
                      onClick={() => { setEditing(l.ingredientId); setDraft(""); }}>
                      <span className="row-main">
                        <span className="row-name">{l.name}</span>
                        <span className="level-bar" aria-hidden="true">
                          <span data-low={l.daysLeft <= 3}
                            style={{ width: `${Math.round(l.level * 100)}%` }} />
                        </span>
                        <span className="row-sub num">
                          {l.unknown
                            ? "sin registrar"
                            : l.daysLeft <= 0
                              ? "se acabó"
                              : `${quantityLabel(l.qty, l.unit)} · ${l.daysLeft} días · hasta el ${formatDate(l.runsOut)}`}
                        </span>
                      </span>
                      <span className="row-value num dim">
                        {l.unknown ? "—" : `${l.daysLeft} d`}
                      </span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <p className="note" style={{ ["--i" as string]: 2 }}>
            El nivel se estima: parte de lo último que registraste y descuenta el
            consumo del plan por los días transcurridos. <strong>No es una medición
            real</strong>, así que cuando abras la despensa y veas que no calza,
            tócalo y corrígelo. Al marcar un ítem comprado en Viajes, se suma solo.
          </p>
        </>
      )}
    </div>
  );
}
