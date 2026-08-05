"use client";

import { useState } from "react";
import { RotateCcw, Save, Target } from "lucide-react";
import { z } from "zod";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { NutritionTargets } from "@/types/mealprep";
import { formatCLP } from "@/utils/format";

const schema = z.object({ calories: z.number().positive(), protein: z.number().nonnegative(), carbs: z.number().nonnegative(), fat: z.number().nonnegative(), weeklyBudget: z.number().positive() });

export function TargetsView() {
  const { state, actions, meta } = useMealPrep();
  const [draft, setDraft] = useState<NutritionTargets>(() => ({ ...state.targets }));
  const [saved, setSaved] = useState(false);
  const update = (key: keyof NutritionTargets, value: string) => setDraft((current) => ({ ...current, [key]: Number(value) }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!schema.safeParse(draft).success) return; actions.setTargets(draft); setSaved(true); window.setTimeout(() => setSaved(false), 1600); };
  return (
    <div className="module-view settings-view"><section className="settings-card"><header><span className="settings-icon"><Target size={21} /></span><div><span className="eyebrow">Objetivos personales</span><h2>Tu referencia diaria</h2><p>El dashboard compara cada día planificado con estos valores.</p></div></header><form className="editor-form" onSubmit={submit}><div className="targets-grid"><label>Calorías diarias<div className="large-input"><input type="number" min="1" value={draft.calories} onChange={(event) => update("calories", event.target.value)} /><span>kcal</span></div></label><label>Proteínas<div className="large-input"><input type="number" min="0" value={draft.protein} onChange={(event) => update("protein", event.target.value)} /><span>g</span></div></label><label>Carbohidratos<div className="large-input"><input type="number" min="0" value={draft.carbs} onChange={(event) => update("carbs", event.target.value)} /><span>g</span></div></label><label>Grasas<div className="large-input"><input type="number" min="0" value={draft.fat} onChange={(event) => update("fat", event.target.value)} /><span>g</span></div></label></div><label className="budget-field">Presupuesto semanal<div className="large-input"><input type="number" min="1" value={draft.weeklyBudget} onChange={(event) => update("weeklyBudget", event.target.value)} /><span>CLP</span></div><small>Equivale a {formatCLP(draft.weeklyBudget * 4.33)} al mes</small></label><div className="storage-status"><span className={meta.storageAvailable ? "ok" : "error"} />{meta.storageAvailable ? "Tus cambios se guardan automáticamente en este navegador." : "El navegador bloqueó el almacenamiento local."}</div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => { if (window.confirm("¿Restaurar todos los datos de ejemplo?")) actions.resetData(); }}><RotateCcw size={15} />Restaurar demo</button><button type="submit" className="primary-button wide"><Save size={15} />{saved ? "Guardado" : "Guardar objetivos"}</button></div></form></section></div>
  );
}
