import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, checkPassword, createSession } from "@/lib/auth";

export const runtime = "edge";

/** Frena la fuerza bruta desde una misma IP. En memoria: se pierde al reiniciar
 *  la función, pero basta para una app personal de un solo usuario. */
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const LOCK_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || !secret) {
    return NextResponse.json(
      { error: "Falta configurar APP_PASSWORD y AUTH_SECRET." },
      { status: 500 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && record.until > now && record.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos." },
      { status: 429 },
    );
  }

  let given = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") given = body.password;
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  if (!(await checkPassword(password, given))) {
    const next = record && record.until > now
      ? { count: record.count + 1, until: record.until }
      : { count: 1, until: now + LOCK_MS };
    attempts.set(ip, next);
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  attempts.delete(ip);
  const session = await createSession(secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, session.value, {
    httpOnly: true,           // inaccesible desde JavaScript de la página
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
