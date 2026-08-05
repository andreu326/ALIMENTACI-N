export const formatCLP = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export const percent = (value: number, total: number) => Math.min(Math.round((value / total) * 100), 120);
