"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ClipboardList, FileSignature, ListChecks, Megaphone, Settings2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateBrMedium } from "@/lib/date-format"
import { LoaModal, CsjtModal, CargosVagosModal } from "./ResumoCardModals"
import { PendenciasModal, NovoCandidatoModal, NomeacaoModal, NovaAprovacaoModal } from "./ListasCardModals"
import { TdPendenciasModal, TdContentEditorModal, TdManualModal } from "./TdCardModals"
import { NovaVacanciaModal, VacanciasHistoryModal } from "./VacanciasCardModals"
import { NotificationQueueModal, ReportsModal } from "./ControleCardModals"
import type { ComissaoDashboardData } from "./loadComissaoData"
import type { ComissaoDashboardActions } from "./comissao-action-types"

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

type ActionVariant = "red" | "amber"

function CardActionButton({ children, onClick, variant = "red" }: { children: ReactNode; onClick: () => void; variant?: ActionVariant }) {
  const palette = variant === "amber"
    ? "border-amber-200 text-amber-700 hover:border-amber-300"
    : "border-red-200 text-red-700 hover:border-red-300"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-full border bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-sm transition ${palette}`}
    >
      {children}
    </button>
  )
}

type ComissaoDashboardProps = {
  data: ComissaoDashboardData
  actions: ComissaoDashboardActions
}

export function ComissaoDashboard({ data, actions }: ComissaoDashboardProps) {
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

  const [openLoa, setOpenLoa] = useState(false)
  const [openCsjt, setOpenCsjt] = useState(false)
  const [openCargosVagos, setOpenCargosVagos] = useState(false)

  const [openPendenciasListas, setOpenPendenciasListas] = useState(false)
  const [openAdicionarAprovado, setOpenAdicionarAprovado] = useState(false)
  const [openNomeacoes, setOpenNomeacoes] = useState(false)
  const [openAprovacaoManual, setOpenAprovacaoManual] = useState(false)

  const [openPendenciasTds, setOpenPendenciasTds] = useState(false)
  const [openEditarTdConteudo, setOpenEditarTdConteudo] = useState(false)
  const [openCadastroTdManual, setOpenCadastroTdManual] = useState(false)

  const [openNovaVacancia, setOpenNovaVacancia] = useState(false)
  const [openHistoricoVacancias, setOpenHistoricoVacancias] = useState(false)

  const [openFilaNotificacoes, setOpenFilaNotificacoes] = useState(false)
  const [openRelatorios, setOpenRelatorios] = useState(false)

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
      helper: latestCsjtAuthorization ? `Autorizado em ${formatDateBrMedium(latestCsjtAuthorization.dataAutorizacao)}` : "Inclua a última deliberação",
    },
    {
      label: "Cargos vagos",
      value: latestCargosVagos
        ? `${latestCargosVagos.analistaVagos} AJ · ${latestCargosVagos.tecnicoVagos} TJ`
        : "Sem dados",
      helper: latestCargosVagos ? `Referência ${formatDateBrMedium(latestCargosVagos.dataReferencia)}` : "Registre o levantamento mais recente",
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
          <div className="grid gap-2 md:grid-cols-3">
            <CardActionButton onClick={() => setOpenLoa(true)}>LOA</CardActionButton>
            <CardActionButton onClick={() => setOpenCsjt(true)}>CSJT</CardActionButton>
            <CardActionButton onClick={() => setOpenCargosVagos(true)}>CARGOS VAGOS</CardActionButton>
          </div>
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
          <div className="grid gap-2 md:grid-cols-2">
            <CardActionButton onClick={() => setOpenPendenciasListas(true)}>PENDÊNCIAS</CardActionButton>
            <CardActionButton onClick={() => setOpenAdicionarAprovado(true)}>ADICIONAR APROVADO</CardActionButton>
            <CardActionButton onClick={() => setOpenNomeacoes(true)}>NOMEAÇÕES</CardActionButton>
            <CardActionButton onClick={() => setOpenAprovacaoManual(true)}>APROVAÇÃO MANUAL</CardActionButton>
          </div>
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
          <div className="grid gap-2">
            <CardActionButton variant="amber" onClick={() => setOpenPendenciasTds(true)}>PENDÊNCIAS</CardActionButton>
            <CardActionButton variant="amber" onClick={() => setOpenEditarTdConteudo(true)}>EDITAR CONTEÚDO</CardActionButton>
            <CardActionButton variant="amber" onClick={() => setOpenCadastroTdManual(true)}>CADASTRO MANUAL</CardActionButton>
          </div>
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
                  <p className="text-[11px] text-zinc-400">{formatDateBrMedium(item.data)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-zinc-200 bg-white/80 px-3 py-4 text-sm text-zinc-500">Nenhuma vacância registrada até o momento.</p>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <CardActionButton onClick={() => setOpenNovaVacancia(true)}>NOVA VACÂNCIA</CardActionButton>
            <CardActionButton onClick={() => setOpenHistoricoVacancias(true)}>HISTÓRICO</CardActionButton>
          </div>
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
          <div className="grid gap-2 md:grid-cols-2">
            <CardActionButton onClick={() => setOpenFilaNotificacoes(true)}>FILA DE NOTIFICAÇÕES</CardActionButton>
            <CardActionButton onClick={() => setOpenRelatorios(true)}>RELATÓRIOS</CardActionButton>
          </div>
        </>
      ),
    },
  ]

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {boardColumns.map((column) => (
          <DashboardCard key={column.key} title={column.title} description={column.description} icon={column.icon}>
            {column.content}
          </DashboardCard>
        ))}
      </div>

      <LoaModal open={openLoa} onOpenChange={setOpenLoa} loas={loasHistory} onUpsertLoa={actions.upsertLoa} />
      <CsjtModal
        open={openCsjt}
        onOpenChange={setOpenCsjt}
        autorizacoes={csjtAuthorizationsHistory}
        loas={loasHistory}
        onUpsertCsjtAuthorization={actions.upsertCsjtAuthorization}
      />
      <CargosVagosModal
        open={openCargosVagos}
        onOpenChange={setOpenCargosVagos}
        registros={cargosVagosHistory}
        onUpsertCargosVagos={actions.upsertCargosVagos}
      />

      <PendenciasModal
        open={openPendenciasListas}
        onOpenChange={setOpenPendenciasListas}
        pending={outrasAprovacoes}
        onModerateOutraAprovacao={actions.moderateOutraAprovacao}
      />
      <NovoCandidatoModal
        open={openAdicionarAprovado}
        onOpenChange={setOpenAdicionarAprovado}
        onCreateCandidate={actions.createCandidate}
      />
      <NomeacaoModal
        open={openNomeacoes}
        onOpenChange={setOpenNomeacoes}
        candidates={candidates}
        onRegistrarNomeacao={actions.registrarNomeacao}
      />
      <NovaAprovacaoModal
        open={openAprovacaoManual}
        onOpenChange={setOpenAprovacaoManual}
        candidates={candidates}
        onSaveOutraAprovacao={actions.saveOutraAprovacao}
      />

      <TdPendenciasModal
        open={openPendenciasTds}
        onOpenChange={setOpenPendenciasTds}
        pending={tdRequests}
        onModerateTdRequest={actions.moderateTdRequest}
      />
      <TdContentEditorModal
        open={openEditarTdConteudo}
        onOpenChange={setOpenEditarTdConteudo}
        content={tdContent}
        onUpsertTdContent={actions.upsertTdContent}
      />
      <TdManualModal
        open={openCadastroTdManual}
        onOpenChange={setOpenCadastroTdManual}
        candidates={candidates}
        onCreateManualTd={actions.createManualTd}
      />

      <NovaVacanciaModal open={openNovaVacancia} onOpenChange={setOpenNovaVacancia} onUpsertVacancia={actions.upsertVacancia} />
      <VacanciasHistoryModal
        open={openHistoricoVacancias}
        onOpenChange={setOpenHistoricoVacancias}
        vacancias={vacanciasHistory}
        onUpsertVacancia={actions.upsertVacancia}
        onDeleteVacancia={actions.deleteVacancia}
      />

      <NotificationQueueModal
        open={openFilaNotificacoes}
        onOpenChange={setOpenFilaNotificacoes}
        queue={notificationsQueue}
        onRetryNotification={actions.retryNotification}
        onCancelNotification={actions.cancelNotification}
        onEnqueueNotification={actions.enqueueCustomNotification}
      />
      <ReportsModal open={openRelatorios} onOpenChange={setOpenRelatorios} onGenerateExport={actions.generateExport} />
    </>
  )
}
