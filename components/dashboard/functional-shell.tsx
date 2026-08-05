"use client";

import { useState } from "react";
import { FunctionalDashboard } from "@/components/dashboard/functional-dashboard";
import { Topbar } from "@/components/dashboard/topbar";
import { IngredientsView } from "@/components/ingredients/ingredients-view";
import { Sidebar, type AppView } from "@/components/navigation/sidebar";
import { FunctionalPlanner } from "@/components/planner/functional-planner";
import { RecipesView } from "@/components/recipes/recipes-view";
import { ShoppingView } from "@/components/shopping/shopping-view";
import { TargetsView } from "@/components/settings/targets-view";

const primaryActions: Record<AppView, { label: string; target: AppView }> = {
  dashboard: { label: "Planificar", target: "planner" },
  planner: { label: "Ver recetas", target: "recipes" },
  recipes: { label: "Ingredientes", target: "ingredients" },
  ingredients: { label: "Crear receta", target: "recipes" },
  shopping: { label: "Editar semana", target: "planner" },
  targets: { label: "Ver resumen", target: "dashboard" },
};

export function FunctionalShell() {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const primary = primaryActions[activeView];
  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="main-content">
        <Topbar view={activeView} actionLabel={primary.label} onAction={() => setActiveView(primary.target)} />
        {activeView === "dashboard" ? <FunctionalDashboard onNavigate={setActiveView} /> : null}
        {activeView === "planner" ? <FunctionalPlanner /> : null}
        {activeView === "recipes" ? <RecipesView /> : null}
        {activeView === "ingredients" ? <IngredientsView /> : null}
        {activeView === "shopping" ? <ShoppingView /> : null}
        {activeView === "targets" ? <TargetsView /> : null}
      </main>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        <button className={activeView === "dashboard" ? "active" : ""} onClick={() => setActiveView("dashboard")} type="button">Resumen</button>
        <button className={activeView === "planner" ? "active" : ""} onClick={() => setActiveView("planner")} type="button">Semana</button>
        <button className={activeView === "shopping" ? "active" : ""} onClick={() => setActiveView("shopping")} type="button">Compras</button>
      </nav>
    </div>
  );
}
