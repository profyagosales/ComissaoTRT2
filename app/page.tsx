"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const COMISSAO_EMAIL = "aprovados.tjaa.trt2.2025@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/aprovados_tjaa/";

// Placeholders (depois vamos puxar do Supabase)
const stats = [
  {
    id: "aprovados-total",
    title: "Total de aprovados TJAA",
    value: "3.000",
    detail: "Somatório geral do concurso",
  },
  {
    id: "aprovados-cotas",
    title: "Por sistema de concorrência",
    value: "AC • PCD • PPP • Indígena",
    detail: "Distribuição por listas específicas",
  },
  {
    id: "nomeados-total",
    title: "Total de nomeados",
    value: "0",
    detail: "Atualizado pela Comissão",
  },
  {
    id: "tds-total",
    title: "Termos de Desistência",
    value: "0",
    detail: "Inclui TDs confirmados pela Comissão",
  },
];

const instagramPlaceholders = [
  { id: 1, title: "Post oficial #1" },
  { id: 2, title: "Post oficial #2" },
  { id: 3, title: "Post oficial #3" },
  { id: 4, title: "Post oficial #4" },
];

export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <main>
      <header className="w-full border-b border-tjaa-red/40 bg-tjaa-red text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-end px-4 py-1.5 text-[11px] md:px-6">
          <a
            href={`mailto:${COMISSAO_EMAIL}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            Entre em contato com a Comissão
          </a>
        </div>
      </header>

      {/* Conteúdo principal */}
      <section className="mx-auto flex max-w-[1440px] flex-col gap-6 px-2 pb-10 pt-4 md:gap-7 md:px-4 md:pb-14 md:pt-6">
        <HeroSection onOpenAuthModal={() => setAuthOpen(true)} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <StatsSection />
          <InstagramSection />
        </div>
      </section>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </main>
  );
}

/* ================= HERO ================= */

function HeroSection({ onOpenAuthModal }: { onOpenAuthModal: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.45)]">
      {/* gradiente horizontal branco -> vermelho */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg,#ffffff 0%,#fee2e2 25%,#f97373 55%,#7f1d1d 100%)",
        }}
      />

      {/* leve textura diagonal inspirada no calçadão, bem sutil */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-[linear-gradient(135deg,rgba(0,0,0,0.16)_25%,rgba(0,0,0,0)_25%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.16)_50%,rgba(0,0,0,0.16)_75%,rgba(0,0,0,0)_75%,rgba(0,0,0,0)_100%)] bg-[length:28px_28px] opacity-[0.26]" />

      <div className="relative grid items-center gap-6 px-4 py-6 md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)] md:px-8 md:py-7">
        {/* lado esquerdo */}
        <div className="flex items-start gap-5">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-white via-tjaa-red to-black p-[3px] md:h-24 md:w-24">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-black">
                <Image
                  src="/logo-comissao-tjaa.png"
                  alt="Logotipo Comissão TJAA TRT-2"
                  width={100}
                  height={100}
                  className="h-auto w-auto"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 text-white">
            <div>
              <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-[28px]">
                Aprovados TRT da 2ª Região
              </h1>
              <p className="font-heading text-[11px] uppercase tracking-[0.24em] text-gray-100 md:text-xs">
                Comissão TJAA · Concurso 2025
              </p>
              <div className="mt-1 h-[2px] w-28 rounded-full bg-gradient-to-r from-white via-[#ffe0e0] to-transparent" />
            </div>

            <p className="text-sm font-semibold text-gray-50 md:text-[15px]">
              Comissão de aprovados do Tribunal Regional do Trabalho da 2ª Região
              para o cargo de Técnico Judiciário – Área Administrativa (TJAA),
              concurso de 2025.
            </p>
            <p className="text-xs text-gray-100 md:text-[13px]">
              Site criado pela Comissão para controle de listas, Termos de
              Desistência (TDs), vacâncias, nomeações, PCIs e outras movimentações.
              Organizados, somos mais fortes.
            </p>
          </div>
        </div>

        {/* CTA do aprovado */}
        <div className="relative flex flex-col gap-3 rounded-2xl border border-white/40 bg-black/35 px-4 py-4 shadow-[0_22px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl md:px-5 md:py-4">
          <div className="pointer-events-none absolute inset-x-[-20%] -top-10 h-10 bg-gradient-to-b from-white/80 via-white/25 to-transparent opacity-80 blur-xl" />

          <div className="relative space-y-1 text-white">
            <h2 className="font-heading text-sm font-semibold md:text-base">
              Ambiente do aprovado
            </h2>
            <p className="text-xs text-gray-100 md:text-[13px]">
              Acesso exclusivo para aprovados na lista oficial. Faça login ou
              cadastre seu perfil vinculado ao seu nome.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAuthModal}
            className="relative inline-flex items-center justify-center rounded-full bg-tjaa-red px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(127,29,29,0.9)] transition hover:bg-tjaa-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Entrar no ambiente do aprovado
          </button>

          <p className="relative text-[11px] text-gray-100 md:text-xs">
            Ainda não cadastrou seu perfil?{" "}
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="font-semibold text-[#ffe7e7] underline-offset-2 hover:underline"
            >
              Sou aprovado e quero me cadastrar
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ================= STATS (SLIDER) ================= */

function StatsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setCurrentIndex((prev) => (prev + 1) % stats.length),
      7000,
    );
    return () => clearInterval(id);
  }, []);

  const current = stats[currentIndex];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
      {/* topo vermelho */}
      <div className="flex items-center justify-between gap-2 bg-tjaa-red px-5 py-3 text-white md:px-6">
        <div>
          <h2 className="font-heading text-sm font-semibold md:text-base">
            Resumo do concurso TJAA TRT-2
          </h2>
          <p className="text-[11px] text-red-100 md:text-xs">
            Visão geral pública. Os dados são atualizados pela Comissão.
          </p>
        </div>
        <span className="rounded-full border border-red-200/60 bg-red-100/15 px-3 py-1 text-[11px] font-medium text-red-50">
          Beta público
        </span>
      </div>

      {/* corpo branco */}
      <div className="px-4 pb-4 pt-3 md:px-5">
        <article className="relative h-44 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.08)] md:h-48">
          <div className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-gradient-to-b from-tjaa-red to-black" />

          <div className="relative ml-3 flex h-full flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Indicador {currentIndex + 1} de {stats.length}
                </p>
                <h3 className="mt-1 font-heading text-sm font-semibold text-gray-900 md:text-base">
                  {current.title}
                </h3>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold text-slate-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Dados oficiais</span>
              </div>
            </div>

            <div>
              <p className="mt-3 text-3xl font-heading font-extrabold tracking-tight text-black md:text-[32px]">
                {current.value}
              </p>
              <p className="mt-1 text-[11px] text-gray-600">{current.detail}</p>
            </div>
          </div>
        </article>

        <div className="mt-3 flex items-center justify-center gap-2">
          {stats.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 bg-tjaa-red"
                  : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= REDES OFICIAIS / INSTAGRAM ================= */

function InstagramSection() {
  return (
    <section className="relative flex flex-col rounded-3xl border border-black/10 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
      {/* topo vermelho */}
      <div className="flex items-center justify-between gap-2 bg-tjaa-red px-5 py-3 text-white md:px-6">
        <div>
          <p className="font-heading text-[11px] uppercase tracking-[0.22em] text-red-100">
            Redes oficiais
          </p>
          <h2 className="font-heading text-sm font-semibold md:text-base">
            Instagram da Comissão
          </h2>
        </div>
        <Link
          href={INSTAGRAM_URL}
          target="_blank"
          className="rounded-full border border-red-100 bg-red-100/10 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-100/20 md:px-4 md:text-xs"
        >
          Abrir perfil oficial
        </Link>
      </div>

      {/* corpo branco */}
      <div className="px-5 pb-4 pt-3">
        <p className="mb-3 text-[11px] text-gray-600 md:text-xs">
          Comunicados rápidos, bastidores das reuniões e chamadas para ações
          coletivas.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {/* destaque */}
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_14px_28px_rgba(15,23,42,0.08)] md:row-span-2"
          >
            <div className="absolute inset-x-[-25%] -top-6 h-8 bg-gradient-to-b from-slate-100 via-white to-transparent opacity-80 blur-md" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <p className="text-[11px] font-medium text-gray-500">
                  @aprovados_tjaa
                </p>
                <h3 className="mt-1 text-sm font-semibold text-gray-900">
                  Post oficial em destaque
                </h3>
                <p className="mt-1 text-[11px] text-gray-600">
                  Em breve, os posts reais serão carregados automaticamente do
                  Instagram da Comissão.
                </p>
              </div>
              <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-tjaa-red">
                Ver no Instagram
                <span aria-hidden>↗</span>
              </p>
            </div>
          </Link>

          {instagramPlaceholders.map((post) => (
            <Link
              key={post.id}
              href={INSTAGRAM_URL}
              target="_blank"
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_10px_20px_rgba(15,23,42,0.06)]"
            >
              <div className="relative space-y-1">
                <p className="text-[11px] font-medium text-gray-500">
                  @aprovados_tjaa
                </p>
                <h3 className="text-sm font-semibold text-gray-900">
                  {post.title}
                </h3>
                <p className="text-[11px] text-gray-600">
                  Conteúdo será integrado automaticamente em breve.
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-3 text-[10px] text-gray-500">
          * Integração oficial com o Instagram será ativada quando o painel privado
          estiver online.
        </p>
      </div>
    </section>
  );
}

/* ================= MODAL AUTH ================= */

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-3">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/30 bg-gradient-to-b from-white/98 via-white to-[#fff4f4] p-5 shadow-[0_40px_100px_rgba(15,23,42,0.8)] backdrop-blur-md">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Ambiente do aprovado
            </span>
            <span className="font-heading text-sm font-semibold text-gray-900">
              Acesse com seu e-mail cadastrado
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-[11px] text-gray-600 hover:bg-slate-200"
          >
            Fechar
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 inline-flex rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              mode === "login"
                ? "bg-tjaa-red text-white shadow-sm"
                : "text-gray-700"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              mode === "signup"
                ? "bg-tjaa-red text-white shadow-sm"
                : "text-gray-700"
            }`}
          >
            Criar cadastro
          </button>
        </div>

        {mode === "login" ? <LoginForm /> : <SignupInfo />}
      </div>
    </div>
  );
}

function LoginForm() {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        // integração com Supabase Auth virá depois
      }}
    >
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-800">E-mail</label>
        <input
          type="email"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-tjaa-red focus:ring-2 focus:ring-tjaa-red/40"
          placeholder="seu@email.com"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-800">Senha</label>
        <input
          type="password"
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-tjaa-red focus:ring-2 focus:ring-tjaa-red/40"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-tjaa-red px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-900/35 transition hover:bg-tjaa-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tjaa-red/70"
      >
        Entrar
      </button>

      <p className="mt-2 text-[11px] text-gray-600">
        Em breve, o login será vinculado automaticamente ao seu ID de candidato
        na lista de aprovados.
      </p>
    </form>
  );
}

function SignupInfo() {
  return (
    <div className="space-y-3 text-sm text-gray-800">
      <p className="text-[13px]">
        No cadastro, você vai vincular seu login ao seu nome na lista oficial de
        aprovados do TRT-2.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-[13px]">
        <li>Informar e-mail e criar uma senha de acesso.</li>
        <li>
          Buscar seu nome na lista de aprovados e confirmar seu ID de candidato.
        </li>
        <li>
          Preencher dados de contato (e-mail, telefone, redes sociais), visíveis
          apenas para a Comissão.
        </li>
      </ul>
      <p className="text-[12px] text-gray-600">
        Essas informações serão utilizadas apenas para organização interna da
        Comissão e comunicação com os aprovados.
      </p>
    </div>
  );
}
