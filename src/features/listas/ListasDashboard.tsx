'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, ShieldCheck, Sparkles, Target, Users, type LucideIcon } from 'lucide-react'

import type { ListasData, ListaCandidate } from './loadListasData'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

type ListasDashboardProps = {
  data: ListasData
  isComissao: boolean
}

type ListaKey = 'ordem' | 'ac' | 'pcd' | 'ppp' | 'ind'

type ListaConfig = {
  title: string
  description: string
  accent: string
  badge: string
  icon: LucideIcon
}

const listaKeys: ListaKey[] = ['ordem', 'ac', 'pcd', 'ppp', 'ind']

const listaConfig: Record<ListaKey, ListaConfig> = {
  ordem: {
    title: 'Fila geral',
    description: 'Ordenação base usada pela comissão para convocações.',
    accent: 'from-rose-600 via-orange-500 to-amber-400',
    badge: 'Geral',
    icon: Target,
  },
  ac: {
    title: 'Ampla concorrência',
    description: 'Acompanhamento da lista principal (AC).',
    accent: 'from-slate-900 via-slate-800 to-zinc-700',
    badge: 'AC',
    icon: Users,
  },
  pcd: {
    title: 'Pessoa com deficiência',
    description: 'Vagas reservadas para PCD.',
    accent: 'from-emerald-600 via-green-500 to-lime-400',
    badge: 'PCD',
    icon: ShieldCheck,
  },
  ppp: {
    title: 'PPP',
    description: 'Reserva para pretos e pardos.',
    accent: 'from-indigo-600 via-violet-500 to-fuchsia-500',
    badge: 'PPP',
    icon: Sparkles,
  },
  ind: {
    title: 'Indígena',
    description: 'Lista específica para candidatos indígenas.',
    accent: 'from-amber-700 via-orange-600 to-rose-500',
    badge: 'IND',
    icon: Shield,
  },
}

const numberFormatter = new Intl.NumberFormat('pt-BR')

export function ListasDashboard({ data, isComissao }: ListasDashboardProps) {
  const router = useRouter()
  const [activeList, setActiveList] = useState<ListaKey>('ordem')
  const [selectedCandidate, setSelectedCandidate] = useState<ListaCandidate | null>(null)

  const activeItems = data[activeList]
  const { title, description } = listaConfig[activeList]

  const handleBackClick = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/resumo')
    }
  }

  return (
    <section className="space-y-8 pb-12">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleBackClick}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-x-0.5 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Painel das listas</p>
          <h1 className="text-3xl font-semibold text-slate-900">Acompanhamento dos aprovados</h1>
          <p className="text-base text-slate-500">
            Escolha uma lista no grid de cartões para visualizar os dados detalhados e clique em um nome para abrir o perfil.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listaKeys.map(key => {
          const config = listaConfig[key]
          const candidatos = data[key]
          const nomeados = candidatos.filter(candidate => candidate.status_nomeacao === 'NOMEADO').length
          const pendentes = candidatos.length - nomeados

          return (
            <ListaResumoCard
              key={key}
              title={config.title}
              description={config.description}
              badge={config.badge}
              accent={config.accent}
              icon={config.icon}
              value={candidatos.length}
              nomeados={nomeados}
              pendentes={pendentes}
              active={activeList === key}
              onClick={() => setActiveList(key)}
            />
          )
        })}
      </div>

      <Card className="border-none bg-white/90 shadow-xl shadow-zinc-200/60">
        <CardContent className="p-0">
          <div className="border-b border-zinc-100 px-6 py-6">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Lista selecionada</p>
            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
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
            <CandidateTable items={activeItems} showOrdem={activeList === 'ordem'} onSelect={setSelectedCandidate} />
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
  accent: string
  badge: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}

function ListaResumoCard({ title, description, value, nomeados, pendentes, accent, badge, icon: Icon, active, onClick }: ListaResumoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex min-h-[220px] w-full flex-col overflow-hidden rounded-3xl border border-transparent p-6 text-left text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70',
        active
          ? 'shadow-2xl shadow-red-500/20 ring-2 ring-offset-2 ring-offset-white'
          : 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10',
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br', accent, active ? 'opacity-100' : 'opacity-90')} />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative flex h-full flex-col justify-between gap-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
          <span className="rounded-full border border-white/40 px-3 py-1 text-[11px] font-semibold tracking-[0.3em] text-white">
            {badge}
          </span>
          <Icon className="h-5 w-5 text-white/80" />
        </div>

        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">{title}</p>
          <p className="text-3xl font-semibold">{numberFormatter.format(value)}</p>
          <p className="text-sm text-white/80">{description}</p>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold uppercase text-white/80">
          <span>{numberFormatter.format(nomeados)} nomeados</span>
          <span>{numberFormatter.format(pendentes)} aguardando</span>
        </div>
      </div>
    </button>
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

type TableProps = {
  items: ListaCandidate[]
  showOrdem: boolean
  onSelect: (c: ListaCandidate) => void
}

function CandidateTable({ items, showOrdem, onSelect }: TableProps) {
  if (!items.length) {
    return <p className="text-sm text-slate-500 py-4">Nenhum candidato cadastrado ainda nesta lista.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
            {showOrdem && <th className="py-2 pr-3 text-left">Ordem de nomeação</th>}
            <th className="py-2 pr-3 text-left">Posição</th>
            <th className="py-2 pr-3 text-left">Nome</th>
            <th className="py-2 pr-3 text-left">Sistema</th>
            <th className="py-2 pr-3 text-left">Classificação</th>
            <th className="py-2 pr-3 text-left">Nomeado?</th>
            <th className="py-2 pr-3 text-left">TD?</th>
            <th className="py-2 pr-3 text-left">Outras aprovações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c, index) => {
            const nomeado = c.status_nomeacao === 'NOMEADO'
            const td = c.td_status

            return (
              <tr
                key={c.id}
                onClick={() => onSelect(c)}
                className={cn(
                  'border-b border-slate-100 cursor-pointer transition hover:bg-slate-50',
                  nomeado && 'bg-emerald-50',
                  td === 'SIM' && 'bg-red-50',
                  td === 'TALVEZ' && 'bg-amber-50',
                )}
              >
                {showOrdem && <td className="py-2 pr-3 text-left text-slate-700">{c.ordem_nomeacao_base ?? '—'}</td>}
                <td className="py-2 pr-3 text-left text-slate-700">{index + 1}</td>
                <td className="py-2 pr-3 text-left text-slate-900">{c.nome}</td>
                <td className="py-2 pr-3 text-left text-slate-700">{sistemaLabel[c.sistema_concorrencia]}</td>
                <td className="py-2 pr-3 text-left text-slate-700">{c.classificacao_lista ?? '—'}</td>
                <td className="py-2 pr-3 text-left text-slate-700">{nomeado ? 'Sim' : 'Não'}</td>
                <td className="py-2 pr-3 text-left text-slate-700">{renderTdLabel(c.td_status)}</td>
                <td className="py-2 pr-3 text-left text-slate-700">{c.outras_aprovacoes_resumo || '—'}</td>
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
          <SheetTitle>{candidate.nome}</SheetTitle>
          <SheetDescription className="text-slate-500">Detalhes do aprovado na lista do concurso.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-sm">
          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Dados gerais</p>
            <p>
              <span className="font-medium">Sistema:</span> {sistemaLabel[candidate.sistema_concorrencia]}
            </p>
            <p>
              <span className="font-medium">Classificação na lista:</span> {candidate.classificacao_lista ?? '—'}
            </p>
            <p>
              <span className="font-medium">Ordem base de nomeação:</span> {candidate.ordem_nomeacao_base ?? '—'}
            </p>
          </section>

          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Nomeação & TD</p>
            <p>
              <span className="font-medium">Nomeado?</span> {nomeado ? 'Sim' : 'Ainda não'}
            </p>
            <p>
              <span className="font-medium">TD:</span> {renderTdLabel(candidate.td_status)}
            </p>
            {candidate.td_observacao && (
              <p className="text-slate-700">
                <span className="font-medium">Obs. TD: </span>
                {candidate.td_observacao}
              </p>
            )}
          </section>

          <section className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">Outras aprovações</p>
            <p>{candidate.outras_aprovacoes_resumo || 'Nenhum outro concurso cadastrado.'}</p>
          </section>

          {isComissao && (
            <section className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
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

function isSistemaValue(value: string): value is 'AC' | 'PCD' | 'PPP' | 'IND' {
  return value === 'AC' || value === 'PCD' || value === 'PPP' || value === 'IND'
}
