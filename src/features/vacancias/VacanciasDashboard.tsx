'use client'

import { useMemo, useState } from "react"
import { ExternalLink, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  VACANCIA_CLASS_CHIP_CLASSES,
  VACANCIA_CLASSE_LABEL,
  VACANCIA_CLASSE_COLORS,
  VACANCIA_CLASSES_BY_TIPO,
  VACANCIA_TIPO_CHIP_CLASSES,
  VACANCIA_TIPO_COLORS,
  VACANCIA_TIPO_LABEL,
  type VacanciaClasse,
  type VacanciaRow,
  type VacanciaTipo,
  type VacanciasData,
} from "./vacancia-types"

type ClasseFilter = "TODAS" | VacanciaClasse
type PageSizeOption = 5 | 10 | 20 | 30 | 50 | 100 | "TODOS"

type VacanciasDashboardProps = {
  data: VacanciasData
}

const PAGE_SIZE_OPTIONS: readonly PageSizeOption[] = [5, 10, 20, 30, 50, 100, "TODOS"] as const

const friendlyDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

const SUMMARY_YEARS = [2025, 2026, 2027, 2028, 2029] as const

const SUMMARY_MONTHS = [
  { key: "ALL", label: "Anual", monthIndex: null },
  { key: "JAN", label: "Janeiro", monthIndex: 0 },
  { key: "FEV", label: "Fevereiro", monthIndex: 1 },
  { key: "MAR", label: "Março", monthIndex: 2 },
  { key: "ABR", label: "Abril", monthIndex: 3 },
  { key: "MAI", label: "Maio", monthIndex: 4 },
  { key: "JUN", label: "Junho", monthIndex: 5 },
  { key: "JUL", label: "Julho", monthIndex: 6 },
  { key: "AGO", label: "Agosto", monthIndex: 7 },
  { key: "SET", label: "Setembro", monthIndex: 8 },
  { key: "OUT", label: "Outubro", monthIndex: 9 },
  { key: "NOV", label: "Novembro", monthIndex: 10 },
  { key: "DEZ", label: "Dezembro", monthIndex: 11 },
] as const

type SummaryMonthKey = (typeof SUMMARY_MONTHS)[number]["key"]

const ALL_VACANCIA_CLASSES = Object.keys(VACANCIA_CLASSE_LABEL) as VacanciaClasse[]

const VACANCIA_COLORS = {
  TOTAL: "#01426A",
  ONEROSA: VACANCIA_TIPO_COLORS.ONEROSA,
  NAO_ONEROSA: VACANCIA_TIPO_COLORS.NAO_ONEROSA,
  APOSENTADORIA: VACANCIA_CLASSE_COLORS.APOSENTADORIA,
  FALECIMENTO: VACANCIA_CLASSE_COLORS.FALECIMENTO,
  DEMISSAO: VACANCIA_CLASSE_COLORS.DEMISSAO,
  EXONERACAO: VACANCIA_CLASSE_COLORS.EXONERACAO,
  PCI: VACANCIA_CLASSE_COLORS.PCI,
  PERDA_POSSE: VACANCIA_CLASSE_COLORS.PERDA_POSSE,
  NOMEACAO_SEM_EFEITO: VACANCIA_CLASSE_COLORS.NOMEACAO_SEM_EFEITO,
} as const

const VACANCIA_CLASSE_DISPLAY_LABEL: Record<VacanciaClasse, string> = {
  APOSENTADORIA: "APOSENTADORIAS",
  FALECIMENTO: "FALECIMENTOS",
  DEMISSAO: "DEMISSÕES",
  EXONERACAO: "EXONERAÇÕES",
  PCI: "PCI",
  PERDA_POSSE: "PERDA DA POSSE",
  NOMEACAO_SEM_EFEITO: "NOMEAÇÃO SEM EFEITO",
}

function createEmptyClassTotals(): Record<VacanciaClasse, number> {
  return ALL_VACANCIA_CLASSES.reduce((acc, classe) => {
    acc[classe] = 0
    return acc
  }, {} as Record<VacanciaClasse, number>)
}

const PILL_BASE_CLASSES = "flex items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.12em] transition"
const PILL_ACTIVE_CLASSES = "border-white bg-white text-[#01426A] shadow"
const PILL_INACTIVE_CLASSES = "border-white/40 bg-transparent text-white/85 hover:bg-white/10"

const MONTH_PILL_BASE_CLASSES = "rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] transition md:text-xs"
const MONTH_PILL_ACTIVE_CLASSES = "border-[#01426A] bg-[#01426A] text-white shadow-sm"
const MONTH_PILL_INACTIVE_CLASSES = "border-slate-300 bg-white text-slate-600 hover:border-[#01426A] hover:text-[#01426A]"

type VacanciaClassRowConfig = {
  label: string
  value: number
  chipColor: string
}

function padCount(value: number) {
  return String(value).padStart(2, "0")
}

function extractYearMonth(value: string | null) {
  if (!value) return null
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return null
  const date = new Date(timestamp)
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function VacanciasDashboard({ data }: VacanciasDashboardProps) {
  const [tipo, setTipo] = useState<VacanciaTipo>("ONEROSA")
  const [classeFilter, setClasseFilter] = useState<ClasseFilter>("TODAS")
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState<PageSizeOption>(10)
  const [currentPage, setCurrentPage] = useState(1)

  const handleTipoChange = (nextTipo: VacanciaTipo) => {
    setTipo(nextTipo)
    setClasseFilter("TODAS")
    setCurrentPage(1)
  }

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return data.rows
      .filter((row) => row.tipo === tipo)
      .filter((row) => (classeFilter === "TODAS" ? true : row.classe === classeFilter))
      .filter((row) => {
        if (!normalizedSearch) return true
        const target = row.servidor?.toLowerCase() ?? ""
        return target.includes(normalizedSearch)
      })
      .sort((a, b) => {
        const aTs = a.data ? Date.parse(a.data) : 0
        const bTs = b.data ? Date.parse(b.data) : 0
        return bTs - aTs
      })
  }, [data.rows, tipo, classeFilter, search])

  const summaryRows = useMemo(() => data.rows.slice(), [data.rows])

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

  return (
    <section className="pb-12">
      <VacanciasHeaderFilters
        tipo={tipo}
        onTipoChange={handleTipoChange}
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
      />

      <div className="space-y-6">
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
        <VacanciasSummaryCard rows={summaryRows} />
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
}

function VacanciasHeaderFilters({
  tipo,
  onTipoChange,
  classeFiltro,
  onClasseFiltroChange,
  search,
  onSearchChange,
}: HeaderFiltersProps) {
  const classeOptions = VACANCIA_CLASSES_BY_TIPO[tipo]

  return (
    <div className="rounded-t-[18px] rounded-b-none border border-[#bdbbbb] bg-[#bdbbbb] px-4 pt-4 pb-0 shadow-inner shadow-black/10">
      <div className="grid items-start gap-y-3 text-[#1f1f1f] md:grid-cols-[minmax(0,1fr)_minmax(220px,1fr)] md:grid-rows-[auto_auto] font-['Aller']">
        <h2 className="order-1 text-left text-3xl font-['Bebas_Neue'] font-normal tracking-[0.02em] text-[#004C3F] md:col-start-1">
          Painel de Vacâncias
        </h2>
        <div className="order-2 w-full md:col-start-2 md:self-start md:ml-auto md:w-auto">
          <label className="sr-only" htmlFor="vacancias-search">
            Buscar vacância
          </label>
          <div className="flex h-6 w-full items-center gap-1 rounded-full border border-[#004C3F] bg-white/80 px-2 shadow-sm md:w-[170px]">
            <Search className="h-[11px] w-[11px] text-[#004C3F]" strokeWidth={1.25} aria-hidden="true" />
            <input
              id="vacancias-search"
              placeholder="Buscar vacância"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full border-none bg-transparent text-[11px] font-['Aller'] font-medium tracking-tight text-[#1f1f1f] placeholder:text-[#7a7a7a] focus:outline-none"
            />
          </div>
        </div>
        <div className="order-3 -mx-4 flex w-[calc(100%+2rem)] flex-wrap items-end justify-center gap-2 pb-0 md:col-span-2 md:col-start-1 md:row-start-2 md:items-end md:justify-center md:pb-0">
          <div className="flex flex-nowrap items-end gap-1">
            <MainTypeTab label="Onerosas" active={tipo === "ONEROSA"} onClick={() => onTipoChange("ONEROSA")} />
            <MainTypeTab label="Não Onerosas" active={tipo === "NAO_ONEROSA"} onClick={() => onTipoChange("NAO_ONEROSA")} />
          </div>
          <span className="hidden h-6 w-px bg-[#cccccc] md:inline-flex" aria-hidden="true" />
          <div className="flex flex-wrap items-end justify-center gap-1.5">
            <ClasseFilterChip
              label="Todas"
              active={classeFiltro === "TODAS"}
              onClick={() => onClasseFiltroChange("TODAS")}
            />
            {classeOptions.map((classe) => (
              <ClasseFilterChip
                key={classe}
                label={VACANCIA_CLASSE_LABEL[classe]}
                active={classeFiltro === classe}
                onClick={() => onClasseFiltroChange(classe)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type ClasseChipProps = {
  label: string
  active: boolean
  onClick: () => void
}

function MainTypeTab({ label, active, onClick }: ClasseChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-t-full rounded-b-none px-4 text-[11px] font-['Aller'] font-semibold uppercase tracking-[0.06em] text-center transition duration-150 ease-out min-w-[120px]",
        active ? "bg-[#007B5F] text-white py-1.5 -translate-y-[3px]" : "bg-[#00B388] text-white py-1.5 translate-y-0"
      )}
    >
      {label}
    </button>
  )
}

function ClasseFilterChip({ label, active, onClick }: ClasseChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-t-xl rounded-b-none px-3 text-[10px] font-['Aller'] font-semibold uppercase tracking-[0.06em] text-center transition duration-150 ease-out min-w-[95px]",
        active ? "bg-[#007B5F] text-white py-1.5 -translate-y-[3px]" : "bg-[#00B388] text-white py-1.5 translate-y-0",
      )}
    >
      {label}
    </button>
  )
}

type SummaryCardProps = {
  rows: VacanciaRow[]
}

function VacanciasSummaryCard({ rows }: SummaryCardProps) {
  const [selectedYear, setSelectedYear] = useState<(typeof SUMMARY_YEARS)[number]>(SUMMARY_YEARS[0])
  const [selectedMonth, setSelectedMonth] = useState<SummaryMonthKey>("ALL")

  const periodRows = useMemo(() => {
    const monthMeta = SUMMARY_MONTHS.find((month) => month.key === selectedMonth) ?? SUMMARY_MONTHS[0]
    const monthIndex = monthMeta.monthIndex

    return rows.filter((row) => {
      const parts = extractYearMonth(row.data)
      if (!parts) return false
      if (parts.year !== selectedYear) return false
      if (monthIndex !== null && parts.month !== monthIndex) return false
      return true
    })
  }, [rows, selectedYear, selectedMonth])

  const summary = useMemo(() => {
    const tipoTotals: Record<VacanciaTipo, number> = { ONEROSA: 0, NAO_ONEROSA: 0 }
    const classeTotals = createEmptyClassTotals()

    for (const row of periodRows) {
      tipoTotals[row.tipo] += 1
      if (row.classe) {
        classeTotals[row.classe] += 1
      }
    }

    return {
      total: periodRows.length,
      tipoTotals,
      classeTotals,
    }
  }, [periodRows])

  const selectedMonthMeta = SUMMARY_MONTHS.find((month) => month.key === selectedMonth) ?? SUMMARY_MONTHS[0]
  const periodLabel = selectedMonthMeta.key === "ALL"
    ? `Ano de ${selectedYear}`
    : `${selectedMonthMeta.label} ${selectedYear}`
  const hasData = summary.total > 0
  const monthLabelForTotal = selectedMonthMeta.key === "ALL" ? "ANUAL" : selectedMonthMeta.label.toUpperCase()
  const totalVacancias = summary.total
  const totalOnerosas = summary.tipoTotals.ONEROSA
  const totalNaoOnerosas = summary.tipoTotals.NAO_ONEROSA

  const onerosasClassRows: VacanciaClassRowConfig[] = VACANCIA_CLASSES_BY_TIPO.ONEROSA.map((classe) => ({
    label: VACANCIA_CLASSE_DISPLAY_LABEL[classe],
    value: summary.classeTotals[classe],
    chipColor: VACANCIA_COLORS[classe],
  }))

  const naoOnerosasClassRows: VacanciaClassRowConfig[] = VACANCIA_CLASSES_BY_TIPO.NAO_ONEROSA.map((classe) => ({
    label: VACANCIA_CLASSE_DISPLAY_LABEL[classe],
    value: summary.classeTotals[classe],
    chipColor: VACANCIA_COLORS[classe],
  }))

  return (
    <div className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="flex w-full flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <div className="h-0 w-[88px] flex-shrink-0" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">MÊS</span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {SUMMARY_MONTHS.map((month) => (
            <button
              key={month.key}
              type="button"
              aria-pressed={selectedMonth === month.key}
              onClick={() => setSelectedMonth(month.key)}
              className={cn(
                MONTH_PILL_BASE_CLASSES,
                selectedMonth === month.key ? MONTH_PILL_ACTIVE_CLASSES : MONTH_PILL_INACTIVE_CLASSES,
              )}
            >
              {month.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1 flex items-stretch gap-4 px-5 pb-5">
        <aside className="flex w-[88px] self-stretch flex-col justify-between rounded-3xl bg-[#01426A] px-3 py-4 text-white">
          <div className="flex flex-1 flex-col items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em]">Ano</span>
            <div className="flex flex-1 flex-col items-center gap-2">
              {SUMMARY_YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  aria-pressed={selectedYear === year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    PILL_BASE_CLASSES,
                    "h-10 w-[72px]",
                    selectedYear === year ? PILL_ACTIVE_CLASSES : PILL_INACTIVE_CLASSES,
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {hasData ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  {`Total de vacâncias — ${selectedYear} — ${monthLabelForTotal}`}
                </p>
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: VACANCIA_COLORS.TOTAL }}
                >
                  {padCount(totalVacancias)}
                </span>
              </div>

              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <VacanciaResumoTipoCard
                  title="TOTAL ONEROSAS"
                  total={totalOnerosas}
                  accentColor={VACANCIA_COLORS.ONEROSA}
                  chipColor={VACANCIA_COLORS.ONEROSA}
                  classRows={onerosasClassRows}
                />
                <VacanciaResumoTipoCard
                  title="TOTAL NÃO ONEROSAS"
                  total={totalNaoOnerosas}
                  accentColor={VACANCIA_COLORS.NAO_ONEROSA}
                  chipColor={VACANCIA_COLORS.NAO_ONEROSA}
                  classRows={naoOnerosasClassRows}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500">
              Nenhuma vacância registrada para {periodLabel}.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type VacanciaResumoTipoCardProps = {
  title: string
  total: number
  accentColor: string
  chipColor: string
  classRows: VacanciaClassRowConfig[]
}

function VacanciaResumoTipoCard({ title, total, accentColor, chipColor, classRows }: VacanciaResumoTipoCardProps) {
  return (
    <div
      className="flex h-full flex-col rounded-2xl border border-slate-200 border-t-4 bg-white px-4 py-3 shadow-sm"
      style={{ borderTopColor: accentColor }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{title}</h3>
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: chipColor }}
        >
          {padCount(total)}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {classRows.map((row) => (
          <VacanciaClasseRow key={row.label} label={row.label} value={row.value} chipColor={row.chipColor} />
        ))}
      </div>
    </div>
  )
}

type VacanciaClasseRowProps = VacanciaClassRowConfig

function VacanciaClasseRow({ label, value, chipColor }: VacanciaClasseRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-1.5">
      <span className="truncate pr-3 text-[11px] font-medium uppercase tracking-wide text-slate-700">{label}</span>
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: chipColor }}
      >
        {padCount(value)}
      </span>
    </div>
  )
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
    <div className="flex h-full flex-col rounded-b-[18px] rounded-t-none border border-[#d9d9d9] bg-white shadow-sm shadow-black/5">
      <div className="flex-1 overflow-x-auto">
        {rows.length ? (
          <table className="min-w-full table-fixed border-collapse border border-[#e8e8e8] font-['Aller'] text-sm text-[#1f1f1f]">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[118px]" />
              <col className="w-[160px]" />
              <col />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[220px]" />
            </colgroup>
            <thead style={{ backgroundColor: "#f3f1f1" }}>
              <tr>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#004C3F]">DATA</span>
                </th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#004C3F]">TIPO</span>
                </th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#004C3F]">CLASSE</span>
                </th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#004C3F]">SERVIDOR</span>
                </th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#004C3F]">DOU</span>
                </th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#004C3F]">PREENCHIDA?</span>
                </th>
                <th className="border-b border-[#e8e8e8] px-3 py-2 text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#004C3F]">OBSERVAÇÕES</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="text-[13px]">
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-center text-[#1f1f1f]">{formatDate(row.data)}</td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-center">
                    <span
                      className={cn("inline-flex min-w-[108px] items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em]", VACANCIA_TIPO_CHIP_CLASSES[row.tipo])}
                      style={{ backgroundColor: VACANCIA_TIPO_COLORS[row.tipo] }}
                    >
                      {VACANCIA_TIPO_LABEL[row.tipo]}
                    </span>
                  </td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-center">
                    {row.classe ? (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em]",
                          VACANCIA_CLASS_CHIP_CLASSES[row.classe],
                        )}
                        style={{ backgroundColor: VACANCIA_CLASSE_COLORS[row.classe] }}
                      >
                        {VACANCIA_CLASSE_LABEL[row.classe]}
                      </span>
                    ) : (
                      <span className="text-xs text-[#9d9d9d]">—</span>
                    )}
                  </td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-[#1f1f1f]">{row.servidor ?? "—"}</td>
                  <td className="border-b border-[#f0f0f0] px-3 py-2 text-center text-[#1f1f1f]">
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
                  <td
                    className={cn(
                      "border-b border-[#f0f0f0] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em]",
                      row.preenchida === true
                        ? "bg-[#dff4e7] text-[#135f34]"
                        : row.preenchida === false
                          ? "bg-[#f8e3e3] text-[#8c1d1d]"
                          : "bg-white text-[#7a7a7a]",
                    )}
                  >
                    {row.preenchida === null ? "—" : row.preenchida ? "Sim" : "Não"}
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
      <div className="text-xs text-[#4A4F55]">
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
