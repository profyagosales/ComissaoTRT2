'use client'

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  VACANCIA_CLASS_CHIP_CLASSES,
  VACANCIA_CLASSE_LABEL,
  VACANCIA_CLASSES_BY_TIPO,
  VACANCIA_TIPO_CHIP_CLASSES,
  VACANCIA_TIPO_FILTER_LABEL,
  VACANCIA_TIPO_LABEL,
  type VacanciaClasse,
  type VacanciaRow,
  type VacanciaTipo,
  type VacanciasData,
} from "./vacancia-types"

type ClasseFilter = "TODAS" | VacanciaClasse
type PageSizeOption = 8 | 15 | 30 | 50 | "TODOS"
type DateRange = { from: string; to: string }

type VacanciasDashboardProps = {
  data: VacanciasData
}

const PAGE_SIZE_OPTIONS: readonly PageSizeOption[] = [8, 15, 30, 50, "TODOS"] as const

const friendlyDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export function VacanciasDashboard({ data }: VacanciasDashboardProps) {
  const [tipo, setTipo] = useState<VacanciaTipo>("ONEROSA")
  const [classeFilter, setClasseFilter] = useState<ClasseFilter>("TODAS")
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" })
  const [pageSize, setPageSize] = useState<PageSizeOption>(15)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setClasseFilter("TODAS")
    setCurrentPage(1)
  }, [tipo])

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const fromTs = dateRange.from ? Date.parse(dateRange.from) : null
    const toTs = dateRange.to ? Date.parse(dateRange.to) + 86_399_000 : null

    return data.rows
      .filter((row) => row.tipo === tipo)
      .filter((row) => (classeFilter === "TODAS" ? true : row.classe === classeFilter))
      .filter((row) => {
        if (!normalizedSearch) return true
        const target = row.servidor?.toLowerCase() ?? ""
        return target.includes(normalizedSearch)
      })
      .filter((row) => {
        if (!fromTs && !toTs) return true
        const rowTs = row.data ? Date.parse(row.data) : null
        if (fromTs && (!rowTs || rowTs < fromTs)) return false
        if (toTs && (!rowTs || rowTs > toTs)) return false
        return true
      })
      .sort((a, b) => {
        const aTs = a.data ? Date.parse(a.data) : 0
        const bTs = b.data ? Date.parse(b.data) : 0
        return bTs - aTs
      })
  }, [data.rows, tipo, classeFilter, search, dateRange])

  const totalPages = useMemo(() => {
    if (pageSize === "TODOS") return 1
    return Math.max(1, Math.ceil(filteredRows.length / pageSize))
  }, [filteredRows.length, pageSize])

  const safePage = pageSize === "TODOS" ? 1 : Math.min(currentPage, totalPages)

  const paginatedRows = useMemo(() => {
    if (pageSize === "TODOS") return filteredRows
    const start = (safePage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, pageSize, safePage])

  const pageStart = pageSize === "TODOS" ? 1 : (safePage - 1) * pageSize + 1
  const pageEnd = pageSize === "TODOS" ? filteredRows.length : Math.min(filteredRows.length, safePage * pageSize)

  const handlePageSizeChange = (size: PageSizeOption) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleDateRangeChange = (key: keyof DateRange, value: string) => {
    setDateRange((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const headerChipLabel = `${filteredRows.length} vacância${filteredRows.length === 1 ? "" : "s"}`

  return (
    <section className="pb-12">
      <VacanciasHeaderFilters
        tipo={tipo}
        onTipoChange={setTipo}
        classeFiltro={classeFilter}
        onClasseFiltroChange={(next) => {
          setClasseFilter(next)
          setCurrentPage(1)
        }}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setCurrentPage(1)
        }}
        dateRange={dateRange}
        onDateChange={handleDateRangeChange}
        chipLabel={headerChipLabel}
      />

      <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)]">
        <VacanciasSummaryCard rows={filteredRows} tipo={tipo} />
        <VacanciasTableCard
          rows={paginatedRows}
          totalItems={filteredRows.length}
          pageStart={pageStart}
          pageEnd={pageEnd}
          pageSize={pageSize}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </section>
  )
}

type HeaderFiltersProps = {
  tipo: VacanciaTipo
  onTipoChange: (tipo: VacanciaTipo) => void
  classeFiltro: ClasseFilter
  onClasseFiltroChange: (classe: ClasseFilter) => void
  search: string
  onSearchChange: (value: string) => void
  dateRange: DateRange
  onDateChange: (key: keyof DateRange, value: string) => void
  chipLabel: string
}

function VacanciasHeaderFilters({
  tipo,
  onTipoChange,
  classeFiltro,
  onClasseFiltroChange,
  search,
  onSearchChange,
  dateRange,
  onDateChange,
  chipLabel,
}: HeaderFiltersProps) {
  const classeOptions = VACANCIA_CLASSES_BY_TIPO[tipo]

  return (
    <div className="border border-[#bdbbbb] bg-[#bdbbbb] px-4 pt-4 pb-3 shadow-inner shadow-black/10">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
          <h2 className="text-left text-3xl font-['Bebas_Neue'] font-normal tracking-[0.05em] text-[#004C3F]">
            Painel de Vacâncias
          </h2>
          <div className="flex items-center justify-center gap-2">
            <TipoToggleButton label="Onerosas" active={tipo === "ONEROSA"} onClick={() => onTipoChange("ONEROSA")} />
            <TipoToggleButton
              label="Não Onerosas"
              active={tipo === "NAO_ONEROSA"}
              onClick={() => onTipoChange("NAO_ONEROSA")}
            />
          </div>
          <div className="flex items-center justify-end">
            <span className="rounded-full border border-white/50 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#4A4F55]">
              {chipLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <ClasseChip
              label="Todas"
              active={classeFiltro === "TODAS"}
              onClick={() => onClasseFiltroChange("TODAS")}
            />
            {classeOptions.map((classe) => (
              <ClasseChip
                key={classe}
                label={VACANCIA_CLASSE_LABEL[classe]}
                active={classeFiltro === classe}
                toneClass={VACANCIA_CLASS_CHIP_CLASSES[classe]}
                onClick={() => onClasseFiltroChange(classe)}
              />
            ))}
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-end">
            <div className="relative w-full md:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#004C3F]" />
              <Input
                placeholder="Buscar por nome do servidor..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="h-[1.9rem] w-full rounded-full border border-[#c8c8c8] bg-white pl-8 pr-3 text-[11px] font-['Aller'] uppercase tracking-[0.18em] text-[#1f1f1f] focus-visible:border-[#00B388] focus-visible:ring-[#00B388]/30"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-col">
                <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#4A4F55]">Data de</label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(event) => onDateChange("from", event.target.value)}
                  className="h-[1.9rem] rounded-full border border-[#c8c8c8] bg-white px-3 text-[11px] font-['Aller'] uppercase tracking-[0.15em] text-[#1f1f1f]"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#4A4F55]">até</label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(event) => onDateChange("to", event.target.value)}
                  className="h-[1.9rem] rounded-full border border-[#c8c8c8] bg-white px-3 text-[11px] font-['Aller'] uppercase tracking-[0.15em] text-[#1f1f1f]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type TipoToggleButtonProps = {
  label: string
  active: boolean
  onClick: () => void
}

function TipoToggleButton({ label, active, onClick }: TipoToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1 text-[11px] font-['Aller'] uppercase tracking-[0.25em] transition",
        active ? "bg-[#004C3F] text-white" : "bg-white/60 text-[#004C3F] hover:bg-white/80",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}

type ClasseChipProps = {
  label: string
  active: boolean
  onClick: () => void
  toneClass?: string
}

function ClasseChip({ label, active, onClick, toneClass }: ClasseChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-0.5 text-[10px] font-['Aller'] font-semibold uppercase tracking-[0.2em] shadow-sm transition",
        active ? toneClass ?? "bg-[#004C3F] text-white" : "bg-white/50 text-[#4A4F55]",
      )}
    >
      {label}
    </button>
  )
}

type SummaryCardProps = {
  rows: VacanciaRow[]
  tipo: VacanciaTipo
}

function VacanciasSummaryCard({ rows, tipo }: SummaryCardProps) {
  const classes = VACANCIA_CLASSES_BY_TIPO[tipo]
  const counts = classes.map((classe) => ({
    classe,
    label: VACANCIA_CLASSE_LABEL[classe],
    value: rows.filter((row) => row.classe === classe).length,
  }))
  const total = rows.length

  return (
    <div className="h-full rounded-[18px] border border-[#d9d9d9] bg-white px-4 py-4 shadow-sm shadow-black/5">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#4A4F55]">Resumo</p>
          <p className="text-2xl font-['Bebas_Neue'] tracking-[0.05em] text-[#004C3F]">{VACANCIA_TIPO_FILTER_LABEL[tipo]}</p>
          <p className="text-sm text-[#4A4F55]">{total ? `Total: ${total} ${VACANCIA_TIPO_LABEL[tipo].toLowerCase()}${total === 1 ? "" : "s"}.` : "Nenhuma vacância encontrada."}</p>
        </div>

        {total === 0 ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9d9d9] bg-slate-50 text-center text-sm text-slate-500">
            Nenhuma vacância encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="space-y-2">
            {counts.map(({ classe, label, value }) => (
              <div key={classe} className="flex items-center justify-between rounded-xl bg-[#f8f8f8] px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1f1f1f]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chipColorFromClass(classe) }} />
                  {label}
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#4A4F55]">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function chipColorFromClass(classe: VacanciaClasse) {
  const classes = VACANCIA_CLASS_CHIP_CLASSES[classe]
  const match = classes.match(/#([0-9a-fA-F]{6})/)
  return match ? `#${match[1]}` : "#004C3F"
}

type TableCardProps = {
  rows: VacanciaRow[]
  totalItems: number
  pageStart: number
  pageEnd: number
  pageSize: PageSizeOption
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeOption) => void
}

function VacanciasTableCard({
  rows,
  totalItems,
  pageStart,
  pageEnd,
  pageSize,
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TableCardProps) {
  return (
    <div className="flex h-full flex-col rounded-[18px] border border-[#d9d9d9] bg-white shadow-sm shadow-black/5">
      <div className="flex-1 overflow-x-auto">
        {rows.length ? (
          <table className="min-w-full table-fixed border-collapse border border-[#e8e8e8] font-['Aller'] text-sm text-[#1f1f1f]">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[110px]" />
              <col className="w-[160px]" />
              <col />
              <col className="w-[120px]" />
              <col className="w-[220px]" />
            </colgroup>
            <thead className="bg-[#f5f5f5] text-[11px] uppercase tracking-[0.2em] text-[#4A4F55]">
              <tr>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-left">Data</th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-left">Tipo</th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-left">Classe</th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-left">Servidor</th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-left">DOU</th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-left">Observações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="text-[13px]">
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-left text-[#1f1f1f]">{formatDate(row.data)}</td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]", VACANCIA_TIPO_CHIP_CLASSES[row.tipo])}>
                      {VACANCIA_TIPO_LABEL[row.tipo]}
                    </span>
                  </td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2">
                    {row.classe ? (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]",
                        VACANCIA_CLASS_CHIP_CLASSES[row.classe],
                      )}>
                        {VACANCIA_CLASSE_LABEL[row.classe]}
                      </span>
                    ) : (
                      <span className="text-xs text-[#9d9d9d]">—</span>
                    )}
                  </td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-[#1f1f1f]">{row.servidor ?? "—"}</td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-[#1f1f1f]">
                    {row.douLink ? (
                      <a
                        href={row.douLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#004C3F] underline"
                      >
                        Publicação
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-[#9d9d9d]">—</span>
                    )}
                  </td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-[#4A4F55]">
                    {row.observacao ? (
                      <p className="line-clamp-2 text-[12px] leading-tight">{row.observacao}</p>
                    ) : (
                      <span className="text-xs text-[#9d9d9d]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center font-['Aller']">
            <p className="text-base font-semibold text-[#4A4F55]">Nenhuma vacância encontrada com os filtros atuais.</p>
            <p className="text-sm text-[#7a7a7a]">Ajuste os filtros ou revise o período selecionado.</p>
          </div>
        )}
      </div>
      <div className="border-t border-[#eeeeee] px-4 py-3">
        <PaginationControls
          totalItems={totalItems}
          pageStart={pageStart}
          pageEnd={pageEnd}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  )
}

type PaginationControlsProps = {
  totalItems: number
  pageStart: number
  pageEnd: number
  pageSize: PageSizeOption
  pageSizeOptions: readonly PageSizeOption[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeOption) => void
}

function PaginationControls({
  totalItems,
  pageStart,
  pageEnd,
  pageSize,
  pageSizeOptions,
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const goToPrev = () => onPageChange(Math.max(1, currentPage - 1))
  const goToNext = () => onPageChange(Math.min(totalPages, currentPage + 1))

  return (
    <div className="flex flex-col gap-3 text-sm text-[#4A4F55] md:flex-row md:items-center md:justify-between">
      <div className="text-xs uppercase tracking-[0.25em] text-[#7a7a7a]">
        Mostrando {totalItems === 0 ? 0 : pageStart}–{pageEnd} de {totalItems} vacância{totalItems === 1 ? "" : "s"}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-[#7a7a7a]">
          <span>Por página:</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value === "TODOS" ? "TODOS" : Number(event.target.value) as PageSizeOption)}
            className="rounded-full border border-[#d9d9d9] px-3 py-1 text-xs text-[#1f1f1f]"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size === "TODOS" ? "Todos" : size}
              </option>
            ))}
          </select>
        </div>
        {pageSize !== "TODOS" && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentPage === 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#cfcfcf] text-sm text-[#1f1f1f] disabled:opacity-40"
            >
              ‹
            </button>
            <div className="text-xs font-semibold text-[#1f1f1f]">{currentPage}/{totalPages}</div>
            <button
              type="button"
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#cfcfcf] text-sm text-[#1f1f1f] disabled:opacity-40"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(value: string | null) {
  if (!value) return "—"
  try {
    return friendlyDateFormatter.format(new Date(value)).replace(/ de /g, " ")
  } catch {
    return value
  }
}
