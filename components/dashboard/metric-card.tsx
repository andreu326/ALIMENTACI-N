import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  trend?: "up" | "down" | "flat";
  tone?: "default" | "accent";
};

export function MetricCard({ label, value, detail, trend = "flat", tone = "default" }: MetricCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  return (
    <article className={`metric-card ${tone === "accent" ? "accent" : ""}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail"><TrendIcon size={14} />{detail}</span>
    </article>
  );
}
