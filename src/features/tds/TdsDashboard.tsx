'use client'

import { useMemo, useState, type ReactNode } from "react"
import DOMPurify from "dompurify"
import { CalendarIcon, ExternalLink, Inbox } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { SistemaConcorrencia } from "@/features/listas/listas-actions"
import { cn } from "@/lib/utils"
import { EnviarTdModal } from "@/src/app/(app)/resumo/ResumoModals"
import type { TdsData, TdItem } from "./loadTdsData"
import type { TdRequestTipo } from "./td-types"

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

type StatusTab = "ENVIADOS" | "TALVEZ"
type ListaFiltro = "TODOS" | SistemaConcorrencia

const numberFormatter = new Intl.NumberFormat("pt-BR")

export function TdsDashboard({ data, currentCandidate, currentCandidateTd }: TdsDashboardProps) {
  const [statusTab, setStatusTab] = useState<StatusTab>("ENVIADOS")
  const [listaFiltro, setListaFiltro] = useState<ListaFiltro>("TODOS")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const { content } = data
  const myTdStatus = useMemo(() => buildMyTdStatus(currentCandidate, currentCandidateTd ?? null), [currentCandidate, currentCandidateTd])
  const avatarFallback = getInitials(currentCandidate?.nome)
  const sanitizedHowItWorks = useMemo(() => DOMPurify.sanitize(content.howItWorksHtml), [content.howItWorksHtml])
  const sanitizedGuidelines = useMemo(() => DOMPurify.sanitize(content.guidelinesHtml), [content.guidelinesHtml])

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

  return (
    <section className="space-y-8 pb-12">
      <div className="grid items-stretch gap-4 md:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
        <Card className="flex h-full min-h-[220px] flex-col border border-rose-100 bg-white shadow-xl shadow-rose-100/70">
          <CardContent className="flex flex-1 flex-col gap-4 px-6 pt-6 pb-4 text-slate-900">
            <div className="flex justify-center">
              <Avatar className="h-14 w-14 border border-slate-200 shadow-sm">
                {currentCandidate?.avatarUrl ? <AvatarImage src={currentCandidate.avatarUrl} alt={currentCandidate.nome} /> : null}
                <AvatarFallback className="bg-slate-50 text-base font-semibold text-slate-600">{avatarFallback}</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900">{currentCandidate?.nome ?? "Vincule seu perfil de candidato"}</p>
              <div className="mt-2 flex justify-center">
                <Badge className={cn("rounded-full border-0 px-3 py-1 text-[11px] font-semibold shadow-sm ring-1 ring-black/5", myTdStatus.badgeClass)}>{myTdStatus.label}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-700 text-center">{myTdStatus.helperText}</p>
            {!currentCandidate?.id ? (
              <p className="text-[11px] text-slate-500 text-center">Associe sua conta a um candidato na seção Listas para liberar o envio do TD.</p>
            ) : null}
          </CardContent>
          <CardFooter className="mt-auto pt-0">
            {currentCandidate?.id ? (
              <EnviarTdModal
                candidateId={currentCandidate.id}
                trigger={
                  <Button
                    className="w-full rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/10 transition hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-200"
                  >
                    Enviar / editar o meu TD
                  </Button>
                }
              />
            ) : (
              <Button variant="outline" disabled className="w-full rounded-full border-slate-200 text-slate-400">
                Vincule seu perfil para enviar TD
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="flex h-full min-h-[220px] flex-col border border-orange-100 bg-white shadow-lg shadow-orange-100/60">
          <CardContent className="grid flex-1 gap-4 px-6 py-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <MiniInfoCard>
                <TdInfoSection title="Como funciona o TD?" html={sanitizedHowItWorks} />
              </MiniInfoCard>
              <MiniInfoCard>
                <TdInfoSection title="Orientações gerais" html={sanitizedGuidelines} />
              </MiniInfoCard>
            </div>
            <MiniInfoCard className="flex flex-col justify-between text-sm text-slate-700">
              <div>
                <p className="text-base font-semibold text-slate-900">Modelo de TD</p>
                <p className="mt-1 text-xs text-slate-500">Utilize o arquivo a seguir para garantir as informações essenciais.</p>
              </div>
              {content.models.length ? (
                <div className="mt-3 space-y-2">
                  {content.models.map((model, index) => (
                    <Button
                      key={`td-model-${index}`}
                      asChild
                      variant="secondary"
                      className="w-full justify-center rounded-full border border-rose-100 bg-rose-600 text-white shadow-md shadow-rose-900/15 hover:bg-rose-500"
                    >
                      <a href={model.url} target="_blank" rel="noreferrer noopener">
                        {model.label || "Baixar modelo de TD"}
                      </a>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">Nenhum modelo disponível no momento.</p>
              )}
            </MiniInfoCard>
          </CardContent>
        </Card>
      </div>

      <Card id="tds-painel" className="border-none bg-white shadow-2xl shadow-zinc-200/70">
        <CardHeader className="gap-6 border-b border-zinc-100 pb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Painel de TDs</p>
                <CardTitle className="text-2xl font-semibold text-zinc-900">TDs confirmados</CardTitle>
                <p className="text-sm text-zinc-500">Acompanhe envios e interesses validados pela comissão.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TabPill active={statusTab === "ENVIADOS"} onClick={() => setStatusTab("ENVIADOS")}>
                  Enviados
                </TabPill>
                <TabPill active={statusTab === "TALVEZ"} onClick={() => setStatusTab("TALVEZ")}>
                  Talvez
                </TabPill>
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-400">Filtrar por lista</p>
              <div className="flex flex-wrap gap-2">
                <SubFilterChip label="Todos" active={listaFiltro === "TODOS"} onClick={() => setListaFiltro("TODOS")} />
                <SubFilterChip label="Ampla" active={listaFiltro === "AC"} onClick={() => setListaFiltro("AC")} />
                <SubFilterChip label="PCD" active={listaFiltro === "PCD"} onClick={() => setListaFiltro("PCD")} />
                <SubFilterChip label="PPP" active={listaFiltro === "PPP"} onClick={() => setListaFiltro("PPP")} />
                <SubFilterChip label="Indígenas" active={listaFiltro === "IND"} onClick={() => setListaFiltro("IND")} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 px-6 py-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-1 flex-wrap items-center gap-3">
              <Input
                placeholder="Buscar por nome do aprovado..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="min-w-[220px] flex-1 rounded-full bg-slate-50"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span className="uppercase tracking-[0.2em] text-slate-400">Período</span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="w-[9.5rem] rounded-full bg-slate-50 pr-8 text-xs"
                    />
                    <CalendarIcon className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <span className="text-slate-400">até</span>
                  <div className="relative">
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="w-[9.5rem] rounded-full bg-slate-50 pr-8 text-xs"
                    />
                    <CalendarIcon className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full bg-zinc-900 px-4 py-1 text-white">
              {numberFormatter.format(filteredItems.length)} registros
            </Badge>
          </div>

          <TdsTable items={filteredItems} />
        </CardContent>
      </Card>
    </section>
  )
}

type PillProps = {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function TabPill({ active, onClick, children }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition",
        active ? "border-zinc-900 bg-zinc-900 text-white shadow-sm" : "border-zinc-200 text-zinc-500 hover:border-zinc-400",
      )}
    >
      {children}
    </button>
  )
}

type SubFilterChipProps = {
  label: string
  active: boolean
  onClick: () => void
}

function SubFilterChip({ label, active, onClick }: SubFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition",
        active ? "border-rose-200 bg-rose-50 text-rose-700" : "border-zinc-200 text-zinc-500 hover:border-zinc-400",
      )}
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-slate-50/70 px-8 py-10 text-center">
        <Inbox className="h-10 w-10 text-zinc-400" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-700">Nenhum TD encontrado com os filtros atuais.</p>
          <p className="text-sm text-zinc-500">Ajuste os filtros ou altere o período para ver mais registros.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white">
      <table className="min-w-full divide-y divide-zinc-100 text-sm">
        <thead className="bg-zinc-50/70 text-xs uppercase tracking-[0.25em] text-zinc-400">
          <tr>
            <th className="px-4 py-3 text-left">Candidato</th>
            <th className="px-4 py-3 text-left">Lista</th>
            <th className="px-4 py-3 text-left">Situação</th>
            <th className="px-4 py-3 text-left">Atualização</th>
            <th className="px-4 py-3 text-left">Detalhes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((item) => {
            const statusTheme = item.tipo_td ? tdStatusThemes[item.tipo_td] : null
            const listaTheme = listaBadgeThemes[item.sistema_concorrencia]
            const tdLink = extractLinkFromText(item.observacao)
            const formattedDate = formatDetailedDate(item.data_aprovacao)

            return (
              <tr key={item.td_request_id} className="bg-white transition hover:bg-rose-50/50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-zinc-100 shadow-sm">
                      {item.avatar_url ? <AvatarImage src={item.avatar_url} alt={item.nome_candidato} /> : null}
                      <AvatarFallback className="text-xs font-semibold text-zinc-600">{getInitials(item.nome_candidato)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-zinc-900">{item.nome_candidato}</p>
                      <p className="text-xs text-zinc-500">{buildCandidateMeta(item)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge className={cn("rounded-full border px-3 py-1 text-xs font-semibold", listaTheme)}>
                    {sistemaLabel[item.sistema_concorrencia]}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <Badge className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusTheme?.className ?? "border-zinc-200 text-zinc-500")}>{statusTheme?.label ?? "Sem status"}</Badge>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-zinc-900">{formattedDate ?? "--"}</p>
                  <p className="text-xs text-zinc-500">{statusTheme?.helper ?? "Data não informada"}</p>
                </td>
                <td className="px-4 py-4 text-sm text-zinc-600">
                  {item.observacao ? (
                    <p className="line-clamp-2">{item.observacao}</p>
                  ) : (
                    <span className="text-zinc-400">Sem observações</span>
                  )}
                  {tdLink ? (
                    <a
                      href={tdLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-600"
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
    </div>
  )
}

type MiniInfoCardProps = {
  children: ReactNode
  className?: string
}

function MiniInfoCard({ children, className }: MiniInfoCardProps) {
  return <div className={cn("rounded-2xl border border-rose-100/80 bg-white/95 p-4 shadow-sm shadow-rose-100/60", className)}>{children}</div>
}

const sistemaLabel: Record<SistemaConcorrencia, string> = {
  AC: "Ampla concorrência",
  PCD: "Pessoa com deficiência",
  PPP: "PPP",
  IND: "Indígena",
}

const listaBadgeThemes: Record<SistemaConcorrencia, string> = {
  AC: "border-zinc-900/10 bg-zinc-900 text-white",
  PCD: "border-purple-200 bg-purple-50 text-purple-700",
  PPP: "border-sky-200 bg-sky-50 text-sky-700",
  IND: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

const tdStatusThemes: Record<TdRequestTipo, { label: string; helper: string; className: string }> = {
  ENVIADO: {
    label: "Enviado",
    helper: "Envio confirmado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  INTERESSE: {
    label: "Talvez",
    helper: "Interesse validado",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
}

type MyTdStatus = {
  label: string
  helperText: string
  badgeClass: string
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR")
const dateDetailedFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })

function formatDateBr(value: string | null): string | null {
  if (!value) return null
  try {
    return dateFormatter.format(new Date(value))
  } catch {
    return null
  }
}

function formatDetailedDate(value: string | null): string | null {
  if (!value) return null
  try {
    return dateDetailedFormatter.format(new Date(value))
  } catch {
    return null
  }
}

function buildCandidateMeta(item: TdItem): string {
  const ordem = item.ordem_nomeacao_base ? `Ordem ${item.ordem_nomeacao_base}` : null
  const classificacao = item.classificacao_lista ? `Classificação ${item.classificacao_lista}` : null
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

function buildMyTdStatus(candidate?: CurrentCandidateSummary, snapshot?: CandidateTdSnapshot | null): MyTdStatus {
  const tipo = snapshot?.tipo ?? null
  const formattedDate = formatDateBr(snapshot?.dataReferencia ?? null)

  if (tipo === "ENVIADO") {
    return {
      label: "ENVIADO",
      badgeClass: "bg-emerald-500 text-white",
      helperText: formattedDate ? `Último TD enviado em ${formattedDate}.` : "Último TD enviado registrado pela comissão.",
    }
  }

  if (tipo === "INTERESSE") {
    return {
      label: "TALVEZ",
      badgeClass: "bg-amber-500 text-white",
      helperText: formattedDate ? `Último interesse registrado em ${formattedDate}.` : "Último interesse registrado pela comissão.",
    }
  }

  return {
    label: "NÃO ENVIADO",
    badgeClass: "bg-slate-200 text-slate-800",
    helperText: candidate?.id
      ? "Você ainda não enviou TD para a comissão."
      : "Vincule seu perfil de candidato para informar seu TD.",
  }
}

function getInitials(name?: string): string {
  if (!name) return "TD"
  const [first = "", second = ""] = name.trim().split(/\s+/)
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase() || "TD"
}

type TdInfoSectionProps = {
  title: string
  html: string
}

function TdInfoSection({ title, html }: TdInfoSectionProps) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold text-slate-800">{title}</p>
      <div
        className="text-sm leading-relaxed text-slate-700 [&_a]:text-rose-700 [&_a]:underline [&_p:not(:last-child)]:mb-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
