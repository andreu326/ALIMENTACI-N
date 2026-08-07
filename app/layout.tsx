import type { Metadata, Viewport } from "next";
import { Archivo, Chivo_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-archivo",
  display: "swap",
});

const chivoMono = Chivo_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-chivo-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MealPrep",
  description: "Plan de comidas, macros y viajes a Central Mayorista.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MealPrep" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#151412",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${archivo.variable} ${chivoMono.variable}`}>{children}</body>
    </html>
  );
}
