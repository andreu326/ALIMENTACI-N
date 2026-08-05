"use client";

import { BookOpen, CalendarDays, ChartNoAxesCombined, ChefHat, Command, PackageOpen, Settings2, ShoppingBasket } from "lucide-react";

export type AppView = "dashboard" | "planner" | "recipes" | "ingredients" | "shopping" | "targets";

const items: { id: AppView; label: string; icon: typeof ChartNoAxesCombined }[] = [
  { id: "dashboard", label: "Resumen", icon: ChartNoAxesCombined },
  { id: "planner", label: "Plan semanal", icon: CalendarDays },
  { id: "recipes", label: "Recetas", icon: BookOpen },
  { id: "ingredients", label: "Ingredientes", icon: PackageOpen },
  { id: "shopping", label: "Compras", icon: ShoppingBasket },
];

type SidebarProps = {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
};

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand" aria-label="MealPrep inicio">
        <span className="brand-mark"><ChefHat size={18} strokeWidth={2.2} /></span>
        <span className="brand-name">MealPrep</span>
      </div>

      <nav className="main-nav" aria-label="Navegación principal">
        <p className="nav-label">Espacio de trabajo</p>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />
      <button className="command-button" type="button" aria-label="Abrir búsqueda rápida">
        <Command size={15} />
        <span>Búsqueda rápida</span>
        <kbd>⌘ K</kbd>
      </button>
      <button className="nav-item" type="button" onClick={() => onViewChange("targets")}>
        <Settings2 size={18} strokeWidth={1.8} />
        <span>Ajustes</span>
      </button>
      <div className="profile-row">
        <span className="avatar">TM</span>
        <div><strong>Tomás</strong><span>Plan personal</span></div>
        <span className="status-dot" title="Sincronizado" />
      </div>
    </aside>
  );
}
