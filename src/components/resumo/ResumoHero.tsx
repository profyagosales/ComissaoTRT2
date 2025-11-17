'use client'

import type { ReactNode } from 'react'

import ResumoSlider, { type ResumoSliderData } from '@/src/components/resumo/ResumoSlider'

type ResumoHeroProps = {
  nome: string
  email?: string | null
  telefone?: string | null
  redesSociais?: string | null
  perfilLabel: string
  sliderData: ResumoSliderData
  editContactAction: ReactNode
  enviarTdAction: ReactNode
}

export function ResumoHero({
  nome,
  email,
  telefone,
  redesSociais,
  sliderData,
  editContactAction,
  enviarTdAction,
}: ResumoHeroProps) {
  const initials = getInitials(nome)
  const greetingName = getGreetingName(nome) || 'aprovado(a)'

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
      <div className="flex w-full flex-col lg:w-[60%]">
          <div className="h-full rounded-[22px] border border-black/20 bg-[#040816]/90 px-3 py-3 shadow-xl shadow-black/30 flex flex-col gap-3 text-white">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-[#C62828] text-white flex items-center justify-center text-xl font-semibold shadow-md shadow-black/40">
                  {initials}
                </div>

                <div className="flex min-w-[140px] flex-1 flex-col">
                  <span className="text-[10px] uppercase tracking-[0.45em] text-[#FFCDD2]">Olá,</span>
                  <span className="text-lg font-semibold leading-tight text-white truncate">
                    {greetingName}
                  </span>
                </div>
              </div>
            </div>

            <dl className="space-y-2 text-[11px]">
              <div>
                <dt className="text-[9px] font-semibold tracking-[0.35em] uppercase text-white">E-mail</dt>
                <dd className="text-sm text-[#FFCDD2]">{email || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-semibold tracking-[0.35em] uppercase text-white">Telefone</dt>
                <dd className="text-sm text-[#FFCDD2]">{telefone || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-semibold tracking-[0.35em] uppercase text-white">Redes sociais</dt>
                <dd className="text-sm text-[#FFCDD2]">{redesSociais || 'Não informado'}</dd>
              </div>
            </dl>

            <div className="flex w-full flex-wrap items-center justify-center gap-3 text-center">
              {editContactAction}
              {enviarTdAction}
            </div>
          </div>
      </div>

      <div className="flex flex-1 basis-full items-stretch lg:w-[40%]">
        <ResumoSlider data={sliderData} />
      </div>
    </div>
  )
}

function getInitials(nome: string) {
  if (!nome) return '??'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('')
}

function getGreetingName(nome: string, maxLength = 18) {
  if (!nome) return ''
  const parts = nome.trim().split(/\s+/)
  let accumulator = ''

  for (const part of parts) {
    const candidate = accumulator ? `${accumulator} ${part}` : part
    if (candidate.length > maxLength) {
      break
    }
    accumulator = candidate
  }

  if (accumulator) {
    return accumulator
  }

  const firstPart = parts[0] ?? ''
  return firstPart.slice(0, maxLength)
}
