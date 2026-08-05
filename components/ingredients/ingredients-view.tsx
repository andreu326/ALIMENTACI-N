"use client";

import { useMemo, useState } from "react";
import { Edit3, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import { z } from "zod";
import { SidePanel } from "@/components/ui/side-panel";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { BaseUnit, Ingredient, PurchaseFormat } from "@/types/mealprep";
import { formatCLP } from "@/utils/format";
import { ingredientUnitCost } from "@/utils/mealprep-calculations";

const ingredientSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre"),
  category: z.string().trim().min(2, "Escribe una categoría"),
  nutritionBasis: z.number().positive(),
  formats: z.array(z.object({ label: z.string().trim().min(1), quantity: z.number().positive(), price: z.number().nonnegative() })).min(1),
});

const emptyIngredient = (): Ingredient => ({ id: crypto.randomUUID(), name: "", category: "", unit: "g", nutritionBasis: 100, calories: 0, protein: 0, carbs: 0, fat: 0, brand: "", formats: [{ id: crypto.randomUUID(), label: "", quantity: 1000, price: 0 }] });

function IngredientForm({ initial, onDone }: { initial: Ingredient; onDone: () => void }) {
  const { actions } = useMealPrep();
  const [draft, setDraft] = useState<Ingredient>(() => structuredClone(initial));
  const [error, setError] = useState("");
  const setNumber = (key: keyof Ingredient, value: string) => setDraft((current) => ({ ...current, [key]: Number(value) }));
  const updateFormat = (id: string, patch: Partial<PurchaseFormat>) => setDraft((current) => ({ ...current, formats: current.formats.map((format) => format.id === id ? { ...format, ...patch } : format) }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = ingredientSchema.safeParse(draft);
    if (!result.success) { setError(result.error.issues[0]?.message ?? "Revisa los campos"); return; }
    actions.saveIngredient({ ...draft, name: draft.name.trim(), category: draft.category.trim() });
    onDone();
  };

  return (
    <form className="editor-form" onSubmit={submit}>
      <div className="field-grid two"><label>Nombre<input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ej. Salmón" /></label><label>Categoría<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Proteínas" /></label></div>
      <div className="field-grid two"><label>Unidad base<select value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value as BaseUnit, nutritionBasis: event.target.value === "unidad" ? 1 : 100 })}><option value="g">Gramos</option><option value="ml">Mililitros</option><option value="unidad">Unidad</option></select></label><label>Base nutricional<input type="number" min="0.01" step="0.01" value={draft.nutritionBasis} onChange={(event) => setNumber("nutritionBasis", event.target.value)} /><small>{draft.unit === "unidad" ? "por unidad" : `por ${draft.nutritionBasis} ${draft.unit}`}</small></label></div>
      <div className="form-section"><div className="form-section-title"><h3>Información nutricional</h3><span>Se usa para calcular cada receta</span></div><div className="field-grid four"><label>Calorías<input type="number" min="0" step="0.1" value={draft.calories} onChange={(event) => setNumber("calories", event.target.value)} /></label><label>Proteínas<input type="number" min="0" step="0.1" value={draft.protein} onChange={(event) => setNumber("protein", event.target.value)} /></label><label>Carbos<input type="number" min="0" step="0.1" value={draft.carbs} onChange={(event) => setNumber("carbs", event.target.value)} /></label><label>Grasas<input type="number" min="0" step="0.1" value={draft.fat} onChange={(event) => setNumber("fat", event.target.value)} /></label></div></div>
      <div className="form-section"><div className="form-section-title inline"><div><h3>Formatos de compra</h3><span>Añade todos los tamaños disponibles</span></div><button type="button" className="mini-button" onClick={() => setDraft((current) => ({ ...current, formats: [...current.formats, { id: crypto.randomUUID(), label: "", quantity: 1, price: 0 }] }))}><Plus size={13} />Formato</button></div>
        <div className="format-list">{draft.formats.map((format) => <div className="format-editor" key={format.id}><label>Formato<input value={format.label} onChange={(event) => updateFormat(format.id, { label: event.target.value })} placeholder="Bolsa 1 kg" /></label><label>Cantidad<input type="number" min="0.01" step="0.01" value={format.quantity} onChange={(event) => updateFormat(format.id, { quantity: Number(event.target.value) })} /></label><label>Precio<input type="number" min="0" step="1" value={format.price} onChange={(event) => updateFormat(format.id, { price: Number(event.target.value) })} /></label><button type="button" aria-label="Eliminar formato" onClick={() => setDraft((current) => ({ ...current, formats: current.formats.filter((item) => item.id !== format.id) }))}><Trash2 size={15} /></button></div>)}</div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onDone}>Cancelar</button><button type="submit" className="primary-button wide">Guardar ingrediente</button></div>
    </form>
  );
}

export function IngredientsView() {
  const { state, actions } = useMealPrep();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const filtered = useMemo(() => state.ingredients.filter((ingredient) => `${ingredient.name} ${ingredient.category}`.toLowerCase().includes(query.toLowerCase())), [query, state.ingredients]);
  const remove = (ingredient: Ingredient) => { if (window.confirm(`Eliminar ${ingredient.name}? También se quitará de las recetas.`)) actions.deleteIngredient(ingredient.id); };

  return (
    <div className="module-view">
      <div className="module-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ingrediente o categoría…" /></div><button className="primary-button" type="button" onClick={() => setEditing(emptyIngredient())}><Plus size={16} />Nuevo ingrediente</button></div>
      <section className="data-panel">
        <div className="data-summary"><div><strong>{state.ingredients.length}</strong><span>ingredientes</span></div><div><strong>{state.ingredients.reduce((total, item) => total + item.formats.length, 0)}</strong><span>formatos de compra</span></div><div><strong>{new Set(state.ingredients.map((item) => item.category)).size}</strong><span>categorías</span></div></div>
        <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Ingrediente</th><th>Nutrición</th><th>Mejor precio</th><th>Formatos</th><th aria-label="Acciones" /></tr></thead><tbody>{filtered.map((ingredient) => <tr key={ingredient.id}><td><div className="ingredient-name"><span>{ingredient.name.slice(0, 1).toUpperCase()}</span><div><strong>{ingredient.name}</strong><small>{ingredient.category} · por {ingredient.nutritionBasis} {ingredient.unit}</small></div></div></td><td><strong>{ingredient.calories} kcal</strong><small>{ingredient.protein} P · {ingredient.carbs} C · {ingredient.fat} G</small></td><td><strong>{formatCLP(ingredientUnitCost(ingredient) * (ingredient.unit === "unidad" ? 1 : 1000))}</strong><small>por {ingredient.unit === "unidad" ? "unidad" : ingredient.unit === "ml" ? "litro" : "kg"}</small></td><td><span className="format-badge"><PackagePlus size={13} />{ingredient.formats.length}</span></td><td><div className="row-actions"><button type="button" onClick={() => setEditing(ingredient)} aria-label={`Editar ${ingredient.name}`}><Edit3 size={15} /></button><button type="button" onClick={() => remove(ingredient)} aria-label={`Eliminar ${ingredient.name}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>
        {filtered.length === 0 ? <div className="empty-state"><PackagePlus size={28} /><h3>No encontramos ingredientes</h3><p>Cambia la búsqueda o crea uno nuevo.</p></div> : null}
      </section>
      {editing ? <SidePanel title={editing.name || "Nuevo ingrediente"} subtitle="Macros y precios se propagan automáticamente a todas las recetas." onClose={() => setEditing(null)}><IngredientForm key={editing.id} initial={editing} onDone={() => setEditing(null)} /></SidePanel> : null}
    </div>
  );
}
