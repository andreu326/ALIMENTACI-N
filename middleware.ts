import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * Portón de entrada. Corre en el Edge antes de servir cualquier página, así que
 * sin cookie de sesión válida el HTML nunca sale del servidor.
 *
 * Si faltan las variables de entorno se BLOQUEA en producción. Antes dejaba
 * pasar, y el resultado fue que el sitio quedó público en Vercel creyendo que
 * estaba protegido. Un portón que se abre solo cuando está mal configurado no
 * es un portón. En desarrollo sí deja pasar, para no exigir configuración local.
 */
export async function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  const configured = Boolean(password && secret);

  if (!configured && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  if (configured) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (await verifySession(secret!, token)) return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (!configured) {
    url.searchParams.set("setup", "1");
  } else {
    // Se recuerda a dónde iba para devolverlo ahí después de entrar.
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!login|api/login|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
