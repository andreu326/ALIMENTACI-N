"use client";

/**
 * Anillos de macros. Monocromo a propósito: la diferencia entre uno y otro se
 * lee por posición y etiqueta, no por color. El arco nunca pasa de la vuelta
 * completa, pero la cifra sí muestra el exceso.
 */

type ArcProps = {
  size: number;
  stroke: number;
  ratio: number;
  soft?: boolean;
  delayMs?: number;
};

function Arc({ size, stroke, ratio, soft, delayMs = 0 }: ArcProps) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(Math.max(ratio, 0), 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        className="ring-track"
        cx={size / 2} cy={size / 2} r={r}
        fill="none" strokeWidth={stroke}
      />
      <circle
        className={`ring-arc${soft ? " soft" : ""}`}
        cx={size / 2} cy={size / 2} r={r}
        fill="none" strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - filled)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transitionDelay: `${delayMs}ms` }}
      />
    </svg>
  );
}

export function CalorieRing({ value, target }: { value: number; target: number }) {
  const ratio = target > 0 ? value / target : 0;
  return (
    <div className="ring-hero">
      <Arc size={124} stroke={7} ratio={ratio} />
      <div className="ring-hero-center">
        <span className="ring-hero-value num">{Math.round(value).toLocaleString("es-CL")}</span>
        <span className="ring-hero-label">de {target.toLocaleString("es-CL")}</span>
      </div>
    </div>
  );
}

type MacroRingProps = {
  letter: string;
  name: string;
  value: number;
  target: number;
  index: number;
};

export function MacroRing({ letter, name, value, target, index }: MacroRingProps) {
  const ratio = target > 0 ? value / target : 0;
  const diff = Math.round(value - target);
  return (
    <div className="ring-row">
      <span className="ring-mini">
        <Arc size={34} stroke={3.5} ratio={ratio} soft delayMs={120 + index * 90} />
        <span className="ring-mini-letter">{letter}</span>
      </span>
      <span className="ring-info">
        <span className="ring-name">{name}</span>
        <span className="ring-figures num">
          {Math.round(value)} g <small>/ {target} g · {diff >= 0 ? "+" : ""}{diff}</small>
        </span>
      </span>
    </div>
  );
}

type RingsProps = {
  calories: number; protein: number; carbs: number; fat: number;
  targets: { calories: number; protein: number; carbs: number; fat: number };
};

export function MacroRings({ calories, protein, carbs, fat, targets }: RingsProps) {
  return (
    <div className="rings">
      <CalorieRing value={calories} target={targets.calories} />
      <div className="ring-set">
        <MacroRing letter="P" name="Proteína" value={protein} target={targets.protein} index={0} />
        <MacroRing letter="C" name="Carbohidratos" value={carbs} target={targets.carbs} index={1} />
        <MacroRing letter="G" name="Grasa" value={fat} target={targets.fat} index={2} />
      </div>
    </div>
  );
}
