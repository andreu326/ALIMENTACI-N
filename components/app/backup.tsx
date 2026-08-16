"use client";

import { useRef, useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { MealPrepState } from "@/types/mealprep";

/**
 * Respaldo manual. Todo vive en el localStorage de este navegador y Safari borra
 * el almacenamiento de sitios que no se visitan por siete días. Sin una copia,
 * un mes de pesajes, medidas y registro de comidas se pierde sin aviso.
 */
export function Backup() {
  const { state, actions } = useMealPrep();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportar = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `mealprep-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Descargado. Guárdalo en iCloud o mándatelo por correo.");
    setTimeout(() => setMessage(null), 4000);
  };

  const importar = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as MealPrepState;
      if (parsed.version !== state.version || !Array.isArray(parsed.ingredients)) {
        setMessage("Ese archivo no es un respaldo válido de esta versión.");
        return;
      }
      actions.replaceState(parsed);
      setMessage("Restaurado.");
    } catch {
      setMessage("No se pudo leer el archivo.");
    } finally {
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const registros =
    state.weightLog.length + state.measurementLog.length + Object.keys(state.dayLog).length;

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Respaldo</h2>
        <span className="section-meta num">{registros} registros</span>
      </div>

      <div className="backup-actions">
        <button type="button" className="btn btn-ghost" onClick={exportar}>
          Exportar
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          Restaurar
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importar(file);
          e.target.value = "";
        }}
      />

      {message ? <p className="section-meta" style={{ marginTop: "var(--sp-sm)" }}>{message}</p> : null}

      <p className="note">
        Todo se guarda sólo en este navegador. <strong>Safari borra el almacenamiento
        de sitios que no visitas por siete días</strong>, así que exporta de vez en
        cuando: es la única copia que existe de tus pesajes, medidas y registro
        de comidas.
      </p>
    </section>
  );
}
