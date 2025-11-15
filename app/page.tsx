"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { logos } from "./config/logos";

const COMISSAO_EMAIL = "aprovados.tjaa.trt2.2025@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/aprovados_tjaa/";

type Indicator = {
  id: number;
  label: string;
  title: string;
  value: string;
  description: string;
};

const INDICATORS: Indicator[] = [
  {
    id: 1,
    label: "INDICADOR 1 DE 4",
    title: "Total de aprovados TJAA",
    value: "3.000",
    description: "Somatório geral do concurso.",
  },
  {
    id: 2,
    label: "INDICADOR 2 DE 4",
    title: "Por sistema de concorrência",
    value: "AC • PCD • PPP • Indígena",
    description: "Distribuição por listas específicas.",
  },
  {
    id: 3,
    label: "INDICADOR 3 DE 4",
    title: "Total de nomeados",
    value: "0",
    description: "Atualizado pela Comissão.",
  },
  {
    id: 4,
    label: "INDICADOR 4 DE 4",
    title: "Termos de Desistência (TDs)",
    value: "0",
    description: "Inclui apenas TDs confirmados pela Comissão.",
  },
];

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signUp">("login");
  const [activeIndicator, setActiveIndicator] = useState(0);

  // Slider automático a cada 7 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndicator((prev) => (prev + 1) % INDICATORS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const current = INDICATORS[activeIndicator];

  return (
    <main className="min-h-screen bg-zinc-300/80 text-zinc-900">
      {/* Barra superior preta com link vermelho */}
      <div className="w-full border-b border-zinc-700 bg-black text-xs text-zinc-50">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-1.5">
          <Link
            href={`mailto:${COMISSAO_EMAIL}`}
            className="font-medium text-red-500 hover:text-red-400"
          >
            Entre em contato com a Comissão
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-10 pt-6">
        <HeroSection
          onOpenAuthModal={() => {
            setAuthTab("login");
            setIsAuthModalOpen(true);
          }}
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <ResumoSection
              current={current}
              activeIndicator={activeIndicator}
              onSelectIndicator={setActiveIndicator}
            />
          </div>
          <div className="w-full lg:w-[360px]">
            <RedesOficiaisSection />
          </div>
        </div>
      </div>

      {isAuthModalOpen && (
        <AuthModal
          activeTab={authTab}
          onTabChange={setAuthTab}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </main>
  );
}

/* HERO ------------------------------------------------------------------- */

function HeroSection(props: { onOpenAuthModal: () => void }) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-r from-white via-rose-50 to-red-600 shadow-[0_22px_45px_rgba(0,0,0,0.45)]"
    >
      {/* Calçadão suave na parte de baixo */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(135deg,rgba(0,0,0,0.07)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.07)_50%,rgba(0,0,0,0.07)_75%,transparent_75%,transparent)] bg-[length:32px_32px] opacity-35" />

      <div className="relative z-10 flex flex-col gap-8 p-7 md:flex-row md:items-center md:justify-between md:p-9 lg:p-10">
        {/* Bloco logo + textos */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-5">
            <div className="shrink-0 rounded-full bg-black shadow-[0_0_0_3px_rgba(255,255,255,0.5)]">
              <div className="rounded-full bg-black p-2">
                <Image
                  src={logos.primary}
                  alt="Logo oficial da Comissão de Aprovados TJAA TRT-2"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-contain"
                  priority
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium tracking-[0.24em] text-zinc-800">
                COMISSÃO TJAA · CONCURSO 2025
              </p>
              <h1
                id="hero-heading"
                className="font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl lg:text-[32px]"
              >
                Aprovados TRT da 2ª Região
              </h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-zinc-900/90">
            Comissão de aprovados do Tribunal Regional do Trabalho da 2ª Região para o cargo de Técnico Judiciário – Área Administrativa (TJAA), concurso de 2025.
          </p>

          <p className="max-w-3xl text-sm leading-relaxed text-zinc-900/80">
            Site criado pela Comissão para controle de listas, Termos de Desistência (TDs), vacâncias, nomeações, PCIs e outras movimentações. Organizados, somos mais fortes.
          </p>
        </div>

        {/* Card de acesso do aprovado */}
        <div className="mt-4 w-full max-w-xs shrink-0 md:mt-0">
          <div className="overflow-hidden rounded-2xl bg-black/75 p-[1px] shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
            <div className="space-y-3 rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-5 py-4">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-red-400">
                AMBIENTE DO APROVADO
              </p>
              <p className="text-[13px] leading-snug text-zinc-100">
                Acesso exclusivo para aprovados na lista oficial do concurso TJAA TRT-2.
              </p>

              <button
                type="button"
                onClick={props.onOpenAuthModal}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3 text-[13px] font-semibold text-white shadow-[0_18px_32px_rgba(127,29,29,0.7)] transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              >
                Entrar no ambiente do aprovado
              </button>

              <p className="pt-1 text-[11px] text-zinc-400">
                Ainda não cadastrou seu perfil?{" "}
                <span className="font-medium text-red-300">
                  Em breve, cadastro vinculado ao ID de candidato.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* RESUMO ----------------------------------------------------------------- */

function ResumoSection(props: {
  current: Indicator;
  activeIndicator: number;
  onSelectIndicator: (index: number) => void;
}) {
  const { current, activeIndicator, onSelectIndicator } = props;

  return (
    <section aria-labelledby="resumo-heading">
      <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        {/* Topo vermelho */}
        <div className="flex items-center justify-between bg-red-700 px-6 py-3">
          <div>
            <p
              id="resumo-heading"
              className="text-xs font-semibold tracking-[0.18em] text-red-100"
            >
              RESUMO DO CONCURSO TJAA TRT-2
            </p>
            <p className="text-[11px] text-red-100/80">
              Visão geral pública · Dados atualizados pela Comissão.
            </p>
          </div>
          <span className="rounded-full bg-red-900/80 px-3 py-1 text-[11px] font-medium text-red-100">
            Dados oficiais
          </span>
        </div>

        {/* Conteúdo do slide */}
        <div className="space-y-6 px-6 pb-5 pt-6">
          <p className="text-[11px] font-medium tracking-[0.22em] text-zinc-500">
            {current.label}
          </p>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              {current.title}
            </h2>
            <p className="text-4xl font-semibold tracking-tight text-zinc-900">
              {current.value}
            </p>
            <p className="max-w-xl text-sm text-zinc-600">
              {current.description}
            </p>
          </div>

          {/* Bullets do slide */}
          <div className="mt-4 flex items-center gap-2">
            {INDICATORS.map((indicator, index) => (
              <button
                key={indicator.id}
                type="button"
                onClick={() => onSelectIndicator(index)}
                className={`h-2 w-2 rounded-full transition ${
                  index === activeIndicator
                    ? "w-5 bg-zinc-900"
                    : "bg-zinc-400/60 hover:bg-zinc-500/80"
                }`}
                aria-label={`Ir para indicador ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* REDES OFICIAIS --------------------------------------------------------- */

function RedesOficiaisSection() {
  return (
    <section aria-labelledby="redes-heading">
      <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        {/* Topo vermelho */}
        <div className="flex items-center justify-between bg-red-700 px-5 py-3">
          <div>
            <p
              id="redes-heading"
              className="text-xs font-semibold tracking-[0.18em] text-red-100"
            >
              REDES OFICIAIS
            </p>
            <p className="text-[11px] text-red-100/80">
              Instagram oficial da Comissão de Aprovados.
            </p>
          </div>

          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-red-700 shadow-sm hover:bg-red-50"
          >
            Abrir perfil oficial
          </Link>
        </div>

        {/* Corpo branco */}
        <div className="space-y-4 px-5 pb-5 pt-4 text-sm">
          <p className="text-xs text-zinc-600">
            Comunicados rápidos, bastidores das reuniões e chamadas para ações coletivas.
          </p>

          <div className="space-y-3">
            {/* Card principal */}
            <article className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold text-zinc-500">
                @aprovados_tjaa
              </p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-900">
                Post oficial em destaque
              </h3>
              <p className="mt-1 text-xs text-zinc-600">
                Em breve, os posts reais serão carregados automaticamente do Instagram da Comissão.
              </p>
              <Link
                href={INSTAGRAM_URL}
                target="_blank"
                className="mt-2 inline-flex text-[11px] font-medium text-red-700 hover:text-red-800"
              >
                Ver no Instagram ↗
              </Link>
            </article>

            {/* Placeholders para próximos posts */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {["Post oficial #1", "Post oficial #2", "Post oficial #3", "Post oficial #4"].map(
                (title) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-xs shadow-sm"
                  >
                    <p className="text-[11px] font-semibold text-zinc-500">
                      @aprovados_tjaa
                    </p>
                    <h3 className="mt-1 font-semibold text-zinc-900">
                      {title}
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      Conteúdo será integrado automaticamente em breve.
                    </p>
                  </article>
                ),
              )}
            </div>

            <p className="pt-1 text-[10px] text-zinc-500">
              * Integração oficial com o Instagram será ativada quando o painel privado estiver online.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* MODAL DE LOGIN / CADASTRO ---------------------------------------------- */

function AuthModal(props: {
  activeTab: "login" | "signUp";
  onTabChange: (tab: "login" | "signUp") => void;
  onClose: () => void;
}) {
  const { activeTab, onTabChange, onClose } = props;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-black via-zinc-900 to-zinc-950 px-6 pb-6 pt-5 text-zinc-50 shadow-[0_32px_60px_rgba(0,0,0,0.65)]">
        {/* Header do modal */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-red-300">
              AMBIENTE DO APROVADO
            </p>
            <h2 className="text-xl font-semibold">Acesso restrito · Validado por e-mail oficial</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 p-1 text-zinc-400 hover:text-white"
            aria-label="Fechar modal de autenticação"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => onTabChange("login")}
            className={`flex-1 rounded-full px-4 py-2 font-semibold transition ${
              activeTab === "login"
                ? "bg-white text-zinc-900"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Já sou aprovado (login)
          </button>
          <button
            type="button"
            onClick={() => onTabChange("signUp")}
            className={`flex-1 rounded-full px-4 py-2 font-semibold transition ${
              activeTab === "signUp"
                ? "bg-white text-zinc-900"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Quero liberar meu acesso
          </button>
        </div>

        {/* Conteúdo do formulário */}
        <div className="mt-5 space-y-4 text-sm">
          {activeTab === "login" ? (
            <>
              <p className="text-zinc-200">
                Informe seu e-mail usado no concurso TJAA TRT-2. Enviremos um link de acesso com validação por ID de candidato.
              </p>
              <label className="block space-y-1">
                <span className="text-[12px] text-zinc-400">E-mail cadastrado</span>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  placeholder="seuemail@exemplo.com"
                />
              </label>
              <button
                type="button"
                className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(127,29,29,0.7)] transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              >
                Receber link de acesso
              </button>
              <p className="text-[11px] text-zinc-400">
                Atenção: somente aprovados confirmados conseguem acessar enquanto o painel estiver em beta.
              </p>
            </>
          ) : (
            <>
              <p className="text-zinc-200">
                Envie seu e-mail e ID de candidato para liberar o acesso. Um membro da Comissão confirmará seus dados e ativará seu perfil.
              </p>
              <label className="block space-y-1">
                <span className="text-[12px] text-zinc-400">E-mail do concurso</span>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  placeholder="seuemail@exemplo.com"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[12px] text-zinc-400">ID de candidato (Caderno de provas)</span>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  placeholder="Ex.: TJAA-0000"
                />
              </label>
              <button
                type="button"
                className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-[0_18px_32px_rgba(0,0,0,0.45)] transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Enviar para validação
              </button>
              <p className="text-[11px] text-zinc-400">
                Após validação, o acesso é ativado e enviado automaticamente para seu e-mail.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
