"use client";

import { Bell, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AppView } from "@/components/navigation/sidebar";

const titles: Record<AppView, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: "4–10 de agosto", title: "Tu semana, en balance" },
  planner: { eyebrow: "Semana 32", title: "Plan semanal" },
  recipes: { eyebrow: "Biblioteca", title: "Recetas" },
  ingredients: { eyebrow: "Base de datos", title: "Ingredientes" },
  shopping: { eyebrow: "Compra semanal", title: "Lista de compras" },
  targets: { eyebrow: "Preferencias", title: "Objetivos y presupuesto" },
};

export function Topbar({ view, actionLabel = "Nueva comida", onAction = () => undefined }: { view: AppView; actionLabel?: string; onAction?: () => void }) {
  const current = titles[view];
  return (
    <header className="topbar">
      <div className="title-block">
        <span className="eyebrow">{current.eyebrow}</span>
        <h1>{current.title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="week-controls" aria-label="Cambiar semana">
          <button type="button" aria-label="Semana anterior"><ChevronLeft size={17} /></button>
          <button type="button" aria-label="Semana siguiente"><ChevronRight size={17} /></button>
        </div>
        <button className="icon-button" type="button" aria-label="Notificaciones"><Bell size={18} /></button>
        <button className="primary-button" type="button" onClick={onAction}><Plus size={17} />{actionLabel}</button>
      </div>
    </header>
  );
}
