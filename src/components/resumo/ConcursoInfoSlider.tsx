"use client"

import { useEffect, useState } from "react"

type PainelAtual = {
  vagas_loa_jt?: number | null
  vagas_autorizadas_jt?: number | null
  vagas_autorizadas_trt2?: number | null
  vagas_autorizadas_trt2_tjaa?: number | null
  vagas_pendentes_csjt?: number | null
  cargos_vagos_trt2_total?: number | null
  cargos_vagos_trt2_onerosos?: number | null
  cargos_vagos_trt2_nao_onerosos?: number | null
}

type ConcursoResumo = {
  totalAprovados?: number | null
  totalNomeados?: number | null
}

type Props = {
  painelAtual: PainelAtual | null
  concursoResumo: ConcursoResumo | null
}

const INTERVAL_MS = 5000

export function ConcursoInfoSlider({ painelAtual, concursoResumo }: Props) {
  const p = painelAtual ?? {}
  const c = concursoResumo ?? {}

  const slides = [
    {
      id: "loa",
      titulo: "Vagas na LOA",
      destaque: (p.vagas_loa_jt ?? 0).toString(),
      descricao: "Vagas de TJAA previstas na Lei Orçamentária.",
    },
    {
      id: "csjt-autorizadas",
      titulo: "Vagas autorizadas pelo CSJT",
      destaque: (p.vagas_autorizadas_jt ?? p.vagas_autorizadas_trt2 ?? 0).toString(),
      descricao: "Vagas de TJAA já autorizadas para provimento.",
    },
    {
      id: "aguardando-autorizacao",
      titulo: "Vagas aguardando autorização",
      destaque: (p.vagas_pendentes_csjt ?? 0).toString(),
      descricao: "Vagas de TJAA ainda pendentes de autorização do CSJT.",
    },
    {
      id: "cargos-vagos",
      titulo: "Cargos vagos no TRT-2",
      destaque: (p.cargos_vagos_trt2_total ?? 0).toString(),
      descricao: `Onerosos: ${p.cargos_vagos_trt2_onerosos ?? 0} · Não onerosos: ${p.cargos_vagos_trt2_nao_onerosos ?? 0}.`,
    },
    {
      id: "aprovados",
      titulo: "Total de aprovados TJAA",
      destaque: (c.totalAprovados ?? 0).toString(),
      descricao: "Total de aprovados no concurso de TJAA do TRT-2.",
    },
    {
      id: "nomeados",
      titulo: "Total de nomeados TJAA",
      destaque: (c.totalNomeados ?? 0).toString(),
      descricao: "Nomeações já publicadas para o cargo de TJAA no TRT-2.",
    },
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex(prev => (prev + 1) % slides.length), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [slides.length])

  const active = slides[index]

  return (
    <div className="w-full h-[420px] flex flex-col rounded-[28px] bg-white/90 ring-1 ring-black/5 shadow-md shadow-black/10 overflow-hidden">
      <div className="bg-[#C62828] px-6 py-4 flex items-center justify-center text-center">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-white">Informações do concurso</p>
      </div>

      <div className="flex-1 px-8 py-6 overflow-y-auto flex flex-col items-center text-center gap-4">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#C62828]">{active.titulo}</p>

        <p className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">{active.destaque}</p>

        <p className="text-sm text-slate-600 leading-relaxed">{active.descricao}</p>
      </div>

      <div className="pb-4 flex items-center justify-center gap-2">
        {slides.map((s, i) => {
          const isActive = i === index
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={[
                "h-2 rounded-full transition-all duration-200",
                isActive ? "w-6 bg-slate-700" : "w-2 bg-slate-300 hover:bg-slate-400",
              ].join(" ")}
              aria-label={s.titulo}
            />
          )
        })}
      </div>
    </div>
  )
}
