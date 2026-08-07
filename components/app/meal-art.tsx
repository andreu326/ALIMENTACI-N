"use client";

/**
 * Ilustraciones de los tres platos. Dibujadas a mano, monocromas, con el mismo
 * peso de trazo que el resto de la interfaz. Nada de fotos de stock.
 * ViewBox de 40 para que respiren dentro del recuadro de 56.
 */

const LINE = {
  fill: "none",
  stroke: "var(--c6)",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const DOT = { fill: "var(--c5)", stroke: "none" };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      {children}
    </svg>
  );
}

/** Huevo frito sobre marraqueta partida. */
function Desayuno() {
  return (
    <Frame>
      {/* marraqueta: dos lóbulos con el corte al medio */}
      <path d="M7 27.5c0-4.2 2.6-7 6.4-7s6.4 2.8 6.4 7Z" {...LINE} />
      <path d="M19.8 27.5c0-4.2 2.6-7 6.4-7s6.4 2.8 6.4 7Z" {...LINE} />
      <path d="M7 27.5h25.6" {...LINE} />
      <path d="M19.8 21.6v5.9" {...LINE} />
      {/* huevo frito encima, desbordando el pan */}
      <path d="M13.4 17.2c-3.5 0-5.7-1.9-5.7-4.4 0-2.6 2-4.6 4.6-4.6 1.5 0 2.3.7 3.6.7 1.6 0 2.4-1.3 4.2-1.3 2.4 0 4 1.8 4 4 0 3.1-3.1 5.6-6.9 5.6Z"
        fill="var(--c1)" stroke="var(--c6)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="15.4" cy="12.2" r="2.5" {...DOT} />
    </Frame>
  );
}

/** Filete de pollo sobre montículo de arroz, en plato. */
function Almuerzo() {
  return (
    <Frame>
      {/* plato visto de lado */}
      <path d="M4.5 26.5h31" {...LINE} />
      <path d="M8 26.5c-1.6 2.4-.2 5.2 2.6 5.2h18.8c2.8 0 4.2-2.8 2.6-5.2" {...LINE} />
      {/* arroz */}
      <path d="M10.5 26.5c0-4 4.3-6.6 9.5-6.6s9.5 2.6 9.5 6.6" {...LINE} />
      <circle cx="14.6" cy="23.8" r="1.05" {...DOT} />
      <circle cx="19.4" cy="22.6" r="1.05" {...DOT} />
      <circle cx="24.4" cy="23.9" r="1.05" {...DOT} />
      {/* filete de pollo */}
      <path d="M13.6 19.6c-.6-3.4 2-6.4 6.2-6.4s6.9 3 6.3 6.4" fill="var(--c2)" stroke="var(--c6)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16.6 17.6h6.4" {...LINE} />
    </Frame>
  );
}

/** Cacerola de puré con lentejas y un tenedor. */
function Cena() {
  return (
    <Frame>
      {/* tenedor a la izquierda */}
      <path d="M6.8 8.5v5.2M9.4 8.5v5.2M8.1 13.7v17.8M6.8 11.1h2.6" {...LINE} />
      {/* cacerola */}
      <path d="M14.5 18.8h19v5.4c0 4.6-4.3 7.6-9.5 7.6s-9.5-3-9.5-7.6Z" {...LINE} />
      <path d="M33.5 20.9h1.9a2 2 0 0 1 0 4h-1.9" {...LINE} />
      {/* puré: cresta encima del borde */}
      <path d="M16.4 18.8c1.3-2.6 3.4-3.9 5-2.7 1.3 1 1.9-1.5 3.9-1.5 1.7 0 2 2.2 3.4 1.6 1.5-.7 2.7.7 3 2.6" {...LINE} />
      {/* lentejas dentro */}
      <circle cx="19.9" cy="26.3" r="1.15" {...DOT} />
      <circle cx="24.1" cy="27.7" r="1.15" {...DOT} />
      <circle cx="28.2" cy="25.9" r="1.15" {...DOT} />
    </Frame>
  );
}

/** Plato genérico, por si se agrega una receta nueva. */
function Generico() {
  return (
    <Frame>
      <circle cx="20" cy="20" r="12.5" {...LINE} />
      <circle cx="20" cy="20" r="7" {...LINE} />
    </Frame>
  );
}

const ART: Record<string, () => React.ReactElement> = {
  desayuno: Desayuno,
  almuerzo: Almuerzo,
  cena: Cena,
};

export function MealArt({ recipeId }: { recipeId: string }) {
  const Art = ART[recipeId] ?? Generico;
  return (
    <span className="meal-art">
      <Art />
    </span>
  );
}
