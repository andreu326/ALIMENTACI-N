"use client";

import { CalendarDays, Check, Clipboard, CookingPot, PackageCheck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { formatCLP } from "@/utils/format";
import { getAmortizedWeeklyShoppingCost, getPurchaseProjection, getShoppingList, round } from "@/utils/mealprep-calculations";

function formatQuantity(value: number, unit: "g" | "ml" | "unidad") {
  if (unit === "g" && value >= 1000) return `${round(value / 1000, 2)} kg`;
  if (unit === "ml" && value >= 1000) return `${round(value / 1000, 2)} L`;
  return `${value.toLocaleString("es-CL")} ${unit}`;
}

function formatDate(value: string, weekday = false) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CL", { weekday: weekday ? "short" : undefined, day: "numeric", month: "short", year: "numeric" }).format(new Date(year, month - 1, day, 12)).replaceAll(".", "");
}

export function ShoppingView() {
  const { state, actions } = useMealPrep();
  const [copied, setCopied] = useState(false);
  const lines = getShoppingList(state);
  const total = lines.reduce((sum, line) => sum + line.cost, 0);
  const weeklyCost = getAmortizedWeeklyShoppingCost(lines);
  const projection = getPurchaseProjection(lines);
  const upcomingPurchases = projection.weeks.slice(0, 8);
  const cadence = {
    weekly: lines.filter((line) => line.weeksCovered < 1.5).length,
    pantry: lines.filter((line) => line.weeksCovered >= 1.5 && line.weeksCovered < 5).length,
    long: lines.filter((line) => line.weeksCovered >= 5).length,
  };
  const checked = lines.filter((line) => state.checkedShoppingIds.includes(line.ingredientId)).length;
  const copy = async () => { const text = lines.map((line) => `${state.checkedShoppingIds.includes(line.ingredientId) ? "✓" : "□"} ${line.name}: ${line.packages} × ${line.formatLabel} — ${formatCLP(line.cost)}`).join("\n"); try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } };

  return (
    <div className="module-view">
      <div className="shopping-hero"><div><span className="eyebrow">Plan de compras · 11 meses</span><h2>Primera compra: viernes 7 de agosto</h2><p>Compra el viernes —sábado como respaldo— y cocina el domingo. Proyección hasta el 6 de julio de 2027.</p></div><div className="shopping-hero-actions"><button type="button" className="secondary-button" onClick={() => state.checkedShoppingIds.forEach(actions.toggleShopping)}><RotateCcw size={15} />Desmarcar</button><button type="button" className="primary-button" onClick={copy}><Clipboard size={15} />{copied ? "Copiada" : "Copiar lista"}</button></div></div>
      <div className="purchase-summary" aria-label="Resumen de gastos proyectados"><article><span>Primera compra</span><strong>{formatCLP(projection.firstPurchaseCost)}</strong><small>{formatDate(projection.startDate, true)} · {lines.length} productos</small></article><article><span>Caja semanal promedio</span><strong>{formatCLP(projection.averageWeeklyCost)}</strong><small>consumo real: {formatCLP(weeklyCost)} por semana</small></article><article><span>Caja mensual promedio</span><strong>{formatCLP(projection.averageMonthlyCost)}</strong><small>promedio de 11 periodos</small></article><article className="projection-total"><span>Total 11 meses</span><strong>{formatCLP(projection.totalCost)}</strong><small>hasta {formatDate(projection.endDate)}</small></article></div>
      <section className="purchase-calendar"><div className="purchase-section-heading"><div><CalendarDays size={17} /><span><strong>Próximas compras</strong><small>Viernes de compra · domingo de cocina</small></span></div><span className="purchase-window">Inicio {formatDate(projection.startDate)}</span></div><div className="purchase-week-list">{upcomingPurchases.map((week) => <article key={week.purchaseDate}><div className="purchase-date"><span>Semana {week.week}</span><strong>{formatDate(week.purchaseDate, true)}</strong><small><CookingPot size={12} /> Cocina {formatDate(week.cookDate)}</small></div><div className="purchase-items"><strong>{week.items.length} productos</strong><small>{week.items.slice(0, 3).map((item) => item.name).join(" · ")}{week.items.length > 3 ? ` · +${week.items.length - 3}` : ""}</small></div><b>{formatCLP(week.cost)}</b></article>)}</div></section>
      <section className="purchase-calendar monthly-projection"><div className="purchase-section-heading"><div><CalendarDays size={17} /><span><strong>Estimación de caja · 11 meses</strong><small>Periodos móviles desde el día 7 de cada mes</small></span></div><span className="purchase-window">{formatDate(projection.startDate)} – {formatDate(projection.endDate)}</span></div><div className="projection-grid">{projection.periods.map((period, index) => <article key={period.startDate}><span>Mes {index + 1}</span><strong>{period.label}</strong><b>{formatCLP(period.cost)}</b><small>{period.weeks} semanas · {period.purchaseDays} compras</small></article>)}</div></section>
      <div className="cadence-strip" aria-label="Cadencia de reposición"><div><span>Compra frecuente</span><strong>{cadence.weekly}</strong><small>cada semana</small></div><div><span>Despensa media</span><strong>{cadence.pantry}</strong><small>cada 2–4 semanas</small></div><div><span>Larga duración</span><strong>{cadence.long}</strong><small>5 semanas o más</small></div><div className="cadence-total"><span>Promedio sincronizado</span><strong>{formatCLP(weeklyCost)}</strong><small>costo por semana</small></div></div>
      <div className="shopping-completion"><div><span style={{ width: `${lines.length ? checked / lines.length * 100 : 0}%` }} /></div><strong>{checked} de {lines.length} comprados</strong></div>
      <section className="data-panel shopping-data-panel"><div className="data-table-wrap"><table className="data-table shopping-table"><thead><tr><th>Producto</th><th>Necesitas</th><th>Comprar</th><th>Sobrante</th><th>Reposición</th><th>Costo compra</th><th>Costo/sem.</th></tr></thead><tbody>{lines.map((line) => { const isChecked = state.checkedShoppingIds.includes(line.ingredientId); return <tr className={isChecked ? "completed" : ""} key={line.ingredientId} onClick={() => actions.toggleShopping(line.ingredientId)}><td><div className="ingredient-name"><span className="shopping-checkbox">{isChecked ? <Check size={14} /> : null}</span><div><strong>{line.name}</strong><small>{line.packages} {line.packages === 1 ? "envase" : "envases"}</small></div></div></td><td><strong>{formatQuantity(line.required, line.unit)}</strong></td><td><strong>{line.packages} × {line.formatLabel}</strong><small>{formatQuantity(line.purchased, line.unit)} en total</small></td><td><strong>{formatQuantity(line.surplus, line.unit)}</strong></td><td><strong>Cada {line.weeksCovered} sem.</strong><small>según el consumo del plan</small></td><td><strong>{formatCLP(line.cost)}</strong></td><td><strong>{formatCLP(line.weeklyCost)}</strong><small>promedio semanal</small></td></tr>; })}</tbody></table></div>{lines.length === 0 ? <div className="empty-state"><PackageCheck size={30} /><h3>Tu lista está vacía</h3><p>Añade recetas al plan semanal y volveremos a calcularla.</p></div> : null}</section>
    </div>
  );
}
