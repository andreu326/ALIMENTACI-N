import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * Portón de entrada. Corre en el Edge antes de servir cualquier página, así que
 * sin cookie válida el HTML nunca sale del servidor.
 *
 * Si faltan las variables de entorno la app queda abierta a propósito: es
 * preferible que funcione en local sin configurar nada, y el aviso en /login
 * deja claro que en producción hay que definirlas.
 */
export async function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || !secret) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySession(secret, token)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  // Se recuerda a dónde iba para devolverlo ahí después de entrar.
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Todo menos la propia pantalla de entrada, su endpoint, los recursos
     * estáticos y el favicon.
     */
    "/((?!login|api/login|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
