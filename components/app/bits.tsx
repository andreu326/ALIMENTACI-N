"use client";

import { formatCLP } from "@/utils/mealprep-calculations";

export function CheckMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.4 4.8 8.7 9.5 3.6"
        stroke="var(--c0)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Chevron({ dir = "right" }: { dir?: "right" | "left" }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"
      style={{ transform: dir === "left" ? "rotate(180deg)" : undefined, flexShrink: 0 }}>
      <path d="m4.8 2.6 4 3.9-4 3.9" stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "1000 días" no le dice nada a nadie parado en el pasillo. */
export function durationLabel(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return years >= 2 ? `${years} años` : "más de un año";
  }
  if (days >= 60) return `${Math.round(days / 30)} meses`;
  return `${days} días`;
}

/** 12000 g no se lee; 12 kg sí. */
export function quantityLabel(value: number, unit: string): string {
  if (unit === "unidad") return `${Math.round(value)} un`;
  if (value >= 1000) {
    const big = value / 1000;
    return `${big % 1 === 0 ? big : big.toFixed(1)} ${unit === "ml" ? "L" : "kg"}`;
  }
  return `${Math.round(value)} ${unit}`;
}

export function Figure({ value, unit }: { value: number; unit?: string }) {
  return (
    <p className="headline-figure">
      <span className="amount num">{formatCLP(value)}</span>
      {unit ? <span className="unit">{unit}</span> : null}
    </p>
  );
}

type MacroProps = {
  label: string;
  value: number;
  target: number;
  suffix?: string;
  index: number;
};

/** Barra de macro. Verde en rango (±7%), ámbar si se pasa, gris si falta. */
export function Macro({ label, value, target, suffix = "g", index }: MacroProps) {
  const ratio = target > 0 ? value / target : 0;
  const pct = Math.min(ratio, 1.25) / 1.25;
  const state = ratio > 1.07 ? "over" : ratio >= 0.93 ? "on-target" : "";
  return (
    <div className="macro">
      <span className="macro-label">{label}</span>
      <span className="macro-track">
        <span
          className={`macro-fill ${state}`}
          style={{ width: `${pct * 100}%`, ["--i" as string]: index }}
        />
      </span>
      <span className="macro-value num">
        <b>{Math.round(value)}</b>
        {" / "}
        {target}
        {suffix}
      </span>
    </div>
  );
}
