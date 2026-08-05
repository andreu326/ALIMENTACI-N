"use client";

import { useMemo, useState } from "react";
import { Clock3, Edit3, Plus, Search, Trash2, Utensils } from "lucide-react";
import { z } from "zod";
import { SidePanel } from "@/components/ui/side-panel";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import type { Recipe, RecipeIngredient } from "@/types/mealprep";
import { formatCLP } from "@/utils/format";
import { getRecipeTotals, round } from "@/utils/mealprep-calculations";

const recipeSchema = z.object({ name: z.string().trim().min(2, "Escribe un nombre"), category: z.string().trim().min(2, "Escribe una categoría"), servings: z.number().positive("Las porciones deben ser mayores a cero"), ingredients: z.array(z.object({ ingredientId: z.string().min(1), quantity: z.number().positive() })).min(1, "Añade al menos un ingrediente") });

const emptyRecipe = (ingredientId: string): Recipe => ({ id: crypto.randomUUID(), name: "", category: "", servings: 4, prepMinutes: 20, notes: "", ingredients: ingredientId ? [{ ingredientId, quantity: 100 }] : [] });

function RecipeForm({ initial, onDone }: { initial: Recipe; onDone: () => void }) {
  const { state, actions } = useMealPrep();
  const [draft, setDraft] = useState<Recipe>(() => structuredClone(initial));
  const [error, setError] = useState("");
  const totals = useMemo(() => getRecipeTotals(draft, state.ingredients), [draft, state.ingredients]);
  const perServing = { calories: round(totals.calories / Math.max(draft.servings, 1)), protein: round(totals.protein / Math.max(draft.servings, 1), 1), carbs: round(totals.carbs / Math.max(draft.servings, 1), 1), fat: round(totals.fat / Math.max(draft.servings, 1), 1), cost: round(totals.cost / Math.max(draft.servings, 1)) };
  const updateLine = (index: number, patch: Partial<RecipeIngredient>) => setDraft((current) => ({ ...current, ingredients: current.ingredients.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line) }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); const result = recipeSchema.safeParse(draft); if (!result.success) { setError(result.error.issues[0]?.message ?? "Revisa los campos"); return; } actions.saveRecipe({ ...draft, name: draft.name.trim(), category: draft.category.trim() }); onDone(); };

  return (
    <form className="editor-form" onSubmit={submit}>
      <div className="field-grid two"><label>Nombre<input autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ej. Curry de garbanzos" /></label><label>Categoría<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Almuerzo" /></label></div>
      <div className="field-grid two"><label>Porciones<input type="number" min="0.5" step="0.5" value={draft.servings} onChange={(event) => setDraft({ ...draft, servings: Number(event.target.value) })} /></label><label>Preparación (min)<input type="number" min="0" step="1" value={draft.prepMinutes} onChange={(event) => setDraft({ ...draft, prepMinutes: Number(event.target.value) })} /></label></div>
      <div className="recipe-live-summary"><div><span>Por porción</span><strong>{perServing.calories} kcal</strong></div><div><span>Proteínas</span><strong>{perServing.protein} g</strong></div><div><span>Carbos</span><strong>{perServing.carbs} g</strong></div><div><span>Grasas</span><strong>{perServing.fat} g</strong></div><div className="cost"><span>Costo</span><strong>{formatCLP(perServing.cost)}</strong></div></div>
      <div className="form-section"><div className="form-section-title inline"><div><h3>Ingredientes</h3><span>Los totales se recalculan al instante</span></div><button className="mini-button" type="button" disabled={state.ingredients.length === 0} onClick={() => setDraft((current) => ({ ...current, ingredients: [...current.ingredients, { ingredientId: state.ingredients[0]?.id ?? "", quantity: 100 }] }))}><Plus size={13} />Ingrediente</button></div>
        <div className="recipe-lines">{draft.ingredients.map((line, index) => { const ingredient = state.ingredients.find((item) => item.id === line.ingredientId); return <div className="recipe-line-editor" key={`${line.ingredientId}-${index}`}><label>Ingrediente<select value={line.ingredientId} onChange={(event) => updateLine(index, { ingredientId: event.target.value })}>{state.ingredients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Cantidad<div className="input-suffix"><input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} /><span>{ingredient?.unit ?? "g"}</span></div></label><button type="button" onClick={() => setDraft((current) => ({ ...current, ingredients: current.ingredients.filter((_, lineIndex) => lineIndex !== index) }))} aria-label="Quitar ingrediente"><Trash2 size={15} /></button></div>; })}</div>
      </div>
      <label>Notas<textarea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Preparación, conservación o sustituciones…" rows={3} /></label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onDone}>Cancelar</button><button type="submit" className="primary-button wide">Guardar receta</button></div>
    </form>
  );
}

export function RecipesView() {
  const { state, actions } = useMealPrep();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Recipe | null>(null);
  const recipes = useMemo(() => state.recipes.filter((recipe) => `${recipe.name} ${recipe.category}`.toLowerCase().includes(query.toLowerCase())), [query, state.recipes]);
  const remove = (recipe: Recipe) => { if (window.confirm(`Eliminar ${recipe.name}? También se quitará del plan semanal.`)) actions.deleteRecipe(recipe.id); };

  return (
    <div className="module-view">
      <div className="module-toolbar"><div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar receta o categoría…" /></div><button className="primary-button" type="button" disabled={state.ingredients.length === 0} onClick={() => setEditing(emptyRecipe(state.ingredients[0]?.id ?? ""))}><Plus size={16} />Nueva receta</button></div>
      {state.ingredients.length === 0 ? <div className="notice-banner">Crea al menos un ingrediente antes de añadir recetas.</div> : null}
      <div className="recipe-grid">{recipes.map((recipe) => { const totals = getRecipeTotals(recipe, state.ingredients); const divisor = Math.max(recipe.servings, 1); return <article className="recipe-card" key={recipe.id}><div className="recipe-card-top"><span className="recipe-icon"><Utensils size={18} /></span><span className="category-pill">{recipe.category}</span><div className="row-actions"><button type="button" onClick={() => setEditing(recipe)} aria-label={`Editar ${recipe.name}`}><Edit3 size={15} /></button><button type="button" onClick={() => remove(recipe)} aria-label={`Eliminar ${recipe.name}`}><Trash2 size={15} /></button></div></div><h3>{recipe.name}</h3><p><Clock3 size={13} />{recipe.prepMinutes} min · {recipe.servings} porciones · {recipe.ingredients.length} ingredientes</p><div className="recipe-macros"><div><strong>{round(totals.calories / divisor)}</strong><span>kcal</span></div><div><strong>{round(totals.protein / divisor, 1)}g</strong><span>proteína</span></div><div><strong>{round(totals.carbs / divisor, 1)}g</strong><span>carbos</span></div><div><strong>{round(totals.fat / divisor, 1)}g</strong><span>grasas</span></div></div><footer><span>Costo por porción</span><strong>{formatCLP(totals.cost / divisor)}</strong></footer></article>; })}</div>
      {recipes.length === 0 ? <div className="empty-state standalone"><Utensils size={28} /><h3>No hay recetas aquí</h3><p>Crea una receta a partir de tus ingredientes.</p></div> : null}
      {editing ? <SidePanel title={editing.name || "Nueva receta"} subtitle="Nutrición y costos provienen exclusivamente de sus ingredientes." onClose={() => setEditing(null)}><RecipeForm key={editing.id} initial={editing} onDone={() => setEditing(null)} /></SidePanel> : null}
    </div>
  );
}
