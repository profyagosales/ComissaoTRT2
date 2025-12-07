'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import DOMPurify from "dompurify"
import { ExternalLink, Search } from "lucide-react"
import type { SistemaConcorrencia } from "@/features/listas/listas-actions"
import { listaSistemaStyles } from "@/features/listas/lista-styles"
import { cn } from "@/lib/utils"
import type { TdsData, TdItem } from "./loadTdsData"
import type { TdRequestTipo } from "./td-types"

type StatusSummaryKey = "ENVIADOS" | "TALVEZ"
type StatusFilter = StatusSummaryKey
type ListaFiltro = SistemaConcorrencia | "TODOS"
type PageSizeOption = 5 | 10 | 20 | 30 | 50 | 100 | "ALL"
type SortDirection = "asc" | "desc"
type SortableColumn = "data" | "ordem"
type SortState = Record<SortableColumn, SortDirection | null>

const PAGE_SIZE_OPTIONS: readonly PageSizeOption[] = [5, 10, 20, 30, 50, 100, "ALL"] as const

// removed variant border helpers — buttons no longer show borders

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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ENVIADOS")
  const [listaFiltro, setListaFiltro] = useState<ListaFiltro>("TODOS")
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState<PageSizeOption>(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortState, setSortState] = useState<SortState>({ data: null, ordem: null })
  const { content } = data
  const totalItems = data.items.length
  const statusSummary = useMemo(() => buildStatusSummary(data.items), [data.items])
  const sanitizedHowItWorks = useMemo(() => {
    const sanitizeFn = (DOMPurify as unknown as { sanitize?: (value: string) => string }).sanitize ??
      (DOMPurify as unknown as { default?: { sanitize?: (value: string) => string } }).default?.sanitize
    if (typeof sanitizeFn === "function") {
      return sanitizeFn(content.howItWorksHtml)
    }
    return content.howItWorksHtml
  }, [content.howItWorksHtml])
  const sanitizedGuidelines = useMemo(() => {
    const sanitizeFn = (DOMPurify as unknown as { sanitize?: (value: string) => string }).sanitize ??
      (DOMPurify as unknown as { default?: { sanitize?: (value: string) => string } }).default?.sanitize
    if (typeof sanitizeFn === "function") {
      return sanitizeFn(content.guidelinesHtml)
    }
    return content.guidelinesHtml
  }, [content.guidelinesHtml])

  const resetToFirstPage = () => setCurrentPage(1)

  const handleStatusFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter)
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

  const handlePageSizeChange = (size: PageSizeOption) => {
    setPageSize(size)
    resetToFirstPage()
  }

  const handleSortSelection = (column: SortableColumn, direction: SortDirection) => {
    setSortState(previous => {
      const nextDirection = previous[column] === direction ? null : direction
      return { ...previous, [column]: nextDirection }
    })
    resetToFirstPage()
  }

  const filteredItems = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    const parseTime = (value: string | null) => (value ? new Date(value).getTime() : 0)
    const parseOrderValue = (value: TdItem["ordem_nomeacao_base"]) => {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY
      }

      if (!value) return Number.POSITIVE_INFINITY

      const cleaned = value.replace(/[^0-9.,-]/g, "").replace(",", ".")
      const numericPortion = cleaned ? Number(cleaned) : Number.NaN
      return Number.isFinite(numericPortion) ? numericPortion : Number.POSITIVE_INFINITY
    }

    const filtered = data.items
      .filter(item => {
        if (statusFilter === "ENVIADOS" && item.tipo_td !== "ENVIADO") {
          return false
        }

        if (statusFilter === "TALVEZ" && item.tipo_td !== "INTERESSE") {
          return false
        }

        if (listaFiltro !== "TODOS" && item.sistema_concorrencia !== listaFiltro) {
          return false
        }

        if (searchLower) {
          const nome = item.nome_candidato?.toLowerCase() ?? ""
          if (!nome.includes(searchLower)) return false
        }

        return true
      })
    const hasCustomSort = Boolean(sortState.data || sortState.ordem)

    return filtered.sort((a, b) => {
      if (sortState.data) {
        const difference = parseTime(a.data_aprovacao ?? null) - parseTime(b.data_aprovacao ?? null)
        if (difference !== 0) {
          return sortState.data === "asc" ? difference : -difference
        }
      }

      if (sortState.ordem) {
        const difference = parseOrderValue(a.ordem_nomeacao_base) - parseOrderValue(b.ordem_nomeacao_base)
        if (difference !== 0) {
          return sortState.ordem === "asc" ? difference : -difference
        }
      }

      if (!hasCustomSort) {
        return parseTime(b.data_aprovacao ?? null) - parseTime(a.data_aprovacao ?? null)
      }

      return 0
    })
  }, [data.items, statusFilter, listaFiltro, search, sortState])

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

  useEffect(() => {
    console.log("[TdsDashboard] items recebidos", totalItems)
  }, [totalItems])

  return (
    <section className="pb-12">
      <div className="grid gap-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.1fr)_minmax(0,1.55fr)_minmax(0,0.75fr)] lg:gap-x-2 lg:gap-y-1">
        <TdStatusCharts summary={statusSummary} />
        <MiniInfoCard title="O QUE É O TD?" className="h-full border-0">
          <TdInfoSection html={sanitizedHowItWorks} />
        </MiniInfoCard>
        <MiniInfoCard title="ORIENTAÇÕES GERAIS" className="h-full border-0">
          <TdInfoSection html={sanitizedGuidelines} />
        </MiniInfoCard>
        <MiniInfoCard
          title="MODELO DO TD"
          className="flex h-full flex-col justify-between border-0"
        >
          {content.models.length ? (
            <div className="mt-2 space-y-4">
              {content.models.map((model, index) => {
                const buttonLabel = formatModelLabelForButton(model.label)
                const sanitizedLabelHtml = sanitizeModelLabel(model.label)
                return (
                  <div key={`td-model-${index}`} className="space-y-3 text-[#1f1f1f]">
                    <div
                      className="text-center text-[11px] font-normal leading-relaxed tracking-tight [&_*]:text-[#1f1f1f] [&_a]:font-semibold [&_a]:text-[#13407a] [&_a]:underline [&_p:not(:last-child)]:mb-1.5"
                      dangerouslySetInnerHTML={{ __html: sanitizedLabelHtml }}
                    />
                    <div className="flex justify-center">
                      <a
                        href={model.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`Abrir ${buttonLabel}`}
                        title={buttonLabel}
                        className="inline-flex items-center gap-1 rounded-full bg-[#FFCD00] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition hover:translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFCD00]"
                      >
                        Abrir
                        <ExternalLink className="h-3 w-3 text-white" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 text-xs text-[#1f1f1f]/70">Nenhum modelo disponível no momento.</p>
          )}
        </MiniInfoCard>
      </div>
      <div className="mt-6 space-y-0">
        <TdsHeaderFilters
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          listaFiltro={listaFiltro}
          onListaFiltroChange={handleListaFiltroChange}
          search={search}
          onSearchChange={handleSearchChange}
        />

        <TdsTableCard
          items={paginatedItems}
          sortState={sortState}
          onSortChange={handleSortSelection}
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

type TdsHeaderFiltersProps = {
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  listaFiltro: ListaFiltro
  onListaFiltroChange: (filtro: ListaFiltro) => void
  search: string
  onSearchChange: (value: string) => void
}

const TD_MAIN_FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "ENVIADOS", label: "Enviados" },
  { value: "TALVEZ", label: "Talvez" },
] as const

const TD_QUOTA_FILTERS: ReadonlyArray<{ value: ListaFiltro; label: string }> = [
  { value: "TODOS", label: "Todos" },
  { value: "AC", label: "Ampla" },
  { value: "PCD", label: "PCD" },
  { value: "PPP", label: "PPP" },
  { value: "IND", label: "Indígenas" },
] as const

function TdsHeaderFilters({ statusFilter, onStatusFilterChange, listaFiltro, onListaFiltroChange, search, onSearchChange }: TdsHeaderFiltersProps) {
  return (
    <div className="rounded-t-[18px] rounded-b-none border border-[#bdbbbb] bg-[#bdbbbb] px-4 pt-4 pb-0 shadow-inner shadow-black/10">
      <div className="grid items-start gap-y-3 text-[#1f1f1f] md:grid-cols-[minmax(0,1fr)_minmax(220px,1fr)] md:grid-rows-[auto_auto] font-['Aller']">
        <h2 className="order-1 text-left text-3xl font-heading font-semibold tracking-[0.05em] text-[#004C3F] md:col-start-1">
          Painel de TDs
        </h2>
        <div className="order-2 w-full md:col-start-2 md:self-start md:ml-auto md:w-auto">
          <label className="sr-only" htmlFor="tds-search">
            Buscar por nome
          </label>
          <div className="flex h-6 w-full items-center gap-1 rounded-full border border-[#004C3F] bg-white/80 px-2 shadow-sm md:w-[170px]">
            <Search className="h-[11px] w-[11px] text-[#004C3F]" strokeWidth={1.25} aria-hidden="true" />
            <input
              id="tds-search"
              placeholder="Buscar por nome"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full border-none bg-transparent text-[11px] font-['Aller'] font-medium tracking-tight text-[#1f1f1f] placeholder:text-[#7a7a7a] focus:outline-none"
            />
          </div>
        </div>
        <div className="order-3 -mx-4 flex w-[calc(100%+2rem)] flex-wrap items-end justify-center gap-2 pb-0 md:col-span-2 md:col-start-1 md:row-start-2 md:items-end md:justify-center md:pb-0">
          <div className="flex flex-nowrap items-end gap-1">
            {TD_MAIN_FILTERS.map(option => (
              <TdsMainFilterButton
                key={`tds-main-filter-${option.value}`}
                label={option.label}
                active={statusFilter === option.value}
                onClick={() => onStatusFilterChange(option.value)}
              />
            ))}
          </div>
          <span className="hidden h-6 w-px bg-[#cccccc] md:inline-flex" aria-hidden="true" />
          <div className="flex flex-wrap items-end justify-center gap-1.5">
            {TD_QUOTA_FILTERS.map(option => (
              <TdsQuotaFilterChip
                key={`tds-quota-filter-${option.value}`}
                label={option.label}
                active={listaFiltro === option.value}
                onClick={() => onListaFiltroChange(option.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type TdsMainFilterButtonProps = {
  label: string
  active: boolean
  onClick: () => void
}

function TdsMainFilterButton({ label, active, onClick }: TdsMainFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-t-full rounded-b-none px-4 text-[11px] font-['Aller'] font-semibold tracking-[0.06em] text-center transition duration-150 ease-out min-w-[120px]",
        active ? "bg-[#007B5F] text-white py-1.5 -translate-y-[3px]" : "bg-[#00B388] text-white py-1.5 translate-y-0",
      )}
    >
      {label}
    </button>
  )
}

type TdsQuotaFilterChipProps = {
  label: string
  active: boolean
  onClick: () => void
}

function TdsQuotaFilterChip({ label, active, onClick }: TdsQuotaFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-t-xl rounded-b-none px-3 text-[10px] font-['Aller'] font-semibold tracking-[0.06em] text-center transition duration-150 ease-out min-w-[95px]",
        active ? "bg-[#007B5F] text-white py-1.5 -translate-y-[3px]" : "bg-[#00B388] text-white py-1.5 translate-y-0",
      )}
    >
      {label}
    </button>
  )
}

type TdsTableProps = {
  items: TdItem[]
  sortState: SortState
  onSortChange: (column: SortableColumn, direction: SortDirection) => void
}
type TableHeaderDescriptor = {
  key: string
  align: "left" | "center"
  sortKey?: SortableColumn
}

const TABLE_HEADER_LABELS: readonly TableHeaderDescriptor[] = [
  { key: "DATA", align: "center", sortKey: "data" },
  { key: "LISTA", align: "center" },
  { key: "ORDEM", align: "center", sortKey: "ordem" },
  { key: "NOME", align: "left" },
  { key: "OBSERVAÇÕES DO TD", align: "left" },
] as const

function TdsTable({ items, sortState, onSortChange }: TdsTableProps) {
  return (
    <table className="min-w-full table-fixed border-collapse border border-[#e8e8e8] font-['Aller'] text-sm text-[#1f1f1f]">
      <colgroup>
        <col className="w-[120px]" />
        <col className="w-[120px]" />
        <col className="w-[120px]" />
        <col className="w-[260px]" />
        <col />
      </colgroup>
      <thead style={{ backgroundColor: "#f3f1f1" }}>
        <tr>
          {TABLE_HEADER_LABELS.map(({ key, align, sortKey }) => (
            <th
              key={key}
              scope="col"
              className={cn(
                "border-b border-[#e8e8e8] px-3 py-2",
                align === "center" ? "text-center" : "text-left",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2",
                  align === "center" ? "justify-center" : "justify-start",
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#004C3F]">{key}</span>
                {sortKey ? (
                  <ColumnSortControls
                    alignment={align}
                    activeDirection={sortState[sortKey]}
                    onSelect={direction => onSortChange(sortKey, direction)}
                  />
                ) : null}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map(item => {
          const listaStyle = listaSistemaStyles[item.sistema_concorrencia]
          const tdLink = extractLinkFromText(item.observacao)
          const statusDateText = formatStatusDate(item.tipo_td ?? null, item.data_aprovacao)
          const observationText = item.observacao?.trim() || "Sem observações registradas"

          return (
            <tr key={item.td_request_id} className="text-[13px]">
              <td className="border-b border-[#f0f0f0] px-3 py-2 text-center text-[#1f1f1f]">{statusDateText}</td>
              <td className="border-b border-[#f0f0f0] px-3 py-2 text-center">
                <span
                  className={cn(
                    "inline-flex min-w-[86px] items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-white",
                    listaStyle.className,
                  )}
                >
                  {listaStyle.label}
                </span>
              </td>
              <td className="border-b border-[#f0f0f0] px-3 py-2 text-center text-[#1f1f1f]">
                {item.ordem_nomeacao_base ?? "—"}
              </td>
              <td className="border-b border-[#f0f0f0] px-3 py-2 text-left text-[#1f1f1f]">
                {item.nome_candidato}
              </td>
              <td className="border-b border-[#f0f0f0] px-3 py-2 text-left text-[#4A4F55]">
                <p className="line-clamp-2 text-[12px] leading-tight">{observationText}</p>
                {tdLink ? (
                  <a
                    href={tdLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#004C3F] underline"
                  >
                    Abrir TD
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

type TdsTableCardProps = {
  items: TdItem[]
  sortState: SortState
  onSortChange: (column: SortableColumn, direction: SortDirection) => void
  totalItems: number
  pageSize: PageSizeOption
  pageSizeOptions: readonly PageSizeOption[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeOption) => void
}

function TdsTableCard({
  items,
  sortState,
  onSortChange,
  totalItems,
  pageSize,
  pageSizeOptions,
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TdsTableCardProps) {
  return (
    <div className="flex h-full flex-col rounded-b-[18px] rounded-t-none border border-[#d9d9d9] bg-white shadow-sm shadow-black/5">
      <div className="flex-1 overflow-x-auto">
        {items.length ? (
          <TdsTable items={items} sortState={sortState} onSortChange={onSortChange} />
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center font-['Aller']">
            <p className="text-base font-semibold text-[#4A4F55]">Nenhum TD encontrado com os filtros atuais.</p>
            <p className="text-sm text-[#7a7a7a]">Ajuste os filtros ou refine a busca para ver mais registros.</p>
          </div>
        )}
      </div>
      <div className="border-t border-[#eeeeee] px-4 py-3">
        <TdsPaginationControls
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  )
}

type TdsPaginationControlsProps = {
  totalItems: number
  pageSize: PageSizeOption
  pageSizeOptions: readonly PageSizeOption[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeOption) => void
}

function TdsPaginationControls({
  totalItems,
  pageSize,
  pageSizeOptions,
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TdsPaginationControlsProps) {
  const serialize = (value: PageSizeOption) => (value === "ALL" ? "ALL" : String(value))
  const parseValue = (value: string): PageSizeOption => (value === "ALL" ? "ALL" : Number(value) as PageSizeOption)

  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages))

  let rangeStart = 0
  let rangeEnd = 0
  if (totalItems === 0) {
    rangeStart = 0
    rangeEnd = 0
  } else if (pageSize === "ALL") {
    rangeStart = 1
    rangeEnd = totalItems
  } else {
    rangeStart = (safeCurrentPage - 1) * pageSize + 1
    rangeEnd = Math.min(totalItems, safeCurrentPage * pageSize)
  }

  const goToPrev = () => onPageChange(Math.max(1, safeCurrentPage - 1))
  const goToNext = () => onPageChange(Math.min(totalPages, safeCurrentPage + 1))

  const showPaginationControls = pageSize !== "ALL" && totalPages > 1 && totalItems > 0

  return (
    <div className="flex flex-col gap-3 text-sm text-[#4A4F55] md:flex-row md:items-center md:justify-between">
      <div className="text-xs text-[#4A4F55]">
        Mostrando {rangeStart}–{rangeEnd} de {totalItems} TD{totalItems === 1 ? "" : "s"}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-[#7a7a7a]">
          <span>Por página:</span>
          <select
            value={serialize(pageSize)}
            onChange={(event) => onPageSizeChange(parseValue(event.target.value))}
            className="rounded-full border border-[#d9d9d9] px-3 py-1 text-xs text-[#1f1f1f]"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={serialize(size)}>
                {size === "ALL" ? "Todos" : size}
              </option>
            ))}
          </select>
        </div>
        {showPaginationControls ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPrev}
              disabled={safeCurrentPage === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#cfcfcf] text-sm text-[#1f1f1f] disabled:opacity-40"
              aria-label="Página anterior"
            >
              ‹
            </button>
            <div className="text-xs font-semibold text-[#1f1f1f]">
              {safeCurrentPage}/{totalPages}
            </div>
            <button
              type="button"
              onClick={goToNext}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#cfcfcf] text-sm text-[#1f1f1f] disabled:opacity-40"
              aria-label="Próxima página"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

type ColumnSortControlsProps = {
  activeDirection: SortDirection | null
  onSelect: (direction: SortDirection) => void
  alignment: "left" | "center"
}

function ColumnSortControls({ activeDirection, onSelect, alignment }: ColumnSortControlsProps) {
  const options: { direction: SortDirection; label: string }[] = [
    { direction: "asc", label: "Crescente" },
    { direction: "desc", label: "Decrescente" },
  ]

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const handleSelect = (direction: SortDirection) => {
    onSelect(direction)
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex",
        alignment === "center" ? "justify-center" : "justify-start",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          "inline-flex items-center justify-center p-0 text-[12px] leading-none text-[#007B5F] transition",
          activeDirection ? "opacity-90" : "opacity-60 hover:opacity-90",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={activeDirection ? `Ordenado ${activeDirection === "asc" ? "crescente" : "decrescente"}` : "Ordenar coluna"}
      >
        <span aria-hidden="true">🔽</span>
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-10 mt-1 min-w-[140px] rounded-md border border-[#007B5F]/30 bg-white p-1 text-[11px] font-semibold text-[#007B5F] shadow-lg",
            alignment === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
          )}
        >
          {options.map(({ direction, label }) => {
            const isActive = activeDirection === direction
            return (
              <button
                key={`${direction}-${label}`}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => handleSelect(direction)}
                className={cn(
                  "flex w-full items-center justify-between rounded px-2 py-1 text-left transition",
                  isActive ? "bg-[#007B5F] text-white" : "hover:bg-[#007B5F]/10",
                )}
              >
                <span>{label}</span>
                {isActive ? <span className="text-xs">•</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

type MiniInfoCardProps = {
  title: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

function MiniInfoCard({ title, children, className, contentClassName }: MiniInfoCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden shadow-sm shadow-zinc-300/40 backdrop-blur-sm",
        className,
      )}
    >
      <div className="bg-[#0067A0] px-4 py-1.5 text-center">
        <p className="font-['Bebas_Neue'] text-[13px] font-normal tracking-[0.05em] text-white">{title}</p>
      </div>
      <div className={cn("flex-1 px-2 pb-3 pt-2 font-['Aller'] lg:px-3", contentClassName ?? "bg-white text-[#1f1f1f]")}>{children}</div>
    </div>
  )
}

const LISTA_ORDER: SistemaConcorrencia[] = ["AC", "PCD", "PPP", "IND"]
type HighlightKey = SistemaConcorrencia | "TOTAL"
const DISPLAY_SEQUENCE: HighlightKey[] = ["TOTAL", ...LISTA_ORDER]
const LISTA_COLORS: Record<SistemaConcorrencia, string> = {
  AC: "#0a408c",
  PCD: "#510a8c",
  PPP: "#8c420a",
  IND: "#353638",
}

type StatusSummary = Record<StatusSummaryKey, { total: number; segments: Array<{ key: SistemaConcorrencia; value: number; color: string }> }>

function buildStatusSummary(items: TdItem[]): StatusSummary {
  const initCounts = () => LISTA_ORDER.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<SistemaConcorrencia, number>)
  const counts = {
    ENVIADOS: initCounts(),
    TALVEZ: initCounts(),
  }
  const totals = { ENVIADOS: 0, TALVEZ: 0 }

  for (const item of items) {
    if (!item.sistema_concorrencia) continue
    if (item.tipo_td === "ENVIADO") {
      totals.ENVIADOS += 1
      counts.ENVIADOS[item.sistema_concorrencia] += 1
    } else if (item.tipo_td === "INTERESSE") {
      totals.TALVEZ += 1
      counts.TALVEZ[item.sistema_concorrencia] += 1
    }
  }

  const toSummary = (status: StatusSummaryKey) => ({
    total: totals[status],
    segments: LISTA_ORDER.map(key => ({
      key,
      value: counts[status][key],
      color: LISTA_COLORS[key],
    })),
  })

  return {
    ENVIADOS: toSummary("ENVIADOS"),
    TALVEZ: toSummary("TALVEZ"),
  }
}

type TdStatusChartsProps = {
  summary: StatusSummary
}

function TdStatusCharts({ summary }: TdStatusChartsProps) {
  const [cycleIndex, setCycleIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCycleIndex(previous => (previous + 1) % DISPLAY_SEQUENCE.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const highlight = DISPLAY_SEQUENCE[cycleIndex]

  return (
    <div className="flex h-full flex-col gap-1.5 rounded-none bg-[#0067A0] px-2.5 py-1.5 text-white lg:px-3">
      <div className="grid gap-1.5 sm:grid-cols-2">
        <StatusDonut title="Enviados" data={summary.ENVIADOS} highlightKey={highlight} />
        <StatusDonut title="Talvez" data={summary.TALVEZ} highlightKey={highlight} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-['Aller'] text-white/80">
        {LISTA_ORDER.map(key => (
          <span key={`legend-${key}`} className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LISTA_COLORS[key] }} />
            {listaSistemaStyles[key].label}
          </span>
        ))}
      </div>
    </div>
  )
}

type StatusDonutProps = {
  title: string
  data: { total: number; segments: Array<{ key: SistemaConcorrencia; value: number; color: string }> }
  highlightKey: HighlightKey
}

function StatusDonut({ title, data, highlightKey }: StatusDonutProps) {
  const [activeSegment, setActiveSegment] = useState<SistemaConcorrencia | null>(null)
  const total = data.total
  const activeData = activeSegment ? data.segments.find(segment => segment.key === activeSegment) : null
  const autoSegment = highlightKey === "TOTAL" ? null : highlightKey
  const highlightSegment = activeSegment ?? autoSegment
  const displayedValue = activeData?.value ?? (highlightSegment ? data.segments.find(segment => segment.key === highlightSegment)?.value ?? 0 : total)
  const displayedLabel = activeSegment
    ? listaSistemaStyles[activeSegment].label
    : highlightKey === "TOTAL"
      ? "Total"
      : listaSistemaStyles[highlightKey].label

  const radius = 38
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  const resetSegment = () => setActiveSegment(null)

  return (
    <div className="flex flex-col items-center gap-[2px] text-center">
      <p className="w-full font-['Bebas_Neue'] text-[13px] font-normal tracking-[0.05em] text-white">{title.toUpperCase()}</p>
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-full w-full" onMouseLeave={resetSegment}>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="12"
          />
          {data.segments.map(segment => {
            if (!segment.value || !total) return null
            const segmentLength = (segment.value / total) * circumference
            const dashArray = `${segmentLength} ${circumference - segmentLength}`
            const isHighlighted = highlightSegment === segment.key
            const strokeWidth = isHighlighted ? 14 : 12
            const opacity = isHighlighted ? 1 : 0.7
            const element = (
              <circle
                key={`segment-${title}-${segment.key}`}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={-cumulative}
                strokeLinecap="round"
                className="cursor-pointer transition-[stroke-dashoffset,stroke-width,opacity] duration-500 ease-out"
                style={{ transformOrigin: "60px 60px", transform: "rotate(-90deg)", opacity }}
                onMouseEnter={() => setActiveSegment(segment.key)}
                onClick={() => setActiveSegment(prev => (prev === segment.key ? null : segment.key))}
              />
            )
            cumulative += segmentLength
            return element
          })}
        </svg>
        <div className="pointer-events-none absolute flex flex-col items-center text-center font-['Aller']">
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/80">{displayedLabel}</span>
          <span className="text-xl font-semibold text-white">{displayedValue}</span>
          <span className="text-[10px] font-normal text-white/70">TDs</span>
        </div>
      </div>
      {!total && <span className="text-xs text-white/70">Sem dados suficientes</span>}
    </div>
  )
}

const MAX_MODEL_LABEL_LENGTH = 48

function sanitizeModelLabel(rawLabel?: string | null) {
  const fallback = rawLabel?.trim() || "Termo de desistência"
  const sanitizeFn = (DOMPurify as unknown as { sanitize?: (value: string) => string }).sanitize ??
    (DOMPurify as unknown as { default?: { sanitize?: (value: string) => string } }).default?.sanitize
  if (typeof sanitizeFn === "function") {
    return sanitizeFn(fallback)
  }
  return fallback
}

function formatModelLabelForButton(rawLabel?: string | null) {
  const fallback = rawLabel?.trim() || "Termo de desistência"
  if (fallback.length <= MAX_MODEL_LABEL_LENGTH) return fallback
  return `${fallback.slice(0, MAX_MODEL_LABEL_LENGTH - 1).trimEnd()}…`
}

function formatHeaderLabel(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
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
