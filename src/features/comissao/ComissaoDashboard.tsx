"use client"

import { useMemo, type ReactNode } from "react"
import { ClipboardList, FileSignature, ListChecks, Megaphone, Settings2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResumoCardActions } from "./ResumoCardModals"
import { ListasCardActions } from "./ListasCardModals"
import { TdCardActions } from "./TdCardModals"
import { VacanciasCardActions } from "./VacanciasCardModals"
import { ControleCardActions } from "./ControleCardModals"
import type { ComissaoDashboardData } from "./loadComissaoData"

type DashboardCardProps = {
  title: string
  description: string
  children: ReactNode
  icon?: ReactNode
}

function DashboardCard({ title, description, children, icon }: DashboardCardProps) {
  return (
    <Card className="h-full border-none bg-white/95 shadow-lg shadow-zinc-200/60">
      <CardHeader className="flex flex-row items-start gap-3">
        {icon ? <div className="rounded-2xl bg-red-50 p-2 text-red-700">{icon}</div> : null}
        <div>
          <CardTitle className="text-lg font-semibold text-zinc-900">{title}</CardTitle>
          <CardDescription className="text-sm text-zinc-500">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value))
  } catch {
    return "—"
  }
}

export function ComissaoDashboard({ data }: { data: ComissaoDashboardData }) {
  const {
    pendingOutrasAprovacoesCount,
    pendingTdCount,
    latestLoa,
    latestCsjtAuthorization,
    latestCargosVagos,
    outrasAprovacoes,
    tdRequests,
    loasHistory,
    csjtAuthorizationsHistory,
    cargosVagosHistory,
    candidates,
    tdContent,
    vacanciasHistory,
    notificationsQueue,
  } = data

  const outrasPreview = outrasAprovacoes.slice(0, 3)
  const tdPreview = tdRequests.slice(0, 3)
  const vacanciasPreview = vacanciasHistory.slice(0, 3)
  const notificationsSummary = useMemo(() => {
    const summary = { pendentes: 0, falhas: 0, enviadas: 0 }
    notificationsQueue.forEach((item) => {
      if (item.status === "PENDENTE") summary.pendentes += 1
      if (item.status === "ERRO") summary.falhas += 1
      if (item.status === "ENVIADO") summary.enviadas += 1
    })
    return summary
  }, [notificationsQueue])
  const destaqueControle = notificationsQueue[0]
  const resumoHighlights = [
    {
      label: "LOA",
      value: latestLoa ? `Ano ${latestLoa.ano}` : "Sem LOA",
      helper: latestLoa ? `${latestLoa.totalPrevisto} provimentos · ${latestLoa.status}` : "Cadastre uma LOA para iniciar",
    },
    {
      label: "CSJT",
      value: latestCsjtAuthorization ? `${latestCsjtAuthorization.totalProvimentos} vagas` : "Sem autorizações",
      helper: latestCsjtAuthorization ? `Autorizado em ${formatDate(latestCsjtAuthorization.dataAutorizacao)}` : "Inclua a última deliberação",
    },
    {
      label: "Cargos vagos",
      value: latestCargosVagos
        ? `${latestCargosVagos.analistaVagos} AJ · ${latestCargosVagos.tecnicoVagos} TJ`
        : "Sem dados",
      helper: latestCargosVagos ? `Referência ${formatDate(latestCargosVagos.dataReferencia)}` : "Registre o levantamento mais recente",
    },
  ]

  const boardColumns = [
    {
      key: "resumo",
      title: "Resumo",
      description: "LOA, CSJT e cargos vagos",
      icon: <ClipboardList className="h-5 w-5" />,
      content: (
        <>
          <div className="space-y-3 text-sm">
            {resumoHighlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">{item.label}</p>
                <p className="text-lg font-semibold text-zinc-900">{item.value}</p>
                <p className="text-xs text-zinc-500">{item.helper}</p>
              </div>
            ))}
          </div>
          <ResumoCardActions
            loas={loasHistory}
            csjtAuthorizations={csjtAuthorizationsHistory}
            cargosVagos={cargosVagosHistory}
          />
        </>
      ),
    },
    {
      key: "listas",
      title: "Listas",
      description: "Pendências das outras aprovações",
      icon: <ListChecks className="h-5 w-5" />,
      content: (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/40 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-red-500">Pendentes</p>
              <p className="text-3xl font-semibold text-red-900">{pendingOutrasAprovacoesCount}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-600">Outras aprovações</span>
          </div>
          <div className="space-y-2">
            {outrasPreview.length ? (
              outrasPreview.map((approval) => (
                <div key={approval.id} className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-sm">
                  <p className="font-semibold text-zinc-900">{approval.candidatoNome}</p>
                  <p className="text-xs text-zinc-500">{approval.orgao}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">Nenhum envio recente.</p>
            )}
          </div>
          <ListasCardActions pending={outrasAprovacoes} candidates={candidates} />
        </>
      ),
    },
    {
      key: "tds",
      title: "TDs",
      description: "Solicitações enviadas",
      icon: <FileSignature className="h-5 w-5" />,
      content: (
        <>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-600">Pendentes</p>
            <p className="text-3xl font-semibold text-amber-900">{pendingTdCount}</p>
          </div>
          <div className="space-y-2">
            {tdPreview.length ? (
              tdPreview.map((td) => (
                <div key={td.id} className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-sm">
                  <p className="font-semibold text-zinc-900">{td.candidatoNome}</p>
                  <p className="text-xs text-zinc-500">{td.tipoTd === "ENVIADO" ? "TD enviado" : "Interessado"}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">Nenhuma solicitação aguardando revisão.</p>
            )}
          </div>
          <TdCardActions pending={tdRequests} candidates={candidates} content={tdContent} />
        </>
      ),
    },
    {
      key: "vacancias",
      title: "Vacâncias",
      description: "Saídas e impactos",
      icon: <Megaphone className="h-5 w-5" />,
      content: (
        <>
          <div className="space-y-2 text-sm">
            {vacanciasPreview.length ? (
              vacanciasPreview.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{item.tribunal ?? "TRT-2"}</p>
                  <p className="text-base font-semibold text-zinc-900">{item.cargo ?? "Cargo"}</p>
                  <p className="text-xs text-zinc-500">{item.motivo ?? "Sem motivo"}</p>
                  <p className="text-[11px] text-zinc-400">{formatDate(item.data)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-zinc-200 bg-white/80 px-3 py-4 text-sm text-zinc-500">Nenhuma vacância registrada até o momento.</p>
            )}
          </div>
          <VacanciasCardActions vacancias={vacanciasHistory} />
        </>
      ),
    },
    {
      key: "controle",
      title: "Controle",
      description: "Notificações e relatórios",
      icon: <Settings2 className="h-5 w-5" />,
      content: (
        <>
          <div className="rounded-2xl border border-zinc-100 bg-white/80 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">Pendentes: {notificationsSummary.pendentes}</span>
              <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">Falhas: {notificationsSummary.falhas}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">Enviadas: {notificationsSummary.enviadas}</span>
            </div>
            {destaqueControle ? (
              <div className="mt-3 space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Última mensagem</p>
                <p className="text-base font-semibold text-zinc-900">{destaqueControle.titulo}</p>
                <p className="text-xs text-zinc-500 line-clamp-2">{destaqueControle.corpo}</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">Fila vazia no momento.</p>
            )}
          </div>
          <ControleCardActions queue={notificationsQueue} />
        </>
      ),
    },
  ]

  return (
    <div className="space-y-10">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-none bg-gradient-to-br from-red-900 via-red-700 to-red-600 text-white">
          <CardContent className="flex flex-col gap-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-red-100">Pendências totais</p>
              <h2 className="text-4xl font-semibold">{pendingOutrasAprovacoesCount + pendingTdCount}</h2>
              <p className="text-sm text-red-100">Itens aguardando despacho da comissão.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-red-100">Outras aprovações</p>
                <p className="text-2xl font-semibold">{pendingOutrasAprovacoesCount}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.3em] text-red-100">TDs</p>
                <p className="text-2xl font-semibold">{pendingTdCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/90 shadow-lg shadow-zinc-200/60">
          <CardContent className="flex h-full flex-col justify-between gap-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Últimas atualizações</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">{latestLoa ? `LOA ${latestLoa.ano}` : "Sem LOA cadastrada"}</p>
              <p className="text-sm text-zinc-500">
                {latestLoa ? `Status: ${latestLoa.status}` : "Cadastre a primeira LOA para iniciar o acompanhamento."}
              </p>
            </div>
            <div className="text-xs text-zinc-500 space-y-1">
              <p>
                CSJT: {latestCsjtAuthorization ? `${latestCsjtAuthorization.totalProvimentos} vagas autorizadas em ${formatDate(latestCsjtAuthorization.dataAutorizacao)}` : "Nenhuma autorização registrada"}
              </p>
              <p>Cargos vagos TRT-2: {latestCargosVagos ? `${latestCargosVagos.analistaVagos} AJ / ${latestCargosVagos.tecnicoVagos} TJ` : "Sem dados"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Fluxo operacional</p>
          <h2 className="text-2xl font-semibold text-zinc-900">Kanban da Comissão</h2>
          <p className="text-sm text-zinc-500">Os cinco cards agora contam com formulários e modais prontos para conduzir toda a operação da comissão.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {boardColumns.map((column) => (
            <DashboardCard key={column.key} title={column.title} description={column.description} icon={column.icon}>
              {column.content}
            </DashboardCard>
          ))}
        </div>
      </div>
    </div>
  )
}
