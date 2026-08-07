"use client";

import { useMemo, useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { SupplySource } from "@/types/mealprep";
import { durationLabel } from "@/components/app/bits";
import { formatCLP, getDailyUsage } from "@/utils/mealprep-calculations";

const TABS: { id: SupplySource; label: string }[] = [
  { id: "mayorista", label: "Mayorista" },
  { id: "feria", label: "Feria" },
];

/** Precio por kilo / litro / unidad, que es la única cifra comparable entre formatos. */
function unitPriceLabel(unit: string, price: number, quantity: number) {
  if (unit === "unidad") return `${formatCLP(price / quantity)} c/u`;
  const per = (price / quantity) * 1000;
  return `${formatCLP(per)}/${unit === "ml" ? "L" : "kg"}`;
}

export function PantryView() {
  const { state } = useMealPrep();
  const [source, setSource] = useState<SupplySource>("mayorista");
  const [openId, setOpenId] = useState<string | null>(null);

  const usage = useMemo(() => getDailyUsage(state), [state]);
  const items = state.ingredients
    .filter((i) => i.source === source && (usage.get(i.id) ?? 0) > 0)
    .sort((a, b) => {
      const ca = (usage.get(a.id) ?? 0) * (a.formats[0]?.price ?? 0) / (a.formats[0]?.quantity || 1);
      const cb = (usage.get(b.id) ?? 0) * (b.formats[0]?.price ?? 0) / (b.formats[0]?.quantity || 1);
      return cb - ca;
    });

  return (
    <div className="page stagger">
      <header className="page-head" style={{ ["--i" as string]: 0 }}>
        <p className="eyebrow">Precios verificados el 7 ago 2026</p>
        <h1 className="title">Despensa</h1>
        <div className="segments" role="tablist" aria-label="Origen">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className="segment"
              aria-selected={source === tab.id}
              onClick={() => { setSource(tab.id); setOpenId(null); }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <section className="section" style={{ ["--i" as string]: 1 }}>
        <div className="section-head">
          <h2 className="section-title">{items.length} ingredientes</h2>
          <span className="section-meta">consumo diario</span>
        </div>

        {items.length === 0 ? (
          <p className="empty">Nada asignado a este origen todavía.</p>
        ) : (
          <ul className="rows">
            {items.map((ing) => {
              const perDay = usage.get(ing.id) ?? 0;
              const open = openId === ing.id;
              const unit = ing.unit === "unidad" ? "un" : ing.unit;
              return (
                <li key={ing.id}>
                  <button
                    type="button"
                    className="row row-tap"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : ing.id)}
                  >
                    <span className="row-main">
                      <span className="row-name">{ing.name}</span>
                      <span className="row-sub">
                        {ing.brand ? `${ing.brand} · ` : ""}
                        dura {durationLabel(ing.shelfLifeDays)}
                      </span>
                    </span>
                    <span className="row-value num dim">
                      {perDay >= 10 ? Math.round(perDay) : perDay.toFixed(1)} {unit}/día
                    </span>
                  </button>

                  {open ? (
                    <div style={{ padding: "0 0 var(--sp-md) var(--sp-md)" }}>
                      <ul>
                        {ing.formats.map((f) => (
                          <li key={f.id} className="row" style={{ padding: "7px 0" }}>
                            <span className="row-main">
                              <span className="row-sub" style={{ color: "var(--c6)", fontSize: 13 }}>
                                {f.label}
                                {f.minQty > 1 ? (
                                  <span className="flag" style={{ marginLeft: 8, marginTop: 0 }}>
                                    mínimo {f.minQty}
                                  </span>
                                ) : null}
                              </span>
                              <span className="row-sub num">
                                {unitPriceLabel(ing.unit, f.price, f.quantity)}
                              </span>
                            </span>
                            <span className="row-sub num" style={{ color: "var(--c8)", fontSize: 14 }}>
                              {formatCLP(f.price)}
                              {f.minQty > 1 ? (
                                <span style={{ color: "var(--c8)" }}>
                                  {" "}→ {formatCLP(f.price * f.minQty)}
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="row-sub" style={{ marginTop: 10 }}>
                        <span className="num">{ing.calories}</span> kcal ·{" "}
                        <span className="num">{ing.protein}</span> P ·{" "}
                        <span className="num">{ing.carbs}</span> C ·{" "}
                        <span className="num">{ing.fat}</span> G
                        {ing.unit === "unidad" ? " por unidad" : " por 100 g"}
                      </p>
                      {ing.note ? <p className="note">{ing.note}</p> : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {source === "mayorista" ? (
        <p className="note" style={{ ["--i" as string]: 2 }}>
          Central Mayorista exige un mínimo de packs en <strong>344 de 605</strong> productos que
          revisé. Cuando aparece la marca de mínimo, el precio de la izquierda es el del pack y el
          de la derecha es lo que realmente pagas en caja.
        </p>
      ) : null}
    </div>
  );
}
