"use client";

import { useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { TripItem } from "@/types/mealprep";
import { formatCLP } from "@/utils/mealprep-calculations";

/**
 * Corrección del precio en sala. Los precios del catálogo son de agosto de 2026
 * y en tienda cambian; al registrar el real se recalcula todo el plan.
 */
export function PriceField({ item }: { item: TripItem }) {
  const { state, actions } = useMealPrep();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const current = state.priceOverrides[item.formatId];
  const unitPlanned = Math.round(item.cost / item.packages);
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  const valid = parsed > 0 && parsed < 10_000_000;

  const save = () => {
    if (!valid) return;
    actions.setPriceOverride(item.formatId, Math.round(parsed));
    setValue(""); setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" className="price-toggle" onClick={() => setOpen(true)}>
        {current !== undefined
          ? <>precio real <span className="num">{formatCLP(current)}</span> por pack · cambiar</>
          : <>¿salió otro precio?</>}
      </button>
    );
  }

  return (
    <div className="price-edit">
      <input
        className="input num"
        inputMode="numeric"
        autoFocus
        placeholder={String(unitPlanned)}
        aria-label={`Precio real de ${item.name} por pack`}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, "").slice(0, 9))}
      />
      <button type="button" className="btn btn-sm" disabled={!valid} onClick={save}>
        Guardar
      </button>
      {current !== undefined ? (
        <button type="button" className="link"
          onClick={() => { actions.setPriceOverride(item.formatId, null); setOpen(false); }}>
          Quitar
        </button>
      ) : (
        <button type="button" className="link" onClick={() => setOpen(false)}>Cancelar</button>
      )}
    </div>
  );
}
