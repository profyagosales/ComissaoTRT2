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
  title: "APROVADOS TRT-2",
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
        className={`${montserrat.variable} ${inter.variable} min-h-screen bg-zinc-200 font-body text-neutral-900 antialiased`}
      >
        <div className="w-full bg-black text-xs text-white">
          <div className="mx-auto flex max-w-[1440px] items-center justify-end px-4 py-1">
            <a
              href="mailto:aprovados.tjaa.trt2.2025@gmail.com"
              className="inline-flex items-center gap-1 hover:underline"
            >
              <span aria-hidden="true">✉️</span>
              <span>Entre em contato com a Comissão</span>
            </a>
          </div>
        </div>

        <main>{children}</main>
      </body>
    </html>
  );
}
