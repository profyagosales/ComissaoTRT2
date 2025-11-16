"use client"

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

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length)
    }, SLIDE_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [slides.length])

  const active = slides[index]

  return (
    <div className="w-full h-full flex flex-col">
      {/* CARD DO SLIDE */}
      <div className="flex-1 rounded-[28px] bg-white/90 ring-1 ring-black/5 shadow-md shadow-black/10 px-8 py-6">
        {/* Grid de 4 faixas: topo, valor, descrição, dots */}
        <div className="grid h-full grid-rows-[auto,1fr,auto,auto] gap-2">
          {/* TOPO – título vermelho */}
          <div className="flex justify-center">
            <p className="text-center text-xs font-semibold tracking-[0.18em] uppercase text-[#C62828]">
              {active.titulo}
            </p>
          </div>

          {/* CENTRO – valor gigante, centralizado */}
          <div className="flex items-center justify-center">
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-900 text-center leading-tight">
              {active.destaque}
            </p>
          </div>

          {/* BASE – descrição encostada embaixo */}
          <div className="flex items-end justify-center">
            {active.descricao && (
              <p className="text-center text-sm text-slate-600 leading-relaxed">{active.descricao}</p>
            )}
          </div>

          {/* DOTS dentro do card */}
          <div className="flex items-end justify-center gap-2 pt-2">
            {slides.map((s, i) => {
              const isActive = i === index
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={[
                    'h-2 rounded-full transition-all duration-200',
                    isActive ? 'w-6 bg-slate-700' : 'w-2 bg-slate-300 hover:bg-slate-400',
                  ].join(' ')}
                  aria-label={s.titulo}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
