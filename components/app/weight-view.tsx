"use client";

import { useMemo, useState } from "react";
import { PLAN_START } from "@/data/seed";
import { useMealPrep } from "@/components/providers/mealprep-provider";
import { Chevron } from "@/components/app/bits";
import type { Profile } from "@/types/mealprep";
import {
  ACTIVITY_LEVELS, formatDate, getWeightProjection, todayKey,
} from "@/utils/mealprep-calculations";

/** Curva de proyección contra pesajes reales. Monocromo: la proyección es fina
 *  y tenue, lo registrado es grueso y claro. */
function WeightChart({
  points,
}: {
  points: { date: string; projected: number; actual?: number }[];
}) {
  const w = 320, h = 120, padX = 4, padY = 10;
  const values = points.flatMap((p) => [p.projected, ...(p.actual !== undefined ? [p.actual] : [])]);
  const min = Math.min(...values), max = Math.max(...values);
  const span = Math.max(max - min, 1);

  const x = (i: number) => padX + (i / Math.max(points.length - 1, 1)) * (w - padX * 2);
  const y = (v: number) => padY + (1 - (v - min) / span) * (h - padY * 2);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.projected).toFixed(1)}`).join(" ");
  const logged = points.map((p, i) => ({ p, i })).filter(({ p }) => p.actual !== undefined);
  const actualLine = logged.length > 1
    ? logged.map(({ p, i }, n) => `${n === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.actual!).toFixed(1)}`).join(" ")
    : null;

  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img"
      aria-label={`Proyección de peso de ${min.toFixed(1)} a ${max.toFixed(1)} kilos`}>
      <path d={line} fill="none" stroke="var(--c4)" strokeWidth="1.5"
        strokeDasharray="3 4" strokeLinecap="round" />
      {actualLine ? (
        <path d={actualLine} fill="none" stroke="var(--c8)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {logged.map(({ p, i }) => (
        <circle key={p.date} cx={x(i)} cy={y(p.actual!)} r="3" fill="var(--c8)" />
      ))}
    </svg>
  );
}

function ProfileForm({ onDone }: { onDone: () => void }) {
  const { state, actions } = useMealPrep();
  const p = state.profile;
  const [sex, setSex] = useState<Profile["sex"]>(p?.sex ?? "m");
  const [age, setAge] = useState(p?.age ? String(p.age) : "");
  const [height, setHeight] = useState(p?.heightCm ? String(p.heightCm) : "");
  const [activity, setActivity] = useState(p?.activity ?? 1.375);
  const [weight, setWeight] = useState("");

  const ageN = Number(age), heightN = Number(height), weightN = Number(weight.replace(",", "."));
  const needsWeight = state.weightLog.length === 0;
  const valid = ageN >= 14 && ageN <= 100 && heightN >= 120 && heightN <= 230
    && (!needsWeight || (weightN >= 30 && weightN <= 300));

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        actions.setProfile({ sex, age: ageN, heightCm: heightN, activity });
        if (needsWeight) actions.logWeight(todayKey(), weightN);
        onDone();
      }}
    >
      <div className="field">
        <span className="field-label">Sexo</span>
        <div className="segments" style={{ marginTop: 0 }}>
          {(["m", "f"] as const).map((s) => (
            <button key={s} type="button" className="segment"
              aria-selected={sex === s} onClick={() => setSex(s)}>
              {s === "m" ? "Hombre" : "Mujer"}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Edad</span>
          <input className="input num" inputMode="numeric" value={age} placeholder="—"
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} />
        </label>
        <label className="field">
          <span className="field-label">Estatura (cm)</span>
          <input className="input num" inputMode="numeric" value={height} placeholder="—"
            onChange={(e) => setHeight(e.target.value.replace(/\D/g, "").slice(0, 3))} />
        </label>
      </div>

      {needsWeight ? (
        <label className="field">
          <span className="field-label">Peso actual (kg)</span>
          <input className="input num" inputMode="decimal" value={weight} placeholder="—"
            onChange={(e) => setWeight(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))} />
        </label>
      ) : null}

      <div className="field">
        <span className="field-label">Actividad</span>
        <ul className="choices">
          {ACTIVITY_LEVELS.map((level) => (
            <li key={level.value}>
              <button type="button" className="choice"
                aria-selected={activity === level.value}
                onClick={() => setActivity(level.value)}>
                <span>
                  <span className="choice-name">{level.label}</span>
                  <span className="choice-hint">{level.hint}</span>
                </span>
                <span className="choice-mark" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button type="submit" className="btn" disabled={!valid}>Guardar</button>
      <p className="field-note">
        La proyección usa Mifflin-St Jeor y ~7.700 kcal por kilo. Es una estimación:
        el peso real depende de sueño, entrenamiento y de cuánto te apegues al plan.
        Por eso la app compara la curva con lo que registres.
      </p>
    </form>
  );
}

export function WeightSection({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { state, actions } = useMealPrep();
  const [entry, setEntry] = useState("");

  const projection = useMemo(
    () => getWeightProjection(state, PLAN_START, 11),
    [state],
  );

  if (!state.profile || state.weightLog.length === 0) {
    return (
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Peso</h2>
        </div>
        <button type="button" className="band" onClick={onOpenProfile}>
          <span>
            <span className="meal-slot">Sin datos todavía</span>
            <span className="band-amount" style={{ display: "block", marginTop: 4, fontSize: "var(--text-md)", fontWeight: 500, letterSpacing: "-0.02em" }}>
              Ingresa tu peso, estatura y edad
            </span>
            <span className="row-sub" style={{ marginTop: 3 }}>
              Sin eso no se puede proyectar cuánto vas a subir
            </span>
          </span>
          <Chevron />
        </button>
      </section>
    );
  }

  const p = projection!;
  const last = state.weightLog[state.weightLog.length - 1];
  const gain = p.endWeight - p.startWeight;
  const value = Number(entry.replace(",", "."));
  const canLog = value >= 30 && value <= 300;

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Peso</h2>
        <button type="button" className="link" onClick={onOpenProfile}>Ajustar datos</button>
      </div>

      <div className="weight-top">
        <span>
          <span className="weight-now num">{last.kg.toFixed(1)}</span>
          <span className="weight-unit">kg hoy</span>
        </span>
        <span className="weight-goal">
          <span className="num">{p.endWeight.toFixed(1)} kg</span> proyectado
          <br />
          <span className="row-sub" style={{ display: "inline" }}>
            en 11 meses · <span className="num">{gain >= 0 ? "+" : ""}{gain.toFixed(1)} kg</span>
          </span>
        </span>
      </div>

      <WeightChart points={p.points} />

      <ul className="rows" style={{ marginTop: "var(--sp-md)" }}>
        <li className="row">
          <span className="row-main">
            <span className="row-name">Comes</span>
            <span className="row-sub">del plan actual</span>
          </span>
          <span className="row-value num">{p.intake.toLocaleString("es-CL")} kcal</span>
        </li>
        <li className="row">
          <span className="row-main">
            <span className="row-name">Gastas</span>
            <span className="row-sub">al peso de hoy</span>
          </span>
          <span className="row-value num dim">{p.tdeeStart.toLocaleString("es-CL")} kcal</span>
        </li>
        <li className="row">
          <span className="row-main">
            <span className="row-name">Superávit</span>
            <span className="row-sub">
              {p.weeklyRateStart >= 0 ? "+" : ""}{p.weeklyRateStart.toFixed(2)} kg por semana al ritmo de hoy
            </span>
          </span>
          <span className="row-value num">
            {p.surplusStart >= 0 ? "+" : ""}{p.surplusStart.toLocaleString("es-CL")} kcal
          </span>
        </li>
      </ul>

      <form
        className="logger"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canLog) return;
          actions.logWeight(todayKey(), value);
          setEntry("");
        }}
      >
        <input
          className="input num"
          inputMode="decimal"
          value={entry}
          placeholder="Registrar peso de hoy"
          aria-label="Peso de hoy en kilos"
          onChange={(e) => setEntry(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))}
        />
        <button type="submit" className="btn btn-sm" disabled={!canLog}>Guardar</button>
      </form>

      {p.drift !== null ? (
        <p className="note">
          Vas <strong>{p.drift >= 0 ? "+" : ""}{p.drift.toFixed(1)} kg</strong> respecto de la
          proyección. {Math.abs(p.drift) < 0.7
            ? "La estimación te está calzando bien."
            : p.drift > 0
              ? "Estás subiendo más rápido de lo previsto: o comes algo extra fuera del plan, o tu gasto real es menor al estimado."
              : "Estás subiendo más lento de lo previsto: o tu gasto real es mayor, o no estás comiendo todas las porciones del plan."}
        </p>
      ) : (
        <p className="note">
          Registra tu peso cada semana, siempre a la misma hora y en ayunas. Con dos
          o tres pesajes la app empieza a corregir la proyección contra la realidad.
        </p>
      )}

      {state.weightLog.length > 1 ? (
        <ul className="rows" style={{ marginTop: "var(--sp-md)" }}>
          {[...state.weightLog].reverse().slice(0, 6).map((w) => (
            <li key={w.date} className="row">
              <span className="row-main">
                <span className="row-sub" style={{ color: "var(--c6)" }}>{formatDate(w.date)}</span>
              </span>
              <span className="row-value num dim">{w.kg.toFixed(1)} kg</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function ProfileView({ onBack }: { onBack: () => void }) {
  return (
    <div className="page stagger">
      <header style={{ ["--i" as string]: 0 }}>
        <button type="button" className="back" onClick={onBack}>
          <Chevron dir="left" /> Volver
        </button>
        <p className="eyebrow" style={{ marginTop: 10 }}>Para proyectar el peso</p>
        <h1 className="title">Tus datos</h1>
      </header>
      <section style={{ ["--i" as string]: 1 }}>
        <ProfileForm onDone={onBack} />
      </section>
    </div>
  );
}
