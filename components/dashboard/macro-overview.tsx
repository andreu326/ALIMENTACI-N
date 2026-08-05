import { macros } from "@/data/dashboard";
import { percent } from "@/utils/format";

export function MacroOverview() {
  return (
    <section className="panel macro-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Promedio diario</span><h2>Objetivo nutricional</h2></div>
        <span className="good-pill">96% en rango</span>
      </div>
      <div className="macro-list">
        {macros.map((macro) => {
          const progress = percent(macro.planned, macro.target);
          const difference = macro.target - macro.planned;
          return (
            <div className="macro-row" key={macro.key}>
              <div className="macro-name"><span style={{ backgroundColor: macro.color }} /><strong>{macro.label}</strong></div>
              <div className="macro-values">
                <span><strong>{macro.planned.toLocaleString("es-CL")}</strong> / {macro.target.toLocaleString("es-CL")} {macro.unit}</span>
                <span className="difference">{difference > 0 ? `${difference} ${macro.unit} disponibles` : `${Math.abs(difference)} ${macro.unit} sobre objetivo`}</span>
              </div>
              <div className="macro-bar"><span style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: macro.color }} /></div>
              <span className="macro-percent">{progress}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
