"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartData } from "@/data/dashboard";
import { formatCLP } from "@/utils/format";

export default function SpendChart() {
  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Costo diario</span><h2>Ritmo de gasto</h2></div>
        <span className="chart-total">$35.480 <small>/ semana</small></span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 0, left: -26, bottom: 0 }}>
            <CartesianGrid stroke="#E7EAE3" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#7A8275", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9AA294", fontSize: 10 }} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip cursor={{ fill: "#F3F5EF" }} formatter={(value) => [formatCLP(Number(value)), "Costo"]} contentStyle={{ border: "1px solid #D9DED4", borderRadius: 10, boxShadow: "0 10px 30px rgba(23,34,59,.08)", fontSize: 12 }} />
            <Bar dataKey="costo" fill="#57745A" radius={[4, 4, 1, 1]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-note"><span /> El jueves supera el promedio en $420</div>
    </section>
  );
}
