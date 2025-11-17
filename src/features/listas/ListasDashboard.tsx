'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import type { ListasData, ListaCandidate, ListaKey } from './loadListasData'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type ListasDashboardProps = {
  data: ListasData
  isComissao: boolean
  selectedListKey?: ListaKey
}

type ListaConfig = {
  title: string
  description: string
  accent?: string
  badge: string
  layoutClass: string
}

const gridOrder: ListaKey[] = ['ordem', 'ac', 'ppp', 'pcd', 'ind']

const listaConfig: Record<ListaKey, ListaConfig> = {
  ordem: {
    title: 'Ordem de Nomeação',
    description: 'Ordem de Nomeação usada pelo Tribunal',
    accent: 'from-red-800 via-red-600 to-red-500',
    badge: 'Geral',
    layoutClass: 'col-span-full md:col-span-2 md:row-span-2 md:min-h-[460px]',
  },
  ac: {
    title: 'Ampla concorrência',
    description: 'Lista de aprovados de Ampla Concorrência',
    accent: 'from-slate-900 via-slate-800 to-zinc-700',
    badge: 'AC',
    layoutClass: 'col-span-full sm:col-span-1 md:col-span-2 md:row-span-1 md:min-h-[220px]',
  },
  pcd: {
    title: 'Pessoas com Deficiência',
    description: 'Lista de aprovados de Pessoas com Deficiência',
    accent: 'from-slate-900 via-slate-800 to-zinc-700',
    badge: 'PCD',
    layoutClass: 'col-span-full sm:col-span-1 md:col-span-2 md:row-span-1 md:min-h-[220px]',
  },
  ppp: {
    title: 'Pessoas Pretas e Pardas',
    description: 'Lista de aprovados de Pessoas Pretas e Pardas',
    accent: 'from-slate-900 via-slate-800 to-zinc-700',
    badge: 'PPP',
    layoutClass: 'col-span-full sm:col-span-1 md:col-span-2 md:row-span-1 md:min-h-[220px]',
  },
  ind: {
    title: 'Indígenas',
    description: 'Lista de aprovados de Indígenas',
    accent: 'from-slate-900 via-slate-800 to-zinc-700',
    badge: 'IND',
    layoutClass: 'col-span-full sm:col-span-1 md:col-span-2 md:row-span-1 md:min-h-[220px]',
  },
}

const numberFormatter = new Intl.NumberFormat('pt-BR')

export function ListasDashboard({ data, isComissao, selectedListKey }: ListasDashboardProps) {
  const router = useRouter()
  const [selectedCandidate, setSelectedCandidate] = useState<ListaCandidate | null>(null)
  const isDetailPage = Boolean(selectedListKey)
  const totalsByKey: Record<ListaKey, { total: number; nomeados: number }> = {
    ordem: {
      total: data.total_aprovados,
      nomeados: data.total_nomeados,
    },
    ac: {
      total: data.total_aprovados_ampla,
      nomeados: data.total_nomeados_ampla,
    },
    pcd: {
      total: data.total_aprovados_pcd,
      nomeados: data.total_nomeados_pcd,
    },
    ppp: {
      total: data.total_aprovados_ppp,
      nomeados: data.total_nomeados_ppp,
    },
    ind: {
      total: data.total_aprovados_indigena,
      nomeados: data.total_nomeados_indigena,
    },
  }

  const handleBackClick = () => {
    if (isDetailPage) {
      router.push('/listas')
      return
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/resumo')
    }
  }

  const renderListaCards = (activeKey?: ListaKey) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 md:grid-rows-2 md:auto-rows-[220px]">
      {gridOrder.map(key => {
        const config = listaConfig[key]
        const candidatos = data[key]
        const nomeadosFallback = candidatos.filter(candidate => candidate.status_nomeacao === 'NOMEADO').length
        const totals = totalsByKey[key]
        const value = totals?.total ?? candidatos.length
        const nomeados = totals?.nomeados ?? nomeadosFallback
        const pendentes = candidatos.filter(c => c.status_nomeacao !== 'NOMEADO' && !c.td_status).length

        return (
          <ListaResumoCard
            key={key}
            title={config.title}
            description={config.description}
            badge={config.badge}
            accent={config.accent}
            value={value}
            nomeados={nomeados}
            pendentes={pendentes}
            active={activeKey === key}
            href={`/listas?lista=${key}`}
            className={config.layoutClass}
          />
        )
      })}
    </div>
  )

  if (!isDetailPage || !selectedListKey) {
    return (
      <section className="space-y-8 pb-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Acompanhamento dos aprovados</h1>
        </div>

        {renderListaCards()}
      </section>
    )
  }

  const activeItems = data[selectedListKey]
  const { title, description } = listaConfig[selectedListKey]

  return (
    <section className="space-y-8 pb-12">
      <button
        type="button"
        onClick={handleBackClick}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-x-0.5 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para listas
      </button>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Lista selecionada</p>
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="text-base text-slate-500">{description}</p>
      </div>

      {renderListaCards(selectedListKey)}

      <Card className="border-none bg-white/90 shadow-xl shadow-zinc-200/60">
        <CardContent className="p-0">
          <div className="border-b border-zinc-100 px-6 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Acompanhamento em tempo real</p>
                <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
                <p className="text-sm text-zinc-500">{description}</p>
              </div>

              <div className="flex flex-col gap-2 text-sm text-zinc-500 md:items-end">
                <Badge variant="secondary" className="bg-zinc-900/90 text-white">
                  {numberFormatter.format(activeItems.length)} aprovados
                </Badge>
                <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                  Clique em uma linha para ver detalhes
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <CandidateTable items={activeItems} showOrdem={selectedListKey === 'ordem'} onSelect={setSelectedCandidate} />
          </div>
        </CardContent>
      </Card>

      <CandidateDrawer
        candidate={selectedCandidate}
        isComissao={isComissao}
        onOpenChange={open => {
          if (!open) {
            setSelectedCandidate(null)
          }
        }}
      />
    </section>
  )
}

type ListaResumoCardProps = {
  title: string
  description: string
  value: number
  nomeados: number
  pendentes: number
  accent?: string
  badge: string
  active?: boolean
  href: string
  className?: string
}

function ListaResumoCard({ title, description, value, nomeados, pendentes, accent, badge, active, href, className }: ListaResumoCardProps) {
  const isOrdemCard = title === 'Ordem de Nomeação'
  const titleClasses = isOrdemCard
    ? 'text-3xl font-bold uppercase tracking-[0.25em] text-zinc-900'
    : 'text-sm uppercase tracking-[0.2em] text-red-400'
  const valueClasses = isOrdemCard ? 'text-7xl font-semibold text-zinc-900' : 'text-4xl font-semibold text-red-600'
  const descriptionClasses = isOrdemCard ? 'text-base text-zinc-900' : 'text-sm text-red-400'

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex w-full flex-col overflow-hidden rounded-3xl border border-transparent p-6 text-left text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70',
        active
          ? 'shadow-2xl shadow-red-500/20 ring-2 ring-offset-2 ring-offset-white'
          : 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10',
        'min-h-[220px] h-full',
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          accent ?? 'from-slate-900 via-slate-800 to-zinc-700',
          active ? 'opacity-100' : 'opacity-90',
        )}
      />
      <div className="absolute inset-0 bg-black/10" />
      <div
        className={cn(
          'relative flex h-full flex-col gap-6',
          isOrdemCard ? 'justify-between text-center items-center' : 'items-center justify-between text-center',
        )}
      >
        <div className={cn('flex text-xs font-semibold uppercase tracking-[0.3em] text-white/80', isOrdemCard ? 'justify-start' : 'justify-center')}>
          <span className="rounded-full border border-white/40 px-3 py-1 text-[11px] font-semibold tracking-[0.3em] text-white">
            {badge}
          </span>
        </div>

        <div className={cn('flex w-full flex-1 flex-col', isOrdemCard ? 'items-center text-center gap-6' : 'items-center text-center') }>
          {isOrdemCard ? (
            <p className={titleClasses}>
              <span className="block">Ordem de</span>
              <span className="block">Nomeação</span>
            </p>
          ) : (
            <p className={cn(titleClasses, 'mt-1')}>{title}</p>
          )}

          {isOrdemCard ? (
            <div className="flex flex-1 items-center justify-center py-6">
              <p className={cn(valueClasses, 'leading-none')}>{numberFormatter.format(value)}</p>
            </div>
          ) : (
            <p className={cn(valueClasses, 'mt-4 mb-3 leading-none')}>{numberFormatter.format(value)}</p>
          )}

          <p className={cn(descriptionClasses, isOrdemCard ? 'mt-6' : 'mt-5')}>{description}</p>
        </div>

        <div
          className={cn(
            'flex w-full text-xs font-semibold uppercase',
            isOrdemCard ? 'justify-between text-white pt-4' : 'justify-between text-white/90',
          )}
        >
          <span className={cn(!isOrdemCard && 'text-left text-white')}>{numberFormatter.format(nomeados)} nomeados</span>
          <span className={cn(!isOrdemCard && 'text-right text-white')}>{numberFormatter.format(pendentes)} aguardando</span>
        </div>
      </div>
    </Link>
  )
}

type TableProps = {
  items: ListaCandidate[]
  showOrdem: boolean
  onSelect: (c: ListaCandidate) => void
}

function CandidateTable({ items, showOrdem, onSelect }: TableProps) {
  if (!items.length) {
    return <p className="rounded-2xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-center text-sm text-zinc-500">Nenhum candidato cadastrado ainda nesta lista.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white">
      <table className="min-w-full divide-y divide-zinc-100 text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {showOrdem && <th className="px-3 py-3 text-left">Ordem</th>}
            <th className="px-3 py-3 text-left">Posição</th>
            <th className="px-3 py-3 text-left">Nome</th>
            <th className="px-3 py-3 text-left">Sistema</th>
            <th className="px-3 py-3 text-left">Classificação</th>
            <th className="px-3 py-3 text-left">Nomeado?</th>
            <th className="px-3 py-3 text-left">TD?</th>
            <th className="px-3 py-3 text-left">Outras aprovações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-600">
          {items.map((candidate, index) => {
            const nomeado = candidate.status_nomeacao === 'NOMEADO'
            const td = candidate.td_status

            return (
              <tr
                key={candidate.id}
                onClick={() => onSelect(candidate)}
                className={cn(
                  'cursor-pointer bg-white transition hover:bg-rose-50/60',
                  nomeado && 'bg-emerald-50/80',
                  td === 'SIM' && 'ring-1 ring-red-200',
                  td === 'TALVEZ' && 'bg-amber-50/70',
                )}
              >
                {showOrdem && (
                  <td className="px-3 py-3 text-left text-zinc-700">{candidate.ordem_nomeacao_base ?? '—'}</td>
                )}
                <td className="px-3 py-3 text-left text-zinc-700">{index + 1}</td>
                <td className="px-3 py-3 text-left font-medium text-zinc-900">{candidate.nome}</td>
                <td className="px-3 py-3 text-left">
                  <Badge variant="outline" className="border-white/40 bg-zinc-900/80 text-white">
                    {sistemaLabel[candidate.sistema_concorrencia]}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-left text-zinc-700">{candidate.classificacao_lista ?? '—'}</td>
                <td className="px-3 py-3 text-left text-zinc-700">{nomeado ? 'Sim' : 'Não'}</td>
                <td className="px-3 py-3 text-left text-zinc-700">{renderTdLabel(candidate.td_status)}</td>
                <td className="px-3 py-3 text-left text-zinc-700">{candidate.outras_aprovacoes_resumo || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type DrawerProps = {
  candidate: ListaCandidate | null
  isComissao: boolean
  onOpenChange: (open: boolean) => void
}

function CandidateDrawer({ candidate, isComissao, onOpenChange }: DrawerProps) {
  const open = !!candidate

  if (!candidate) return null

  const nomeado = candidate.status_nomeacao === 'NOMEADO'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-white text-slate-900">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-slate-900">{candidate.nome}</SheetTitle>
          <SheetDescription className="text-slate-500">
            Detalhes completos do aprovado nesta lista.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={nomeado ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}>
              {nomeado ? 'Nomeado' : 'Em acompanhamento'}
            </Badge>
            <Badge variant="outline" className="border-slate-300 text-slate-600">
              {sistemaLabel[candidate.sistema_concorrencia]}
            </Badge>
          </div>

          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">Dados gerais</p>
            <p>
              <span className="font-medium">Classificação na lista:</span> {candidate.classificacao_lista ?? '—'}
            </p>
            <p>
              <span className="font-medium">Ordem base de nomeação:</span> {candidate.ordem_nomeacao_base ?? '—'}
            </p>
          </section>

          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">Nomeação & TD</p>
            <p>
              <span className="font-medium">Nomeado?</span> {nomeado ? 'Sim' : 'Ainda não'}
            </p>
            <p>
              <span className="font-medium">TD:</span> {renderTdLabel(candidate.td_status)}
            </p>
            {candidate.td_observacao && (
              <p className="text-slate-700">
                <span className="font-medium">Obs. TD:</span> {candidate.td_observacao}
              </p>
            )}
          </section>

          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">Outras aprovações</p>
            <p>{candidate.outras_aprovacoes_resumo || 'Nenhum outro concurso cadastrado.'}</p>
          </section>

          {isComissao && (
            <section className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                Contato (visível só para a comissão)
              </p>
              <p>
                <span className="font-medium">E-mail:</span> {candidate.email || '—'}
              </p>
              <p>
                <span className="font-medium">Telefone:</span> {candidate.telefone || '—'}
              </p>
              <p>
                <span className="font-medium">Redes sociais:</span> {candidate.redes_sociais || '—'}
              </p>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function renderTdLabel(status: ListaCandidate['td_status']) {
  if (status === 'SIM') return 'Sim'
  if (status === 'TALVEZ') return 'Talvez'
  return '—'
}

const sistemaLabel: Record<'AC' | 'PCD' | 'PPP' | 'IND', string> = {
  AC: 'Ampla concorrência',
  PCD: 'Pessoa com deficiência',
  PPP: 'PPP',
  IND: 'Indígena',
}
