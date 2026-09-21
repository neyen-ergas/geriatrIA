import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "geriatrIA",
  description: "Registro de medicación sin papel para residencias geriátricas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={plusJakartaSans.variable}>
      <body className="antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}

