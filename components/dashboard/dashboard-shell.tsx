"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MacroOverview } from "@/components/dashboard/macro-overview";
import { MealsList } from "@/components/dashboard/meals-list";
import { ShoppingPreview } from "@/components/dashboard/shopping-preview";
import { Topbar } from "@/components/dashboard/topbar";
import { WeekStrip } from "@/components/dashboard/week-strip";
import { Sidebar, type AppView } from "@/components/navigation/sidebar";
import { WeeklyPlanner } from "@/components/planner/weekly-planner";

const SpendChart = dynamic(() => import("@/components/dashboard/spend-chart"), {
  ssr: false,
  loading: () => <div className="panel chart-skeleton" aria-label="Cargando gráfico" />,
});

export function DashboardShell() {
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [selectedDay, setSelectedDay] = useState("lun");

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="main-content">
        <Topbar view={activeView} />
        {activeView === "planner" ? <WeeklyPlanner /> : activeView === "dashboard" ? (
          <div className="dashboard-content">
            <WeekStrip selected={selectedDay} onSelect={setSelectedDay} />
            <section className="metrics-grid" aria-label="Indicadores de gasto">
              <MetricCard label="Costo semanal" value="$35.480" detail="$2.920 menos que la semana pasada" trend="down" tone="accent" />
              <MetricCard label="Estimación mensual" value="$153.700" detail="Dentro de tu presupuesto" trend="flat" />
              <MetricCard label="Costo por comida" value="$2.365" detail="8% más eficiente" trend="down" />
              <MetricCard label="Promedio diario" value="$5.068" detail="$68 sobre el objetivo" trend="up" />
            </section>
            <section className="overview-grid"><MacroOverview /><SpendChart /></section>
            <section className="lower-grid"><MealsList /><ShoppingPreview /></section>
          </div>
        ) : (
          <section className="empty-view">
            <span>Próximo módulo</span>
            <h2>{activeView === "recipes" ? "Tu biblioteca de recetas" : activeView === "ingredients" ? "Tu base de ingredientes" : "Tu compra consolidada"}</h2>
            <p>La arquitectura ya está preparada para conectar este módulo con recetas, costos y objetivos nutricionales.</p>
            <button type="button" className="primary-button">Comenzar módulo</button>
          </section>
        )}
      </main>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        <button className={activeView === "dashboard" ? "active" : ""} onClick={() => setActiveView("dashboard")} type="button">Resumen</button>
        <button className={activeView === "planner" ? "active" : ""} onClick={() => setActiveView("planner")} type="button">Semana</button>
        <button className={activeView === "shopping" ? "active" : ""} onClick={() => setActiveView("shopping")} type="button">Compras</button>
      </nav>
    </div>
  );
}
