"use client";

import { useState } from "react";

export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        window.location.href = next;
        return;
      }
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "No se pudo entrar.");
      setPassword("");
    } catch {
      setError("Sin conexión con el servidor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="gate">
      <div className="gate-inner stagger">
        <div style={{ ["--i" as string]: 0 }}>
          <p className="eyebrow">MealPrep</p>
          <h1 className="title" style={{ marginTop: 6 }}>Entra con tu clave</h1>
        </div>

        <form onSubmit={submit} style={{ ["--i" as string]: 1 }}>
          <label className="field">
            <span className="field-label">Contraseña</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "gate-error" : undefined}
            />
          </label>

          {error ? <p id="gate-error" className="gate-error" role="alert">{error}</p> : null}

          <button type="submit" className="btn" disabled={!password || busy}
            style={{ width: "100%", marginTop: "var(--sp-md)" }}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {!configured ? (
          <p className="note" style={{ ["--i" as string]: 2 }}>
            <strong>Sin proteger.</strong> Faltan <span className="num">APP_PASSWORD</span> y{" "}
            <span className="num">AUTH_SECRET</span> en las variables de entorno, así que
            cualquiera puede entrar. Defínelas en Vercel y vuelve a desplegar.
          </p>
        ) : null}
      </div>
    </main>
  );
}
