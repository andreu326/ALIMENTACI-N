import { LoginForm } from "@/components/app/login-form";

export const metadata = { title: "MealPrep" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const configured = Boolean(process.env.APP_PASSWORD && process.env.AUTH_SECRET);
  // Sólo se permite volver a rutas internas: evita que ?next= redirija afuera.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return <LoginForm next={target} configured={configured} />;
}
