import type { Metadata } from "next";
import "./globals.css";
import { Montserrat, Inter } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Aprovados TRT da 2ª Região",
  description:
    "Comissão de aprovados do TRT da 2ª Região para o cargo de Técnico Judiciário - Área Administrativa (TJAA), concurso 2025. Controle de listas, TDs, vacâncias, nomeações, PCIs e outras movimentações.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${montserrat.variable} ${inter.variable} font-body min-h-screen bg-[#f5f3f0] text-[#111111] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
