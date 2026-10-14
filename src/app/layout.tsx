import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible se diseñó para lectores con baja visión: distingue
// formas que se confunden (1, l, I; 0, O) y parte del equipo es mayor.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: "geriatrIA",
  description: "Sistema de gestión para residencias geriátricas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f3a2e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={atkinson.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
