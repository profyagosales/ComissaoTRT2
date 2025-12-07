'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logos } from './branding/logos';

const INSTAGRAM_URL = 'https://www.instagram.com/aprovados_tjaa/';

export default function HomePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGoToLogin = () => {
    setIsModalOpen(false);
    router.push('/login');
  };

  const handleGoToSignup = () => {
    setIsModalOpen(false);
    router.push('/signup');
  };

  return (
    <main className="min-h-screen text-neutral-900">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-3 pb-10 pt-6 md:px-6 lg:px-8">
        <HeroSection onOpenModal={() => setIsModalOpen(true)} />

        <div className="grid w-full gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <ResumoSection />
          </section>

          <section className="lg:col-span-1">
            <RedesOficiaisSection />
          </section>
        </div>
      </div>

      {isModalOpen && (
        <LoginPlaceholderModal
          onClose={() => setIsModalOpen(false)}
          onGoToLogin={handleGoToLogin}
          onGoToSignup={handleGoToSignup}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO                                                              */
/* ------------------------------------------------------------------ */

function HeroSection({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <section
      className="
        relative overflow-hidden rounded-[32px]
        bg-gradient-to-r from-[#7f1111] via-[#b91c1c] to-[#ef4444]
        shadow-[0_28px_80px_rgba(0,0,0,0.40)]
        px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10
        text-white
      "
    >
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-start gap-5">
          <div className="shrink-0 rounded-3xl bg-white/90 p-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black overflow-hidden">
              <Image
                src={logos.primary}
                alt="Comissão TJAA TRT-2"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <p className="font-heading text-[10px] sm:text-xs tracking-[0.12em] text-red-100/90">
              Comissão TJAA · Concurso 2025
            </p>

            <h1 className="font-heading text-[1.9rem] leading-tight text-white sm:text-3xl lg:text-[2.35rem]">
              Aprovados TRT da 2ª Região
            </h1>

            <p className="max-w-2xl text-xs text-red-50/90 sm:text-sm lg:text-[0.95rem]">
              Comissão de aprovados do Tribunal Regional do Trabalho da 2ª Região para o cargo de Técnico Judiciário – Área Administrativa (TJAA), concurso de 2025.
               
              Site criado para controle de listas, TDs, vagas, nomeações e demais movimentações.
            </p>
          </div>
        </div>

        <div className="lg:w-[380px] xl:w-[400px]">
          <div
            className="
              rounded-[26px] bg-black/85 p-6 sm:p-7
              shadow-[0_24px_60px_rgba(0,0,0,0.65)]
              ring-1 ring-white/10
            "
          >
            <p className="text-[11px] font-semibold tracking-[0.1em] text-red-200">
              Ambiente do aprovado
            </p>

            <p className="mt-3 text-xs text-zinc-100/90 sm:text-sm">
              Acesso exclusivo para aprovados na lista oficial do concurso TJAA TRT-2. Área reservada para informações internas da Comissão.
            </p>

            <button
              type="button"
              onClick={onOpenModal}
              className="
                mt-5 inline-flex w-full items-center justify-center
                rounded-full bg-[#b91c1c]
                px-5 py-3.5 text-sm font-semibold text-white
                shadow-[0_18px_40px_rgba(0,0,0,0.65)] transition
                hover:bg-[#991b1b]
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-red-400
              "
            >
              Entrar no ambiente do aprovado
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  RESUMO DO CONCURSO (SLIDER)                                       */
/* ------------------------------------------------------------------ */

type Indicator = {
  id: string;
  titulo: string;
  valorMock: string;
  subtitulo: string;
};

const RESUMO_INDICATORS: Indicator[] = [
  {
    id: 'total-aprovados',
    titulo: 'Total de aprovados TJAA',
    valorMock: '3.000',
    subtitulo: 'Somatório geral do concurso (dado de exemplo).',
  },
  {
    id: 'por-sistema',
    titulo: 'Por sistema de concorrência',
    valorMock: 'AC • PCD • PPP • Indígena',
    subtitulo: 'Distribuição por listas específicas.',
  },
  {
    id: 'nomeados',
    titulo: 'Total de nomeados',
    valorMock: '0',
    subtitulo: 'Será atualizado automaticamente pela Comissão.',
  },
  {
    id: 'tds',
    titulo: 'Termos de Desistência (TDs)',
    valorMock: '0',
    subtitulo: 'Inclui apenas TDs confirmados pela Comissão.',
  },
];

function ResumoSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % RESUMO_INDICATORS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const current = RESUMO_INDICATORS[activeIndex];

  return (
    <section className="rounded-3xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
      {/* cabeçalho vermelho */}
      <div className="flex items-center justify-between rounded-t-3xl bg-[#b91c1c] px-6 py-3 text-sm font-semibold text-white">
        <span>Resumo do concurso TJAA TRT-2</span>
      </div>

      <div className="relative px-6 py-10 md:px-10 md:py-12">
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center">
          <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400">
            Indicador {activeIndex + 1} de {RESUMO_INDICATORS.length}
          </span>

          <h2 className="max-w-2xl text-lg font-semibold text-neutral-900 md:text-xl">
            {current.titulo}
          </h2>

          <p className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
            {current.valorMock}
          </p>

          <p className="max-w-xl text-xs text-neutral-500 md:text-sm">{current.subtitulo}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {RESUMO_INDICATORS.map((indicator, index) => (
            <button
              key={indicator.id}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ir para indicador ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-5 bg-neutral-900' : 'w-2 bg-neutral-300 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  REDES OFICIAIS / INSTAGRAM                                        */
/* ------------------------------------------------------------------ */

function RedesOficiaisSection() {
  const posts = [
    { id: 1, titulo: 'Post oficial #1' },
    { id: 2, titulo: 'Post oficial #2' },
    { id: 3, titulo: 'Post oficial #3' },
    { id: 4, titulo: 'Post oficial #4' },
  ] as const;

  return (
    <div className="h-full w-full rounded-3xl bg-white shadow-[0_18px_35px_rgba(0,0,0,0.28)]">
      {/* topo vermelho */}
      <div className="flex items-center justify-between rounded-t-3xl bg-red-700 px-6 py-3 text-sm text-white">
        <h2 className="font-semibold tracking-wide">Instagram da Comissão</h2>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20"
        >
          Ver perfil
        </a>
      </div>

      {/* cards de posts (placeholder) */}
      <div className="grid gap-3 rounded-b-3xl bg-white px-6 py-6 md:grid-cols-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex flex-col justify-between rounded-2xl border border-neutral-100 bg-gradient-to-br from-white to-neutral-50 px-4 py-4 text-sm text-neutral-800 shadow-sm"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                @aprovados_tjaa
              </p>
              <p className="mt-1 text-sm font-semibold">{post.titulo}</p>
            </div>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Ver no Instagram
              <span className="ml-1 text-[10px]" aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MODAL – POR ENQUANTO APENAS PLACEHOLDER                           */
/* ------------------------------------------------------------------ */

function LoginPlaceholderModal({
  onClose,
  onGoToLogin,
  onGoToSignup,
}: {
  onClose: () => void;
  onGoToLogin: () => void;
  onGoToSignup: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-200/95 p-[1px] shadow-[0_26px_60px_rgba(0,0,0,0.65)]">
        <div className="rounded-3xl bg-neutral-900 px-5 py-5 text-zinc-50 sm:px-7 sm:py-7">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400">
                Ambiente do aprovado
              </p>
              <h2 className="text-base font-semibold sm:text-lg">Acesso restrito em desenvolvimento</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-lg hover:bg-white/10"
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>

          <p className="text-xs leading-relaxed text-neutral-300">
            Escolha uma opção para acessar o painel: entrar com seu perfil já cadastrado ou criar seu perfil de aprovado usando o e-mail oficial do concurso.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full rounded-full bg-red-600 px-4 py-3 text-sm font-semibold tracking-wide text-white shadow-md transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              Já tenho perfil — entrar
            </button>

            <button
              type="button"
              onClick={onGoToSignup}
              className="w-full rounded-full border border-red-500/60 bg-transparent px-4 py-3 text-sm font-semibold tracking-wide text-red-100 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              Criar meu perfil de aprovado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
