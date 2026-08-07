/**
 * Sesión firmada para el portón de la app.
 *
 * Vercel sólo ofrece protección con contraseña en Enterprise o con el add-on de
 * $150/mes en Pro, así que el portón lo hace este middleware. Corre en el Edge
 * ANTES de servir el HTML, o sea que es protección real y no una cortina de
 * JavaScript: sin cookie válida el navegador nunca recibe la página.
 *
 * Se usa Web Crypto porque es lo único disponible en el runtime Edge, y evita
 * sumar una dependencia sólo para firmar un token.
 */

export const SESSION_COOKIE = "mp_session";

/** Duración de la sesión. Un mes: es una app personal, no un banco. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

/** Comparación en tiempo constante: evita filtrar el secreto por temporización. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(secret: string): Promise<{ value: string; maxAge: number }> {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(expires);
  return { value: `${payload}.${await hmac(secret, payload)}`, maxAge: MAX_AGE_SECONDS };
}

export async function verifySession(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expires = Number(payload);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;

  return safeEqual(signature, await hmac(secret, payload));
}

export async function checkPassword(expected: string, given: string): Promise<boolean> {
  // Se comparan los hashes y no el texto, para que la comparación en tiempo
  // constante funcione aunque las contraseñas tengan largos distintos.
  const [a, b] = await Promise.all([
    hmac("pw", expected),
    hmac("pw", given),
  ]);
  return safeEqual(a, b);
}
