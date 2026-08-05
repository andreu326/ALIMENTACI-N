"use client";

import { useState } from "react";
import { ArrowRight, Check, ShoppingBasket } from "lucide-react";
import { initialShoppingItems } from "@/data/dashboard";
import { formatCLP } from "@/utils/format";

export function ShoppingPreview() {
  const [items, setItems] = useState(() => initialShoppingItems);
  const checked = items.filter((item) => item.checked).length;
  const toggle = (id: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));

  return (
    <section className="panel shopping-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Compra recomendada</span><h2>Lo que falta</h2></div>
        <span className="shopping-count">{checked}/{items.length}</span>
      </div>
      <div className="shopping-progress"><span style={{ width: `${(checked / items.length) * 100}%` }} /></div>
      <div className="shopping-list">
        {items.map((item) => (
          <label className={`shopping-row ${item.checked ? "checked" : ""}`} key={item.id}>
            <input type="checkbox" checked={item.checked} onChange={() => toggle(item.id)} />
            <span className="custom-check">{item.checked ? <Check size={12} /> : null}</span>
            <span className="shopping-copy"><strong>{item.name}</strong><span>{item.required} → {item.format}</span></span>
            <span className="shopping-price">{formatCLP(item.cost)}</span>
          </label>
        ))}
      </div>
      <button className="shopping-cta" type="button"><ShoppingBasket size={16} />Abrir lista completa <ArrowRight size={15} /></button>
    </section>
  );
}
