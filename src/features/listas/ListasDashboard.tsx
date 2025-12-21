'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, PencilLine, Search } from 'lucide-react'

import type { ListasData, ListaCandidate, ListaKey, CandidateOutraAprovacao } from './loadListasData'
import type { SistemaConcorrencia, SaveOutraAprovacaoInput, PretendeAssumirChoice, JaNomeadoChoice } from './listas-actions'
import type { CandidateListasProfile, OutraAprovacaoListItem, OutraAprovacaoStatus } from './types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EnviarTdModal } from '@/src/app/(app)/resumo/ResumoModals'
import { listaSistemaStyles } from './lista-styles'

type ListasDashboardProps = {
  data: ListasData
  isComissao: boolean
  selectedListKey?: ListaKey
  currentCandidate?: CandidateListasProfile
  outrasAprovacoes?: OutraAprovacaoListItem[]
  onSaveOutraAprovacao?: (input: SaveOutraAprovacaoInput) => Promise<void>
}

type ListaConfig = {
  title: string
  description: string
  accent?: string
  badge: string
  layoutClass: string
}

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

const otherApprovalsChipClass = 'border-[#8c6f87] bg-[#8c6f87] text-white'
const ordemControleStyles = listaSistemaStyles

const listaButtonColorClass: Record<ListaKey, string> = {
  ordem: 'bg-gradient-to-r from-red-900 via-red-700 to-red-500 text-white',
  ac: ordemControleStyles.AC.className,
  pcd: ordemControleStyles.PCD.className,
  ppp: ordemControleStyles.PPP.className,
  ind: ordemControleStyles.IND.className,
}

const sistemaLabel: Record<SistemaConcorrencia, string> = {
  AC: 'AMPLA',
  PCD: 'PCD',
  PPP: 'PPP',
  IND: 'IND',
}

const LIST_PAGE_SIZE_OPTIONS = [25, 50, 75, 100, 200, 'ALL'] as const
type ListPageSizeOption = typeof LIST_PAGE_SIZE_OPTIONS[number]

export function ListasDashboard({ data, isComissao, selectedListKey, currentCandidate, outrasAprovacoes = [], onSaveOutraAprovacao }: ListasDashboardProps) {
  const router = useRouter()
  const [selectedCandidate, setSelectedCandidate] = useState<ListaCandidate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState<ListPageSizeOption>(50)
  const [currentPage, setCurrentPage] = useState(1)
  const isDetailPage = Boolean(selectedListKey)
  const candidateFromOrdem = currentCandidate ? data.ordem.find(candidate => candidate.id === currentCandidate.id) : null
  const candidateId = currentCandidate?.id
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (size: ListPageSizeOption) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const renderListaButtons = (activeKey?: ListaKey) => {
    const ordemConfig = listaConfig.ordem
    const ordemButton = (
      <ListaButton
        key="ordem"
        title={ordemConfig.title}
        href="/listas/ordem"
        variant="primary"
        active={activeKey === 'ordem'}
        colorClass={listaButtonColorClass.ordem}
      />
    )

    const secondaryKeys: ListaKey[] = ['ac', 'ppp', 'pcd', 'ind']

    return (
      <div className="rounded-3xl border border-zinc-200 bg-white/80 p-5 shadow-sm min-h-[520px] flex flex-col lg:h-full">
        <p className="text-xs font-semibold tracking-[0.08em] text-red-500">Listas</p>
        <p className="mt-1 text-sm text-zinc-500">Escolha qual acompanhamento deseja abrir.</p>
        <div className="mt-4 space-y-4 flex-1">
          {ordemButton}
          <div className="grid gap-3 sm:grid-cols-2">
            {secondaryKeys.map(key => (
              <ListaButton
                key={key}
                title={listaConfig[key].title}
                href={`/listas/${key}`}
                variant="secondary"
                active={activeKey === key}
                colorClass={listaButtonColorClass[key]}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isDetailPage || !selectedListKey) {
    return (
      <section className="space-y-8 pb-12">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col gap-6 lg:h-[840px] lg:min-h-0 lg:overflow-hidden">
            <CandidateProfileCard
              ordemCandidate={candidateFromOrdem}
              candidateProfile={currentCandidate}
              candidateId={candidateId}
            />
            <MinhasOutrasAprovacoesCard
              candidateId={candidateId}
              approvals={outrasAprovacoes}
              onSave={onSaveOutraAprovacao}
            />
          </div>
          <div className="lg:h-[840px]">{renderListaButtons()}</div>
        </div>
      </section>
    )
  }

  const activeItems = data[selectedListKey]
  const { title } = listaConfig[selectedListKey]
  const filteredItems = filterCandidates(activeItems, searchTerm)
  const isAllPageSize = pageSize === 'ALL'
  const totalItems = filteredItems.length
  const totalPages = isAllPageSize ? 1 : Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = isAllPageSize ? 1 : Math.min(currentPage, totalPages)

  useEffect(() => {
    if (!isAllPageSize && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, isAllPageSize, totalPages])

  const paginatedItems = useMemo(() => {
    if (isAllPageSize) {
      return filteredItems
    }

    const start = (safeCurrentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, isAllPageSize, pageSize, safeCurrentPage])

  const handleGoToPreviousPage = () => {
    if (isAllPageSize) return
    setCurrentPage(previous => Math.max(1, previous - 1))
  }

  const handleGoToNextPage = () => {
    if (isAllPageSize) return
    setCurrentPage(previous => Math.min(totalPages, previous + 1))
  }
  return (
    <section className="-mt-4 flex min-h-[calc(100vh-64px)] flex-1 flex-col pb-0">
      <div className="-mx-3 flex min-h-0 flex-1 flex-col sm:-mx-4 lg:-mx-6 xl:-mx-8 md:-mt-16">
        <div className="flex min-h-0 flex-1 flex-col border border-[#bdbbbb] bg-white shadow-xl shadow-zinc-200/60">
          <div className="grid flex-1 min-h-[calc(100vh-64px)] grid-rows-[auto_1fr_auto]">
            <ListHeaderCard
              title={title}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />

            <div className="min-h-0">
              <div className="flex h-full flex-col border border-[#bdbbbb] border-t-0 bg-white shadow-sm">
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                  <CandidateTable
                    items={paginatedItems}
                    showOrdem={selectedListKey === 'ordem'}
                    onSelect={setSelectedCandidate}
                  />
                </div>
              </div>
            </div>

            <ListPaginationFooter
              totalItems={totalItems}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPrevious={handleGoToPreviousPage}
              onNext={handleGoToNextPage}
              isAll={isAllPageSize}
            />
          </div>
        </div>
      </div>

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

type CandidateProfileCardProps = {
  ordemCandidate?: ListaCandidate | null
  candidateProfile?: CandidateListasProfile
  candidateId?: string
}

function CandidateProfileCard({ ordemCandidate, candidateProfile, candidateId }: CandidateProfileCardProps) {
  const hasCandidate = Boolean(ordemCandidate || candidateProfile)
  const nome = ordemCandidate?.nome ?? candidateProfile?.nome ?? 'Vincule seu perfil de candidato'
  const avatarUrl = candidateProfile?.avatar_url
  const avatarFallback = initialsFromName(nome)
  const ordemPosicao = ordemCandidate?.ordem_nomeacao_base ?? candidateProfile?.ordem_nomeacao_base ?? null
  const sistema = ordemCandidate?.sistema_concorrencia ?? candidateProfile?.sistema_concorrencia
  const tdStatus = candidateProfile?.td_status ?? ordemCandidate?.td_status ?? null
  const observacao = candidateProfile?.td_observacao ?? ordemCandidate?.td_observacao ?? 'Sem observações registradas.'
  const canSendTd = Boolean(candidateId)

  return (
    <Card className="border-none bg-white/90 shadow-lg shadow-zinc-200/60 lg:flex-none">
      <CardContent className="p-6 lg:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-zinc-200 shadow-sm">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={nome} /> : null}
                <AvatarFallback className="text-lg font-semibold text-zinc-700">{avatarFallback}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold text-zinc-900">{nome}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                  <span>Ordem de nomeação:</span>
                  <span>{ordemPosicao ? <OrdemNumeroChip posicao={ordemPosicao} sistema={sistema ?? 'AC'} /> : <span className="text-zinc-400">—</span>}</span>
                  <span className="text-zinc-300">•</span>
                  <span>Lista:</span>
                  <span>{sistema ? <ListaSistemaChip sistema={sistema} /> : <span className="text-zinc-400">—</span>}</span>
                </div>
                {!hasCandidate && (
                  <p className="mt-2 text-sm text-zinc-500">Associe seu cadastro para acompanhar os detalhes.</p>
                )}
              </div>
            </div>
            <div className="flex justify-start sm:justify-end">
              {canSendTd && candidateId && (
                <EnviarTdModal
                  candidateId={candidateId}
                  trigger={
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
                    >
                      Enviar TD
                    </button>
                  }
                />
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="TD" value={renderTdLabel(tdStatus ?? null)} hint="Interesse em assumir" />
            <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-400">Observações</p>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-700">{observacao}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type StatCardProps = {
  label: string
  value: ReactNode
  hint?: string
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

type MinhasOutrasAprovacoesCardProps = {
  candidateId?: string
  approvals: OutraAprovacaoListItem[]
  onSave?: (input: SaveOutraAprovacaoInput) => Promise<void>
}

type CargoOptionValue = 'TJAA' | 'AJAJ' | 'AJAA' | 'OUTRO'

type OutraAprovacaoFormState = {
  orgao: string
  cargoTipo: CargoOptionValue
  cargoOutro: string
  sistema: SistemaConcorrencia
  classificacao: string
  pretendeAssumir: PretendeAssumirChoice
  jaNomeado: JaNomeadoChoice
  observacao: string
}

const emptyApprovalState: OutraAprovacaoFormState = {
  orgao: '',
  cargoTipo: 'TJAA',
  cargoOutro: '',
  sistema: 'AC',
  classificacao: '',
  pretendeAssumir: 'TALVEZ',
  jaNomeado: 'NAO',
  observacao: '',
}

const cargoOptions: { value: CargoOptionValue; label: string }[] = [
  { value: 'TJAA', label: 'TJAA' },
  { value: 'AJAJ', label: 'AJAJ' },
  { value: 'AJAA', label: 'AJAA' },
  { value: 'OUTRO', label: 'Outro' },
]

const sistemaOptions = [
  { value: 'AC', label: 'Ampla' },
  { value: 'PCD', label: 'PCD' },
  { value: 'PPP', label: 'PPP' },
  { value: 'IND', label: 'Indígena' },
]

const pretendeOptions = [
  { value: 'SIM', label: 'Sim' },
  { value: 'TALVEZ', label: 'Talvez' },
  { value: 'NAO', label: 'Não' },
]

const jaNomeadoOptions = [
  { value: 'SIM', label: 'Sim' },
  { value: 'NAO', label: 'Não' },
]

const cargoPresetValues: CargoOptionValue[] = ['TJAA', 'AJAJ', 'AJAA']

const approvalStatusStyles: Record<OutraAprovacaoStatus, { label: string; className: string }> = {
  APROVADO: {
    label: 'Aprovado',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  PENDENTE: {
    label: 'Pendente',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  RECUSADO: {
    label: 'Recusado',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
}

function deriveCargoState(value?: string | null): { cargoTipo: CargoOptionValue; cargoOutro: string } {
  const normalized = value?.toUpperCase() ?? ''
  if (cargoPresetValues.includes(normalized as CargoOptionValue)) {
    return { cargoTipo: normalized as CargoOptionValue, cargoOutro: '' }
  }
  return { cargoTipo: 'OUTRO', cargoOutro: value ?? '' }
}

function resolveCargoValue(state: OutraAprovacaoFormState): string {
  if (state.cargoTipo === 'OUTRO') {
    return state.cargoOutro.trim()
  }
  return state.cargoTipo
}

function MinhasOutrasAprovacoesCard({ candidateId, approvals, onSave }: MinhasOutrasAprovacoesCardProps) {
  const router = useRouter()
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [activeApproval, setActiveApproval] = useState<OutraAprovacaoListItem | null>(null)
  const [formState, setFormState] = useState<OutraAprovacaoFormState>(emptyApprovalState)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const canEdit = Boolean(candidateId && onSave)

  const openCreateDialog = () => {
    setDialogMode('create')
    setActiveApproval(null)
    setFormState(emptyApprovalState)
  }

  const openEditDialog = (approval: OutraAprovacaoListItem) => {
    setDialogMode('edit')
    setActiveApproval(approval)
    const cargoState = deriveCargoState(approval.cargo)
    setFormState({
      orgao: approval.orgao,
      cargoTipo: cargoState.cargoTipo,
      cargoOutro: cargoState.cargoOutro,
      sistema: approval.sistema_concorrencia,
      classificacao: approval.classificacao ? String(approval.classificacao) : '',
      pretendeAssumir: approval.pretende_assumir,
      jaNomeado: approval.ja_foi_nomeado === 'SIM' ? 'SIM' : 'NAO',
      observacao: approval.observacao ?? '',
    })
  }

  const closeDialog = () => {
    if (isPending) return
    setDialogMode(null)
    setActiveApproval(null)
    setFormState(emptyApprovalState)
  }

  const handleSubmit = () => {
    if (!candidateId || !onSave) return
    if (!formState.orgao.trim()) {
      setStatus({ type: 'error', text: 'Informe o órgão.' })
      return
    }

    const cargoValue = resolveCargoValue(formState)
    if (!cargoValue) {
      setStatus({ type: 'error', text: 'Informe o cargo.' })
      return
    }

    const classificacaoNumber = formState.classificacao ? Number.parseInt(formState.classificacao, 10) : null

    startTransition(async () => {
      try {
        await onSave({
          id: dialogMode === 'edit' ? activeApproval?.id : undefined,
          candidateId,
          orgao: formState.orgao.trim(),
          cargo: cargoValue,
          sistemaConcorrencia: formState.sistema,
          classificacao: Number.isNaN(classificacaoNumber) ? null : classificacaoNumber,
          pretendeAssumir: formState.pretendeAssumir,
          jaNomeado: formState.jaNomeado,
          observacao: formState.observacao ? formState.observacao.trim() : null,
        })
        setStatus({ type: 'success', text: dialogMode === 'edit' ? 'Aprovação atualizada.' : 'Aprovação cadastrada.' })
        closeDialog()
        router.refresh()
      } catch (error) {
        console.error(error)
        setStatus({ type: 'error', text: 'Não foi possível salvar essa aprovação agora.' })
      }
    })
  }

  return (
    <Card className="border-none bg-white/90 shadow-lg shadow-zinc-200/60 lg:flex-1 lg:min-h-0">
      <CardContent className="flex h-full flex-col space-y-5 p-6 lg:min-h-0 lg:p-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">Minhas outras aprovações</p>
          <button
            type="button"
            onClick={openCreateDialog}
            disabled={!canEdit}
            className="inline-flex items-center rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Adicionar aprovação
          </button>
        </div>

        {!canEdit && (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            Vincule-se a um candidato para editar esta seção.
          </p>
        )}

        {status && (
          <p className={cn('rounded-2xl px-4 py-2 text-xs', status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600')}>
            {status.text}
          </p>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto pr-1 lg:min-h-0">
          {approvals.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
              Nenhuma aprovação cadastrada ainda.
            </p>
          ) : (
            approvals.map(approval => (
              <div key={approval.id} className="rounded-3xl border border-zinc-200 bg-white/80 p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{approval.orgao}</p>
                    <p className="text-xs text-zinc-500">{approval.cargo}</p>
                    {approval.updated_at && (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                        Atualizado em {formatTimestamp(approval.updated_at) ?? '—'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ApprovalStatusBadge status={approval.status} />
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEditDialog(approval)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
                      >
                        <PencilLine className="h-4 w-4" />
                        <span className="sr-only">Editar aprovação</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-[10px] text-zinc-400">Sistema</p>
                    <p className="text-sm text-zinc-900">{sistemaLabel[approval.sistema_concorrencia]}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-[10px] text-zinc-400">Classificação</p>
                    <p className="text-sm text-zinc-900">{approval.classificacao ? `#${approval.classificacao}` : '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-[10px] text-zinc-400">Pretende assumir?</p>
                    <p className="text-sm text-zinc-900">{formatPretendeAssumir(approval.pretende_assumir)}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                    <p className="text-[10px] text-zinc-400">Já nomeado?</p>
                    <p className="text-sm text-zinc-900">{formatJaFoiNomeado(approval.ja_foi_nomeado)}</p>
                  </div>
                </div>

                {approval.observacao && (
                  <p className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">{approval.observacao}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={dialogMode !== null} onOpenChange={open => (!open ? closeDialog() : undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border border-zinc-200 bg-white text-zinc-900 shadow-2xl shadow-zinc-900/10">
          <DialogHeader>
            <DialogTitle className="text-xl text-zinc-900">{dialogMode === 'edit' ? 'Editar aprovação' : 'Nova aprovação'}</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">Mantenha os demais concursos em que você foi aprovado atualizados.</DialogDescription>
          </DialogHeader>

          <OutraAprovacaoForm
            state={formState}
            onChange={setFormState}
            disabled={isPending}
          />

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {dialogMode === 'edit' ? 'Salvar alterações' : 'Cadastrar aprovação'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

type OutraAprovacaoFormProps = {
  state: OutraAprovacaoFormState
  onChange: (next: OutraAprovacaoFormState) => void
  disabled?: boolean
}

function OutraAprovacaoForm({ state, onChange, disabled }: OutraAprovacaoFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Órgão</label>
        <Input
          value={state.orgao}
          onChange={event => onChange({ ...state, orgao: event.target.value })}
          placeholder="Ex.: TRF-3"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Cargo</label>
          <Select
            value={state.cargoTipo}
            onValueChange={value => onChange({ ...state, cargoTipo: value as CargoOptionValue })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {cargoOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state.cargoTipo === 'OUTRO' && (
          <Input
            value={state.cargoOutro}
            onChange={event => onChange({ ...state, cargoOutro: event.target.value })}
            placeholder="Digite o cargo"
            disabled={disabled}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Sistema</label>
          <Select
            value={state.sistema}
            onValueChange={value => onChange({ ...state, sistema: value as SistemaConcorrencia })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {sistemaOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Classificação</label>
          <Input
            type="number"
            min={1}
            placeholder="Ex.: 12"
            value={state.classificacao}
            onChange={event => onChange({ ...state, classificacao: event.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Pretende assumir?</label>
          <Select
            value={state.pretendeAssumir}
            onValueChange={value => onChange({ ...state, pretendeAssumir: value as PretendeAssumirChoice })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {pretendeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Já foi nomeado?</label>
          <Select
            value={state.jaNomeado}
            onValueChange={value => onChange({ ...state, jaNomeado: value as JaNomeadoChoice })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {jaNomeadoOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Observações</label>
        <textarea
          className="min-h-[96px] w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-60"
          value={state.observacao}
          onChange={event => onChange({ ...state, observacao: event.target.value })}
          placeholder="Anote qualquer detalhe relevante"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

type ListaButtonProps = {
  title: string
  href: string
  variant: 'primary' | 'secondary'
  active?: boolean
  colorClass: string
}

function ListaButton({ title, href, variant, active, colorClass }: ListaButtonProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex w-full items-center justify-center overflow-hidden rounded-3xl border border-transparent px-6 py-6 text-center font-semibold uppercase tracking-[0.35em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70',
        'text-white',
        variant === 'primary' ? 'min-h-[150px] text-base' : 'min-h-[110px] text-sm',
        colorClass,
        active ? 'ring-2 ring-offset-2 ring-offset-white' : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20',
      )}
    >
      <span>{title}</span>
    </Link>
  )
}

type TableProps = {
  items: ListaCandidate[]
  showOrdem: boolean
  onSelect: (c: ListaCandidate) => void
}

type ListHeaderCardProps = {
  title: string
  searchTerm: string
  onSearchChange: (value: string) => void
}

function filterCandidates(items: ListaCandidate[], term: string) {
  const normalizedTerm = term.trim().toLowerCase()

  if (!normalizedTerm) return items

  return items.filter(candidate => {
    const nomeMatch = candidate.nome.toLowerCase().includes(normalizedTerm)
    const outrasMatch = candidate.outras_aprovacoes?.some(approval => {
      const orgaoMatch = approval.orgao.toLowerCase().includes(normalizedTerm)
      const cargoMatch = approval.cargo?.toLowerCase().includes(normalizedTerm) ?? false
      return orgaoMatch || cargoMatch
    })
    return nomeMatch || Boolean(outrasMatch)
  })
}

function ListHeaderCard({ title, searchTerm, onSearchChange }: ListHeaderCardProps) {
  return (
    <div className="border border-[#bdbbbb] border-b-0 bg-[#bdbbbb] px-4 pt-3 pb-3 text-[#1f1f1f] shadow-sm">
      <div className="grid items-start gap-y-3 font-['Aller'] md:grid-cols-[minmax(0,1fr)_minmax(220px,1fr)] md:grid-rows-[auto_auto]">
        <h2 className="order-1 text-left text-3xl font-heading font-semibold tracking-[0.05em] text-[#004C3F] md:col-start-1">
          {title}
        </h2>
        <div className="order-2 w-full md:col-start-2 md:ml-auto md:w-auto">
          <label className="sr-only" htmlFor="listas-search">
            Buscar por nome ou órgão
          </label>
          <div className="flex h-6 w-full items-center gap-1 rounded-full border border-[#004C3F] bg-white/80 px-2 shadow-sm transition focus-within:ring-2 focus-within:ring-[#004C3F]/25 md:w-[190px]">
            <Search className="h-[11px] w-[11px] text-[#004C3F]" strokeWidth={1.25} aria-hidden="true" />
            <input
              id="listas-search"
              type="search"
              placeholder="Buscar por nome ou órgão"
              value={searchTerm}
              onChange={event => onSearchChange(event.target.value)}
              className="w-full border-none bg-transparent text-[11px] font-['Aller'] font-medium tracking-tight text-[#1f1f1f] placeholder:text-[#7a7a7a] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function CandidateTable({ items, showOrdem, onSelect }: TableProps) {
  const totalColumns = showOrdem ? 8 : 6

  return (
    <table className="min-w-full table-fixed divide-y divide-zinc-100 text-sm">
      <thead className="sticky top-0 z-10 bg-white shadow-sm">
        <tr className="bg-white/95 text-[11px] uppercase tracking-[0.3em] text-zinc-500">
          {showOrdem && (
            <>
              <th className="pl-1 pr-0.5 py-3 text-center">Ordem</th>
              <th className="pl-0.5 pr-0.5 py-3 text-center">Lista</th>
            </>
          )}
          <th className="px-0.5 py-3 text-center">Nome</th>
          <th className="px-0.5 py-3 text-center">Pos. Lista</th>
          <th className="px-0.5 py-3 text-center">Nomeado?</th>
          <th className="px-0.5 py-3 text-center">TD?</th>
          <th className="px-0.5 py-3 text-center">Outras aprovações</th>
          <th className="w-0 px-0.5 py-3 text-center">
            <span className="sr-only">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 text-zinc-600">
        {items.length === 0 ? (
          <tr>
            <td colSpan={totalColumns} className="bg-white/70 px-4 py-6 text-center text-sm text-zinc-500">
              Nenhum candidato cadastrado ainda nesta lista.
            </td>
          </tr>
        ) : (
          items.map(candidate => {
            const nomeado = candidate.status_nomeacao === 'NOMEADO'
            const td = candidate.td_status
            const rowHighlightStyle = getRowHighlightStyle(nomeado, td)

            return (
              <tr
                key={candidate.id}
                className={cn('transition')}
                style={rowHighlightStyle}
              >
                {showOrdem && (
                  <>
                    <td className="pl-2 pr-1 py-3 text-center text-zinc-700">
                      <OrdemNumeroChip posicao={candidate.ordem_nomeacao_base} sistema={candidate.sistema_concorrencia} />
                    </td>
                    <td className="pl-1 pr-2 py-3 text-center">
                      <OrdemControleChip posicao={candidate.ordem_nomeacao_base} sistema={candidate.sistema_concorrencia} />
                    </td>
                  </>
                )}
                <td className="px-0.5 py-3 text-left font-medium text-zinc-900">{candidate.nome}</td>
                <td className="px-0.5 py-3 text-center text-zinc-700">{candidate.classificacao_lista ?? '—'}</td>
                <td className="px-0.5 py-3 text-center text-zinc-700">{renderNomeadoChip(nomeado)}</td>
                <td className="px-0.5 py-3 text-center text-zinc-700">{renderTdChip(candidate.td_status)}</td>
                <td className="px-0.5 py-3 text-left text-zinc-700">
                  <OutrasAprovacoesChips approvals={candidate.outras_aprovacoes} resumo={candidate.outras_aprovacoes_resumo} />
                </td>
                <td className="px-0.5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSelect(candidate)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                    aria-label={`Ver detalhes de ${candidate.nome}`}
                  >
                    <span className="text-lg leading-none">&gt;</span>
                  </button>
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}

type ListPaginationFooterProps = {
  totalItems: number
  pageSize: ListPageSizeOption
  onPageSizeChange: (size: ListPageSizeOption) => void
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
  isAll: boolean
}

function ListPaginationFooter({
  totalItems,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  isAll,
}: ListPaginationFooterProps) {
  const selectValue = pageSize === 'ALL' ? 'ALL' : String(pageSize)
  const canNavigate = !isAll && totalPages > 1 && totalItems > 0
  const disablePrevious = !canNavigate || currentPage <= 1
  const disableNext = !canNavigate || currentPage >= totalPages
  const pageLabel = totalItems
    ? (isAll ? `Todos os itens` : `Página ${currentPage} de ${totalPages}`)
    : 'Nenhum item'

  const handleValueChange = (value: string) => {
    const parsed = value === 'ALL' ? 'ALL' : Number(value)
    onPageSizeChange(parsed as ListPageSizeOption)
  }

  return (
    <div className="flex w-full flex-shrink-0 flex-nowrap items-center justify-between gap-3 border-t border-zinc-100 bg-white px-3 py-2 text-[10px] font-['Aller'] font-medium uppercase tracking-[0.14em] text-[#1f1f1f] sm:px-4">
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">Itens por página</span>
        <Select value={selectValue} onValueChange={handleValueChange}>
          <SelectTrigger className="h-[22px] min-w-[70px] rounded-full border border-[#004C3F] bg-white px-2 text-[10px] font-['Aller'] font-semibold uppercase tracking-[0.12em] text-[#004C3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004C3F]/25">
            <SelectValue placeholder="50" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-zinc-200 bg-white text-[10px] font-['Aller'] uppercase tracking-[0.12em] text-[#004C3F] shadow-lg">
            {LIST_PAGE_SIZE_OPTIONS.map(option => (
              <SelectItem key={String(option)} value={option === 'ALL' ? 'ALL' : String(option)}>
                {option === 'ALL' ? 'Todos' : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={disablePrevious}
          className="inline-flex items-center gap-1 rounded-full border border-[#004C3F] bg-white px-2 py-0.5 text-[10px] font-['Aller'] font-semibold uppercase tracking-[0.12em] text-[#004C3F] transition hover:bg-[#004C3F]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004C3F]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-2.5 w-2.5" aria-hidden="true" />
          <span>Anterior</span>
        </button>
        <span className="text-[#5f5f5f]">{pageLabel}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          className="inline-flex items-center gap-1 rounded-full border border-[#004C3F] bg-white px-2 py-0.5 text-[10px] font-['Aller'] font-semibold uppercase tracking-[0.12em] text-[#004C3F] transition hover:bg-[#004C3F]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004C3F]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Próxima</span>
          <ChevronRight className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      </div>
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

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">Outras aprovações</p>
            {!candidate.outras_aprovacoes?.length ? (
              <p>Nenhum outro concurso aprovado cadastrado.</p>
            ) : (
              <div className="space-y-4">
                {candidate.outras_aprovacoes.map(approval => (
                  <div key={approval.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{approval.orgao}</p>
                        <p className="text-xs text-slate-500">{approval.cargo || '—'}</p>
                      </div>
                      <ListaSistemaChip sistema={approval.sistema_concorrencia} />
                    </div>

                    <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Classificação</dt>
                        <dd className="text-sm text-slate-800">{approval.classificacao ? `#${approval.classificacao}` : '—'}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Pretende assumir?</dt>
                        <dd className="text-sm text-slate-800">{formatPretendeAssumir(approval.pretende_assumir)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Já foi nomeado?</dt>
                        <dd className="text-sm text-slate-800">{formatJaFoiNomeado(approval.ja_foi_nomeado)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Aprovado em</dt>
                        <dd className="text-sm text-slate-800">{formatTimestamp(approval.approved_at) || '—'}</dd>
                      </div>
                    </dl>

                    {approval.observacao && (
                      <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{approval.observacao}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
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

type OrdemChipProps = {
  posicao: number | null
  sistema: SistemaConcorrencia
}

function OrdemNumeroChip({ posicao, sistema }: OrdemChipProps) {
  if (!posicao) {
    return <span className="text-[11px] text-zinc-400">—</span>
  }

  const style = ordemControleStyles[sistema]

  return (
    <span
      className={cn(
        'inline-flex min-w-[32px] items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold text-current',
        style.numberClassName,
      )}
    >
      {posicao}
    </span>
  )
}

function OrdemControleChip({ posicao, sistema }: OrdemChipProps) {
  if (!posicao) {
    return <span className="text-[11px] text-zinc-400">—</span>
  }

  const style = ordemControleStyles[sistema]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        style.className,
      )}
    >
      {style.label}
    </span>
  )
}

type ListaSistemaChipProps = {
  sistema?: SistemaConcorrencia | null
}

function ListaSistemaChip({ sistema }: ListaSistemaChipProps) {
  if (!sistema) {
    return <span className="text-[11px] text-zinc-400">—</span>
  }

  const style = ordemControleStyles[sistema]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        style.className,
      )}
    >
      {style.label}
    </span>
  )
}

function getRowHighlightStyle(nomeado: boolean, tdStatus: ListaCandidate['td_status']): CSSProperties | undefined {
  if (tdStatus === 'SIM') {
    return { backgroundColor: 'rgba(194, 45, 45, 0.16)' }
  }

  if (tdStatus === 'TALVEZ') {
    return { backgroundColor: 'rgba(224, 126, 52, 0.16)' }
  }

  if (nomeado) {
    return { backgroundColor: 'rgba(112, 196, 119, 0.18)' }
  }

  return undefined
}

function renderNomeadoChip(nomeado: boolean) {
  const baseClasses = 'inline-flex min-w-[80px] justify-center rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide'

  if (nomeado) {
    return <span className={cn(baseClasses, 'border-[#216626] bg-[#216626] text-white')}>Sim</span>
  }

  return <span className={cn(baseClasses, 'border-zinc-200 bg-white text-zinc-500')}>Não</span>
}

function renderTdChip(status: ListaCandidate['td_status']) {
  const baseClasses = 'inline-flex min-w-[80px] justify-center rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide'

  if (status === 'SIM') {
    return <span className={cn(baseClasses, 'border-[#8f1b1b] bg-[#8f1b1b] text-white')}>Sim</span>
  }

  if (status === 'TALVEZ') {
    return <span className={cn(baseClasses, 'border-[#b55a1d] bg-[#b55a1d] text-white')}>Talvez</span>
  }

  return <span className={cn(baseClasses, 'border-zinc-200 bg-white text-zinc-500')}>—</span>
}

type OutrasAprovacoesChipsProps = {
  approvals?: CandidateOutraAprovacao[]
  resumo?: string | null
}

function OutrasAprovacoesChips({ approvals, resumo }: OutrasAprovacoesChipsProps) {
  if (!approvals?.length) {
    return <span>{resumo || '—'}</span>
  }

  const [first, ...rest] = approvals

  return (
    <div className="flex items-center gap-2">
      <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', otherApprovalsChipClass)}>{first.orgao}</span>
      {rest.length > 0 && <span className="text-xs font-semibold text-zinc-400">+{rest.length}</span>}
    </div>
  )
}

function formatTimestamp(value?: string | null) {
  if (!value) return null
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
  } catch (error) {
    console.error('Erro ao formatar data', error)
    return null
  }
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
    .padEnd(2, '?')
}

function renderTdLabel(status: ListaCandidate['td_status']) {
  if (status === 'SIM') return 'Sim'
  if (status === 'TALVEZ') return 'Talvez'
  return '—'
}

function ApprovalStatusBadge({ status }: { status: OutraAprovacaoStatus }) {
  const style = approvalStatusStyles[status]
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', style.className)}>
      {style.label}
    </span>
  )
}

function formatPretendeAssumir(value: 'SIM' | 'NAO' | 'TALVEZ') {
  if (value === 'SIM') return 'Sim'
  if (value === 'NAO') return 'Não'
  return 'Talvez'
}

function formatJaFoiNomeado(value: 'SIM' | 'NAO' | 'EM_ANDAMENTO') {
  if (value === 'SIM') return 'Sim'
  if (value === 'NAO') return 'Não'
  return 'Em andamento'
}
