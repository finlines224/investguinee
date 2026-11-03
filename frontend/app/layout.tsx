import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "InvestGuinée — Innover • Financer • Bâtir la Guinée",
  description:
    "InvestGuinée est une plateforme sécurisée qui connecte investisseurs, entrepreneurs et étudiants pour financer l'innovation en Guinée.",
  keywords: "investissement, Guinée, entrepreneurs, fintech, projets, financement",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
