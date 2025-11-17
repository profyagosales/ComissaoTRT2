"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

type Totais = {
  total: number
  ampla: number
  pcd: number
  ppp: number
  indigena: number
}

export type ResumoSliderData = {
  concorrenciaLabel: string
  ordemNomeacao: number
  classificacaoOrigem: number
  frenteOrdem: number
  frenteSistema: number
  totaisAprovados: Totais
  totaisNomeados: Totais
  totaisTDs: Totais
}

type Props = {
  data: ResumoSliderData
}

const SLIDE_INTERVAL_MS = 5000

export default function ResumoSlider({ data }: Props) {
  const [index, setIndex] = useState(0)

  const slides = [
    {
      id: "concorrencia",
      titulo: "Concorrência",
      destaque: data.concorrenciaLabel,
      descricao: "Sistema em que você está concorrendo.",
    },
    {
      id: "ordem-nomeacao",
      titulo: "Ordem de nomeação",
      destaque: `#${data.ordemNomeacao}`,
      descricao: "Posição na ordem de nomeação do concurso.",
    },
    {
      id: "classificacao-origem",
      titulo: "Classificação na lista de origem",
      destaque: `#${data.classificacaoOrigem}`,
      descricao: "Posição na lista de sua concorrência.",
    },
    {
      id: "frente-ordem",
      titulo: "Candidatos na frente (ordem de nomeação)",
      destaque: data.frenteOrdem,
      descricao: "Considerando apenas TDs confirmados e nomeações.",
    },
    {
      id: "frente-sistema",
      titulo: "Candidatos na frente (sua lista)",
      destaque: data.frenteSistema,
      descricao: "Posição dentro da lista de sua concorrência.",
    },
    {
      id: "totais-aprovados",
      titulo: "Total de aprovados",
      destaque: `${data.totaisAprovados.total} candidatos`,
      descricao: `Ampla: ${data.totaisAprovados.ampla} · PCD: ${data.totaisAprovados.pcd} · PPP: ${data.totaisAprovados.ppp} · Indígena: ${data.totaisAprovados.indigena}`,
    },
    {
      id: "totais-nomeados",
      titulo: "Total de nomeados",
      destaque: `${data.totaisNomeados.total} nomeações`,
      descricao: `Ampla: ${data.totaisNomeados.ampla} · PCD: ${data.totaisNomeados.pcd} · PPP: ${data.totaisNomeados.ppp} · Indígena: ${data.totaisNomeados.indigena}`,
    },
    {
      id: "totais-tds",
      titulo: "Total de TDs enviados",
      destaque: `${data.totaisTDs.total} TDs`,
      descricao: `Ampla: ${data.totaisTDs.ampla} · PCD: ${data.totaisTDs.pcd} · PPP: ${data.totaisTDs.ppp} · Indígena: ${data.totaisTDs.indigena}`,
    },
  ]

  const totalSlides = slides.length

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % totalSlides)
    }, SLIDE_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [totalSlides])

  const active = slides[index]
  const progress = ((index + 1) / totalSlides) * 100

  const handlePrev = () => {
    setIndex(prev => (prev - 1 + totalSlides) % totalSlides)
  }

  const handleNext = () => {
    setIndex(prev => (prev + 1) % totalSlides)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-[#040510] via-[#0B0F1F] to-[#1C2742] text-white shadow-[0_30px_80px_rgba(5,8,20,0.75)]">
      <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-[#C62828]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-0 h-48 w-48 rounded-full bg-[#FFAB91]/20 blur-3xl" />

      <div className="relative flex h-full flex-col px-7 py-6">
        <header className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
          <span>Resumo</span>
          <span className="font-mono tracking-[0.2em]">
            {String(index + 1).padStart(2, '0')}/{String(totalSlides).padStart(2, '0')}
          </span>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-[12px] uppercase tracking-[0.3em] text-[#FFAB91]">{active.titulo}</p>
          <p className="text-3xl font-semibold leading-tight text-white drop-shadow-sm md:text-4xl">
            {active.destaque}
          </p>
          {active.descricao && (
            <p className="max-w-sm text-sm text-white/70 md:text-base">{active.descricao}</p>
          )}
        </div>

        <footer className="flex flex-col gap-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF8A65] via-[#FF7043] to-[#C62828] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>

            <div className="flex items-center gap-1">
              {slides.map((s, i) => {
                const isActive = i === index
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={[
                      'h-1 rounded-full transition-all duration-200',
                      isActive ? 'w-6 bg-white' : 'w-2 bg-white/30 hover:bg-white/60',
                    ].join(' ')}
                    aria-label={s.titulo}
                  />
                )
              })}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
