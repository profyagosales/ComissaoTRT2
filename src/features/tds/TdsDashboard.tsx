'use client'

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { CalendarIcon, Edit3, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { SistemaConcorrencia } from "@/features/listas/listas-actions"
import { cn } from "@/lib/utils"
import type { TdsData, TdItem } from "./loadTdsData"

type TdsDashboardProps = {
  data: TdsData
  isComissao: boolean
}

type StatusTab = "ENVIADOS" | "TALVEZ"
type ListaFiltro = "TODOS" | SistemaConcorrencia

const numberFormatter = new Intl.NumberFormat("pt-BR")

export function TdsDashboard({ data, isComissao }: TdsDashboardProps) {
  const [statusTab, setStatusTab] = useState<StatusTab>("ENVIADOS")
  const [listaFiltro, setListaFiltro] = useState<ListaFiltro>("TODOS")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const { content } = data

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Termos de Desistência (TDs)</h1>
          <p className="text-sm text-slate-500">Acompanhe os TDs enviados pelos aprovados e organize o fluxo de nomeações.</p>
        </div>

        <Button asChild className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-amber-600">
          <Link href="/tds/meu-td">
            <Send className="h-4 w-4" />
            Enviar/Editar o meu TD
          </Link>
        </Button>
      </div>

      <Card className="border-none bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-white/60 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">Como funciona o TD?</CardTitle>
            <CardDescription className="text-sm text-slate-600">{content.overview}</CardDescription>
          </div>

          {isComissao && (
            <Button variant="outline" size="sm" className="inline-flex items-center gap-2 rounded-full border-rose-200 bg-white/70 text-xs font-medium text-rose-700 hover:bg-white">
              <Edit3 className="h-3 w-3" />
              Editar texto / modelos
            </Button>
          )}
        </CardHeader>

        <CardContent className="grid gap-6 pt-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">Orientações gerais:</p>
            <div className="space-y-2 text-slate-600">
              {content.instructions.split(/\n+/).filter(Boolean).map((paragraph, index) => (
                <p key={`td-instruction-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">Modelos de TD:</p>
            {content.models.length ? (
              <div className="flex flex-wrap gap-2">
                {content.models.map((model, index) => (
                  <a
                    key={`td-model-${index}`}
                    href={model.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm hover:bg-white"
                  >
                    {model.label}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nenhum modelo cadastrado pela comissão.</p>
            )}
            <p className="text-xs text-slate-500">Os links podem ser atualizados pelo painel da comissão.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-3">
          <TabPill active={statusTab === "ENVIADOS"} onClick={() => setStatusTab("ENVIADOS")}>
            Enviados
          </TabPill>
          <TabPill active={statusTab === "TALVEZ"} onClick={() => setStatusTab("TALVEZ")}>
            Talvez
          </TabPill>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600">
          <span className="mr-1 uppercase tracking-[0.2em] text-slate-400">Filtrar por lista</span>
          <SubFilterChip label="Todos" active={listaFiltro === "TODOS"} onClick={() => setListaFiltro("TODOS")} />
          <SubFilterChip label="Ampla" active={listaFiltro === "AC"} onClick={() => setListaFiltro("AC")} />
          <SubFilterChip label="PCD" active={listaFiltro === "PCD"} onClick={() => setListaFiltro("PCD")} />
          <SubFilterChip label="PPP" active={listaFiltro === "PPP"} onClick={() => setListaFiltro("PPP")} />
          <SubFilterChip label="Indígenas" active={listaFiltro === "IND"} onClick={() => setListaFiltro("IND")} />
        </div>
      </div>

      <Card className="border-none bg-white/80 shadow-sm">
        <CardContent className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <Input
              placeholder="Buscar por nome do aprovado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs rounded-full bg-slate-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="uppercase tracking-[0.2em] text-slate-400">Período</span>
            <div className="flex items-center gap-2">
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
        </CardContent>
      </Card>

      <Card className="border-none bg-white/90 shadow-xl shadow-zinc-200/60">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{statusTab === "ENVIADOS" ? "TDs confirmados" : "TDs em preparação"}</p>
              <h2 className="text-lg font-semibold text-zinc-900">{statusTab === "ENVIADOS" ? "Enviados" : "Talvez / Interessados"}</h2>
            </div>
            <Badge variant="secondary" className="bg-zinc-900/90 text-white">
              {numberFormatter.format(filteredItems.length)} registros
            </Badge>
          </div>

          <div className="px-6 py-5">
            <TdsTable items={filteredItems} />
          </div>
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
        "inline-flex min-w-[140px] items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition",
        active ? "bg-zinc-900 text-white shadow-md" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50",
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
      className={cn("rounded-full px-3 py-1 text-xs font-semibold transition", active ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
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
    return <p className="rounded-2xl border border-dashed border-zinc-200 bg-white/70 px-4 py-6 text-center text-sm text-zinc-500">Nenhum TD encontrado com os filtros atuais.</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white">
      <table className="min-w-full divide-y divide-zinc-100 text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            <th className="px-3 py-3 text-left">Nome</th>
            <th className="px-3 py-3 text-left">Ordem</th>
            <th className="px-3 py-3 text-left">Lista</th>
            <th className="px-3 py-3 text-left">Data</th>
            <th className="px-3 py-3 text-left">Observação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-600">
          {items.map(item => (
            <tr key={item.td_request_id} className="bg-white transition hover:bg-rose-50/60">
              <td className="px-3 py-3 text-left font-medium text-zinc-900">{item.nome_candidato}</td>
              <td className="px-3 py-3 text-left">
                {item.ordem_nomeacao_base ? (
                  <Badge className="rounded-full bg-zinc-900/90 text-xs text-white">{item.ordem_nomeacao_base}</Badge>
                ) : (
                  "--"
                )}
              </td>
              <td className="px-3 py-3 text-left">
                <Badge variant="outline" className="border-white/40 bg-zinc-900/80 text-white">
                  {sistemaLabel[item.sistema_concorrencia]}
                </Badge>
              </td>
              <td className="px-3 py-3 text-left text-zinc-700">{item.data_aprovacao ? new Date(item.data_aprovacao).toLocaleDateString("pt-BR") : "--"}</td>
              <td className="px-3 py-3 text-left text-zinc-700">{item.observacao || "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const sistemaLabel: Record<SistemaConcorrencia, string> = {
  AC: "Ampla concorrência",
  PCD: "Pessoa com deficiência",
  PPP: "PPP",
  IND: "Indígena",
}
