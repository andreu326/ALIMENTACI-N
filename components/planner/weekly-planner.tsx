"use client";

import { useState } from "react";
import { Copy, GripVertical, Plus } from "lucide-react";

const plannerDays = ["Lunes 4", "Martes 5", "Miércoles 6", "Jueves 7", "Viernes 8"];
const initialMeals = [
  { slot: "Desayuno", name: "Avena, manzana y canela", color: "oat" },
  { slot: "Almuerzo", name: "Pollo cítrico con arroz", color: "green" },
  { slot: "Cena", name: "Pasta al pesto", color: "blue" },
];

export function WeeklyPlanner() {
  const [notice, setNotice] = useState("Arrastra o duplica una comida para repetirla durante la semana.");
  return (
    <section className="planner-view">
      <div className="planner-toolbar">
        <p>{notice}</p>
        <div><button type="button" className="secondary-button">5 comidas / día</button><button type="button" className="primary-button"><Plus size={16} />Añadir receta</button></div>
      </div>
      <div className="planner-grid">
        {plannerDays.map((day, dayIndex) => (
          <article className="planner-day" key={day}>
            <header><span>{day.split(" ")[0]}</span><strong>{day.split(" ")[1]}</strong><small>{dayIndex === 0 ? "$4.860" : `$${(4380 + dayIndex * 260).toLocaleString("es-CL")}`}</small></header>
            <div className="planner-day-body">
              {initialMeals.map((meal, mealIndex) => (
                <div className={`planner-meal ${meal.color}`} key={`${day}-${meal.slot}`}>
                  <div className="planner-meal-top"><GripVertical size={13} /><span>{meal.slot}</span><button type="button" onClick={() => setNotice(`${meal.name} duplicada en ${plannerDays[Math.min(dayIndex + 1, plannerDays.length - 1)]}.`)} aria-label={`Duplicar ${meal.name}`}><Copy size={13} /></button></div>
                  <strong>{dayIndex > 2 && mealIndex === 2 ? "Sopa de verduras" : meal.name}</strong>
                  <span>{[410, 620, 540][mealIndex]} kcal · {[`$760`, `$1.840`, `$1.530`][mealIndex]}</span>
                </div>
              ))}
              <button type="button" className="add-slot" onClick={() => setNotice(`Elige una receta para ${day}.`)}><Plus size={14} />Añadir snack</button>
            </div>
            <footer><span>2.010 kcal</span><strong>91%</strong></footer>
          </article>
        ))}
      </div>
    </section>
  );
}
