"use client";

import { X } from "lucide-react";

export function SidePanel({ title, subtitle, children, onClose }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="sheet-layer" role="presentation">
      <button className="sheet-backdrop" type="button" onClick={onClose} aria-label="Cerrar panel" />
      <aside className="side-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="sheet-header">
          <div><span className="eyebrow">Edición rápida</span><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </header>
        <div className="sheet-body">{children}</div>
      </aside>
    </div>
  );
}
