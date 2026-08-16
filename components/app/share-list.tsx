"use client";

import { useRef, useState } from "react";
import type { Trip } from "@/types/mealprep";
import { formatCLP, formatDate } from "@/utils/mealprep-calculations";

/** La lista en texto plano, lista para pegar en WhatsApp o Notas. */
function asText(trip: Trip): string {
  return [
    `Central Mayorista — ${formatDate(trip.date)}`,
    "",
    ...trip.items.map((i) => {
      const min = i.forcedByMinimum ? "  (mínimo de compra)" : "";
      return `[ ] ${i.packages}x ${i.name} — ${i.formatLabel} — ${formatCLP(i.cost)}${min}`;
    }),
    "",
    `Total: ${formatCLP(trip.cost)} · ${trip.items.length} ítems`,
  ].join("\n");
}

type State = "idle" | "copiado" | "manual";

export function ShareList({ trip }: { trip: Trip }) {
  const [state, setState] = useState<State>("idle");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const text = asText(trip);

  const run = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Compra ${formatDate(trip.date)}`, text });
        return;
      } catch (error) {
        // Cancelar el diálogo no es un fallo que valga la pena reportar.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setState("copiado");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      // Safari en modo privado y algunos navegadores bloquean el portapapeles.
      // En vez de dejarlo sin salida, se muestra el texto ya seleccionado.
      setState("manual");
      requestAnimationFrame(() => areaRef.current?.select());
    }
  };

  return (
    <>
      <button type="button" className="btn btn-ghost share" onClick={run}>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <rect x="5" y="5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 4.2V3.5a2 2 0 0 0-2-2H3.5a2 2 0 0 0-2 2V8a2 2 0 0 0 2 2h.7"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {state === "copiado" ? "Copiada" : "Copiar lista"}
      </button>

      {state === "manual" ? (
        <div className="share-manual">
          <p className="field-note" style={{ marginBottom: "var(--sp-xs)" }}>
            Tu navegador no dejó copiar solo. El texto ya está seleccionado:
            cópialo con ⌘C o manteniendo presionado.
          </p>
          <textarea ref={areaRef} className="input share-text" readOnly rows={10} value={text} />
          <button type="button" className="link" onClick={() => setState("idle")}>
            Cerrar
          </button>
        </div>
      ) : null}
    </>
  );
}
