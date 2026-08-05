"use client";

import { weekDays } from "@/data/dashboard";
import { formatCLP } from "@/utils/format";

type WeekStripProps = {
  selected: string;
  onSelect: (id: string) => void;
};

export function WeekStrip({ selected, onSelect }: WeekStripProps) {
  return (
    <section className="week-strip" aria-label="Resumen diario de la semana">
      {weekDays.map((day) => {
        const progress = Math.min((day.calories / day.targetCalories) * 100, 100);
        return (
          <button
            key={day.id}
            type="button"
            className={`day-segment ${selected === day.id ? "selected" : ""}`}
            onClick={() => onSelect(day.id)}
            aria-pressed={selected === day.id}
          >
            <span className="day-heading"><strong>{day.short}</strong><span>{day.date}</span></span>
            <span className="day-cost">{formatCLP(day.cost)}</span>
            <span className="calorie-track"><span className={day.status} style={{ width: `${progress}%` }} /></span>
            <span className="day-calories">{day.calories.toLocaleString("es-CL")} kcal</span>
          </button>
        );
      })}
    </section>
  );
}
