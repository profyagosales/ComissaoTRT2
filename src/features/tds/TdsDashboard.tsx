'use client'

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react"
import DOMPurify from "dompurify"
import { CalendarIcon, ChevronLeft, ChevronRight, ExternalLink, Inbox, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { SistemaConcorrencia } from "@/features/listas/listas-actions"
import { listaSistemaStyles } from "@/features/listas/lista-styles"
import { cn } from "@/lib/utils"
import type { TdsData, TdItem } from "./loadTdsData"
import type { TdRequestTipo } from "./td-types"

type StatusTab = "ENVIADOS" | "TALVEZ"
type ListaFiltro = SistemaConcorrencia | "TODOS"
type PageSizeOption = 8 | 12 | 16 | 24 | "ALL"

const PAGE_SIZE_OPTIONS: readonly PageSizeOption[] = [8, 12, 16, 24, "ALL"] as const

const listaBaseColors: Record<SistemaConcorrencia, string> = {
  AC: "#0a408c",
  PCD: "#510a8c",
  PPP: "#8c420a",
  IND: "#353638",
}

const subFilterColors: Record<ListaFiltro, string> = {
  TODOS: "#111827",
  AC: listaBaseColors.AC,
  PCD: listaBaseColors.PCD,
  PPP: listaBaseColors.PPP,
  IND: listaBaseColors.IND,
}

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
})

export type CurrentCandidateSummary = {
  id: string
  nome: string
  avatarUrl?: string | null
}

export type CandidateTdSnapshot = {
  tipo: TdRequestTipo | null
  dataReferencia: string | null
}

type TdsDashboardProps = {
  data: TdsData
  isComissao: boolean
  currentCandidate?: CurrentCandidateSummary
  currentCandidateTd?: CandidateTdSnapshot | null
}

export function TdsDashboard({ data, isComissao: _isComissao, currentCandidate: _currentCandidate, currentCandidateTd: _currentCandidateTd }: TdsDashboardProps) {
  void _isComissao
  void _currentCandidate
  void _currentCandidateTd

  const [statusTab, setStatusTab] = useState<StatusTab>("ENVIADOS")
  const [listaFiltro, setListaFiltro] = useState<ListaFiltro>("TODOS")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [pageSize, setPageSize] = useState<PageSizeOption>(8)
  const [currentPage, setCurrentPage] = useState(1)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const { content } = data
  const totalItems = data.items.length
  const sanitizedHowItWorks = useMemo(() => DOMPurify.sanitize(content.howItWorksHtml), [content.howItWorksHtml])
  const sanitizedGuidelines = useMemo(() => DOMPurify.sanitize(content.guidelinesHtml), [content.guidelinesHtml])

  const resetToFirstPage = () => setCurrentPage(1)

  const handleStatusTabChange = (tab: StatusTab) => {
    setStatusTab(tab)
    resetToFirstPage()
  }

  const handleListaFiltroChange = (filtro: ListaFiltro) => {
    setListaFiltro(filtro)
    resetToFirstPage()
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    resetToFirstPage()
  }

  const handleDateFromChange = (value: string) => {
    setDateFrom(value)
    resetToFirstPage()
  }

  const handleDateToChange = (value: string) => {
    setDateTo(value)
    resetToFirstPage()
  }

  const handlePageSizeChange = (size: PageSizeOption) => {
    setPageSize(size)
    resetToFirstPage()
  }

  const filteredItems = useMemo(() => {
    const searchLower = search.trim().toLowerCase()

    return data.items.filter(item => {
      if (statusTab === "ENVIADOS") {
        if (item.tipo_td !== "ENVIADO") return false
      } else {
        if (item.tipo_td !== "INTERESSE") return false
      }

      if (listaFiltro !== "TODOS" && item.sistema_concorrencia !== listaFiltro) {
        return false
      }

      if (searchLower) {
        const nome = item.nome_candidato?.toLowerCase() ?? ""
        if (!nome.includes(searchLower)) return false
      }

      const dataStr = item.data_aprovacao ? item.data_aprovacao.slice(0, 10) : null
      if (dateFrom && dataStr && dataStr < dateFrom) return false
      if (dateTo && dataStr && dataStr > dateTo) return false

      return true
    })
  }, [data.items, statusTab, listaFiltro, search, dateFrom, dateTo])

  const totalPages = useMemo(() => {
    if (pageSize === "ALL") return 1
    return Math.max(1, Math.ceil(filteredItems.length / pageSize))
  }, [filteredItems.length, pageSize])

  const activePage = useMemo(() => {
    if (pageSize === "ALL") return 1
    return Math.min(Math.max(1, currentPage), totalPages)
  }, [currentPage, pageSize, totalPages])

  const paginatedItems = useMemo(() => {
    if (pageSize === "ALL") {
      return filteredItems
    }

    const start = (activePage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, pageSize, activePage])

  const dateFilterSummary = useMemo(() => {
    if (dateFrom && dateTo) {
      return `${formatDateLabel(dateFrom)} — ${formatDateLabel(dateTo)}`
    }
    if (dateFrom) {
      return `A partir de ${formatDateLabel(dateFrom)}`
    }
    if (dateTo) {
      return `Até ${formatDateLabel(dateTo)}`
    }
    return "Sem filtro aplicado"
  }, [dateFrom, dateTo])

  const handleClearDateFilters = () => {
    handleDateFromChange("")
    handleDateToChange("")
  }

  useEffect(() => {
    console.log("[TdsDashboard] items recebidos", totalItems)
  }, [totalItems])

  return (
    <section className="pb-12">
      <div className="grid gap-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,2.5fr)_minmax(0,1.1fr)] lg:gap-x-4 lg:gap-y-1">
        <MiniInfoCard title="Como funciona o TD?" className="h-full">
          <TdInfoSection html={sanitizedHowItWorks} />
        </MiniInfoCard>
        <MiniInfoCard title="Orientações gerais" className="h-full">
          <TdInfoSection html={sanitizedGuidelines} />
        </MiniInfoCard>
        <MiniInfoCard title="Modelo de TD" className="flex h-full flex-col justify-between text-sm text-slate-700">
          {content.models.length ? (
            <div className="mt-3 space-y-2">
              {content.models.map((model, index) => {
                const safeLabel = formatModelLabelForButton(model.label)
                return (
                  <a
                    key={`td-model-${index}`}
                    href={model.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex w-full items-center justify-between rounded-[16px] border border-rose-100/80 bg-white/85 px-4 py-2 text-[11px] font-semibold text-rose-900/90 shadow-[0_8px_20px_-18px_rgba(190,18,60,0.5)] transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-rose-400">
                        Baixar modelo
                      </span>
                      <span className="truncate text-[12px] font-medium tracking-tight text-rose-950/90" title={safeLabel}>
                        {safeLabel}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-rose-600">
                      Abrir
                      <ExternalLink className="h-3 w-3 text-rose-500 transition group-hover:translate-x-0.5" />
                    </span>
                  </a>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">Nenhum modelo disponível no momento.</p>
          )}
        </MiniInfoCard>
      </div>
      <div className="mt-6 space-y-2 lg:mt-8">
        <div className="flex flex-col gap-3 border border-[#b91c1c] bg-[#b91c1c] px-3 py-3 shadow-sm shadow-rose-300/60 md:gap-4">
          <div className="flex flex-col items-center gap-3 text-white md:flex-row md:justify-center">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex h-14 w-14 flex-col items-center justify-center rounded-full border border-white/30 bg-white text-center text-[#b91c1c]">
                <span className="text-base font-bold tracking-tight">{numberFormatter.format(filteredItems.length)}</span>
                <span className="text-[10px] font-semibold text-[#b91c1c]">TDs</span>
              </Badge>
            </div>
            <h2 className="w-full text-center text-2xl font-semibold text-white">PAINEL DE TDs</h2>
          </div>
          <div className="w-full md:ml-auto md:w-[320px]">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-rose-200" />
              <Input
                placeholder="Buscar por nome"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                className="h-[1.75rem] w-full rounded-full border border-zinc-100 bg-white/85 pl-7 pr-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-600 shadow-sm placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-visible rounded-2xl border border-dashed border-zinc-200 bg-white/80">
          <div className="grid gap-0 border-b border-zinc-100 bg-white lg:grid-cols-[minmax(210px,0.5fr)_minmax(0,1.4fr)_auto]">
            <div className="border-r border-zinc-100 lg:max-w-[250px]">
              <div className="flex h-full flex-col gap-1 px-3 pb-0 pt-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black">Tipo</p>
                <div className="mt-auto flex flex-nowrap items-stretch gap-1 overflow-hidden">
                  <TabFilterButton label="Enviados" active={statusTab === "ENVIADOS"} onClick={() => handleStatusTabChange("ENVIADOS")} className="rounded-t-xl" />
                  <TabFilterButton label="Talvez" active={statusTab === "TALVEZ"} onClick={() => handleStatusTabChange("TALVEZ")} className="rounded-t-xl" />
                </div>
              </div>
            </div>
            <div className="border-r border-zinc-100">
              <div className="flex h-full flex-col gap-1 px-3 pb-0 pt-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black">Concorrência</p>
                <div className="mt-auto flex flex-nowrap items-stretch gap-1 overflow-hidden">
                  <SubFilterChip label="Todos" active={listaFiltro === "TODOS"} onClick={() => handleListaFiltroChange("TODOS")} fullWidth />
                  <SubFilterChip label={listaSistemaStyles.AC.label} variant="AC" active={listaFiltro === "AC"} onClick={() => handleListaFiltroChange("AC")} fullWidth />
                  <SubFilterChip label={listaSistemaStyles.PCD.label} variant="PCD" active={listaFiltro === "PCD"} onClick={() => handleListaFiltroChange("PCD")} fullWidth />
                  <SubFilterChip label={listaSistemaStyles.PPP.label} variant="PPP" active={listaFiltro === "PPP"} onClick={() => handleListaFiltroChange("PPP")} fullWidth />
                  <SubFilterChip label="Indígenas" variant="IND" active={listaFiltro === "IND"} onClick={() => handleListaFiltroChange("IND")} fullWidth />
                </div>
              </div>
            </div>
            <div className="px-3 pb-3 pt-3 lg:w-[540px]">
              <div className="flex h-full flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-black">Filtros</p>
                  <span className="text-[10px] font-medium lowercase tracking-tight text-zinc-400">{dateFilterSummary}</span>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                  <div className="flex w-full flex-col gap-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500 lg:flex-[0.35] lg:min-w-[220px] lg:max-w-[220px]">
                    <Dialog open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-[1.75rem] w-full items-center justify-center gap-2 rounded-full border border-rose-100 bg-rose-50/80 px-3.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-rose-700 shadow-sm whitespace-nowrap transition hover:-translate-y-0.5 hover:bg-white"
                        >
                          <CalendarIcon className="h-3.5 w-3.5 text-rose-400" />
                          Buscar por data
                        </button>
                      </DialogTrigger>
                      <DialogContent className="w-full max-w-md border border-rose-100 bg-white p-6 text-zinc-900 shadow-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-semibold text-rose-900">Filtrar por data</DialogTitle>
                          <DialogDescription className="text-sm text-zinc-500">
                            Defina um intervalo para refinar a lista de TDs.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-5 grid gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:grid-cols-2">
                          <label className="flex flex-col gap-1">
                            <span>Data inicial</span>
                            <Input
                              type="date"
                              value={dateFrom}
                              onChange={event => handleDateFromChange(event.target.value)}
                              className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600 shadow-sm focus-visible:border-rose-300 focus-visible:ring-rose-200"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span>Data final</span>
                            <Input
                              type="date"
                              value={dateTo}
                              onChange={event => handleDateToChange(event.target.value)}
                              className="h-11 rounded-2xl border border-zinc-200 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600 shadow-sm focus-visible:border-rose-300 focus-visible:ring-rose-200"
                            />
                          </label>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={handleClearDateFilters}
                            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500 transition hover:text-rose-600"
                          >
                            Limpar período
                          </button>
                          <DialogClose asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-600/10 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700 shadow-sm"
                            >
                              Concluir
                            </button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 p-0 lg:mt-[-1px]">
            <TdsTable items={paginatedItems} />
          </div>
        </div>
        <PaginationControls
          totalItems={filteredItems.length}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          currentPage={activePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </section>
  )
}

type TabFilterButtonProps = {
  label: string
  active: boolean
  onClick: () => void
  className?: string
}

function TabFilterButton({ label, active, onClick, className }: TabFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-t-xl rounded-b-none border border-zinc-200 border-b-0 px-3 py-1.25 text-[10px] font-semibold uppercase tracking-[0.15em] text-center transition duration-150 ease-out shadow-sm min-w-[88px]",
        active
          ? "border-[#b91c1c] bg-[#b91c1c] text-white shadow-lg -translate-y-[3px] ring-2 ring-rose-100"
          : "bg-white text-zinc-500 translate-y-0",
        className,
      )}
    >
      {label}
    </button>
  )
}

type SubFilterChipProps = {
  label: string
  active: boolean
  onClick: () => void
  variant?: ListaFiltro
  fullWidth?: boolean
}

const subFilterActiveThemes: Record<ListaFiltro, string> = {
  TODOS: "border-zinc-900 bg-zinc-900 text-white",
  AC: listaSistemaStyles.AC.className,
  PCD: listaSistemaStyles.PCD.className,
  PPP: listaSistemaStyles.PPP.className,
  IND: listaSistemaStyles.IND.className,
}

function SubFilterChip({ label, active, onClick, variant = "TODOS", fullWidth = false }: SubFilterChipProps) {
  const variantClass = subFilterActiveThemes[variant]
  const baseColor = subFilterColors[variant]
  const inactiveStyle = active
    ? undefined
    : {
        backgroundColor: hexToRgba(baseColor, 0.08),
        borderColor: hexToRgba(baseColor, 0.25),
        color: baseColor,
      }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-t-xl rounded-b-none border px-3 py-1.25 text-[10px] font-semibold uppercase tracking-[0.15em] text-center transition duration-150 ease-out shadow-sm",
        fullWidth ? "basis-0 grow" : "min-w-[88px]",
        variantClass,
        active ? "-translate-y-[3px] shadow-lg ring-2 ring-white/70" : "bg-white translate-y-0",
      )}
      style={inactiveStyle}
    >
      {label}
    </button>
  )
}

type TableProps = {
  items: TdItem[]
}

function TdsTable({ items }: TableProps) {
  if (!items.length) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
        <Inbox className="h-10 w-10 text-zinc-400" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-700">Nenhum TD encontrado com os filtros atuais.</p>
          <p className="text-sm text-zinc-500">Ajuste os filtros ou altere o período para ver mais registros.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden border-t border-b border-zinc-900/20">
      {items.map((item) => {
        const listaStyle = listaSistemaStyles[item.sistema_concorrencia]
        const tdLink = extractLinkFromText(item.observacao)
        const statusDateText = formatStatusDate(item.tipo_td ?? null, item.data_aprovacao)
        const rowBackground = hexToRgba(listaBaseColors[item.sistema_concorrencia], 0.08)

        return (
          <div
            key={item.td_request_id}
            className="flex w-full flex-col gap-3 border-b border-zinc-900/15 px-4 py-4 text-sm text-zinc-700 last:border-b-0"
            style={{ backgroundColor: rowBackground }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-zinc-900">{item.nome_candidato}</p>
                <p className="text-[11px] text-zinc-500">{buildCandidateMeta(item)}</p>
              </div>
              <span className={cn("inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em]", listaStyle.className)}>
                {listaStyle.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <span className="text-[10px] font-normal normal-case tracking-normal text-zinc-600">
                  {item.observacao ? item.observacao : "Sem observações"}
                </span>
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-medium normal-case tracking-normal text-zinc-500">
                <CalendarIcon className="h-3.5 w-3.5 text-zinc-400" />
                <span>{statusDateText}</span>
              </span>
            </div>

            {tdLink ? (
              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <a
                  href={tdLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-600"
                >
                  Abrir TD
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

type PaginationControlsProps = {
  totalItems: number
  pageSize: PageSizeOption
  pageSizeOptions: readonly PageSizeOption[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeOption) => void
}

function PaginationControls({ totalItems, pageSize, pageSizeOptions, currentPage, totalPages, onPageChange, onPageSizeChange }: PaginationControlsProps) {
  if (!totalItems) return null

  const serialize = (value: PageSizeOption) => (value === "ALL" ? "ALL" : String(value))

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    const parsedSize = value === "ALL" ? "ALL" : Number(value)
    onPageSizeChange(parsedSize as PageSizeOption)
  }

  if (pageSize === "ALL") {
    return (
      <div className="mt-6 border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
            <span>Itens por página</span>
            <select
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 transition focus:border-rose-200 focus:outline-none"
              value={serialize(pageSize)}
              onChange={handlePageSizeChange}
            >
              {pageSizeOptions.map(option => (
                <option key={`td-page-size-${option}`} value={serialize(option)}>
                  {option === "ALL" ? "Todos" : option}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm font-medium text-zinc-500">Mostrando todos os {totalItems} registros</p>
        </div>
      </div>
    )
  }

  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const rangeStart = totalItems ? (safePage - 1) * pageSize + 1 : 0
  const rangeEnd = Math.min(totalItems, safePage * pageSize)

  const goToPrev = () => onPageChange(Math.max(1, safePage - 1))
  const goToNext = () => onPageChange(Math.min(totalPages, safePage + 1))

  const renderPageButtons = () => {
    const buttons = []
    const windowSize = 5
    let start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, start + windowSize - 1)
    start = Math.max(1, end - windowSize + 1)

    for (let page = start; page <= end; page++) {
      const isActive = page === safePage
      buttons.push(
        <button
          key={`tds-page-${page}`}
          type="button"
          onClick={() => onPageChange(page)}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition",
            isActive ? "border-[#b91c1c] bg-[#b91c1c] text-white shadow-sm" : "border-zinc-200 text-zinc-600 hover:border-zinc-400",
          )}
          aria-current={isActive ? "page" : undefined}
        >
          {page}
        </button>,
      )
    }

    return buttons
  }

  return (
    <div className="mt-6 border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex items-center gap-3 text-sm font-medium text-zinc-700">
          <span>Itens por página</span>
          <select
            className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 transition focus:border-rose-200 focus:outline-none"
            value={serialize(pageSize)}
            onChange={handlePageSizeChange}
          >
            {pageSizeOptions.map(option => (
              <option key={`td-page-size-${option}`} value={serialize(option)}>
                {option === "ALL" ? "Todos" : option}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-3 text-sm font-medium text-zinc-600 lg:flex-row lg:items-center lg:gap-4">
          <span>
            Mostrando {rangeStart}&ndash;{rangeEnd} de {totalItems}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToPrev}
              disabled={safePage === 1}
              aria-label="Página anterior"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition enabled:border-zinc-300 enabled:hover:border-zinc-400 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">{renderPageButtons()}</div>
            <button
              type="button"
              onClick={goToNext}
              disabled={safePage === totalPages}
              aria-label="Próxima página"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition enabled:border-zinc-300 enabled:hover:border-zinc-400 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type MiniInfoCardProps = {
  title: string
  children: ReactNode
  className?: string
}

function MiniInfoCard({ title, children, className }: MiniInfoCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[24px] border border-zinc-100 bg-white/95 shadow-sm shadow-zinc-200/60",
        className,
      )}
    >
      <div className="bg-[#C62828] px-5 py-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white">{title}</p>
      </div>
      <div className="flex-1 px-6 pb-4 pt-4 lg:px-7">{children}</div>
    </div>
  )
}

const MAX_MODEL_LABEL_LENGTH = 48

function formatModelLabelForButton(rawLabel?: string | null) {
  const fallback = rawLabel?.trim() || "Termo de desistência"
  if (fallback.length <= MAX_MODEL_LABEL_LENGTH) return fallback
  return `${fallback.slice(0, MAX_MODEL_LABEL_LENGTH - 1).trimEnd()}…`
}

const tdStatusThemes: Record<TdRequestTipo, { label: string; className: string }> = {
  ENVIADO: {
    label: "ENVIADO",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  INTERESSE: {
    label: "TALVEZ",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
}

const friendlyDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })

function formatFriendlyDate(value: string | null): string | null {
  if (!value) return null
  try {
    const formatted = friendlyDateFormatter.format(new Date(value))
    return formatted.replace(/ de /g, " ").replace(/\./g, "")
  } catch {
    return null
  }
}

function formatStatusDate(tipo: TdRequestTipo | null, value: string | null): string {
  const formatted = formatFriendlyDate(value)
  if (!formatted) return "Data não informada"
  return formatted
}

function buildCandidateMeta(item: TdItem): string {
  const ordem = item.ordem_nomeacao_base ? `Ordem de nomeação: ${item.ordem_nomeacao_base}` : null
  const classificacao = item.classificacao_lista ? `Classificação na lista original: ${item.classificacao_lista}` : null
  const parts = [ordem, classificacao].filter(Boolean)
  return parts.length ? parts.join(" · ") : "Sem posição registrada"
}

function extractLinkFromText(text: string | null): string | null {
  if (!text) return null
  const match = text.match(/https?:\/\/\S+/i)
  if (!match) return null
  const raw = match[0]
  try {
    const url = new URL(raw)
    return url.href
  } catch {
    return raw
  }
}

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "")
  const bigint = Number.parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type TdInfoSectionProps = {
  html: string
}

function TdInfoSection({ html }: TdInfoSectionProps) {
  return (
    <div
      className="text-sm leading-relaxed text-slate-700 [&_a]:font-semibold [&_a]:text-rose-700 [&_a]:underline [&_p:not(:last-child)]:mb-2"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
