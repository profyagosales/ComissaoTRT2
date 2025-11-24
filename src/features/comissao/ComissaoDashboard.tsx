"use client"

import { useState, type ReactNode } from "react"
import { ClipboardList, FileSignature, ListChecks, Megaphone, Settings2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LoaModal, CsjtModal, CargosVagosModal } from "./ResumoCardModals"
import { PendenciasModal, NovoCandidatoModal, NomeacaoModal, NovaAprovacaoModal } from "./ListasCardModals"
import { TdPendenciasModal, TdContentEditorModal, TdManualModal } from "./TdCardModals"
import { NovaVacanciaModal, VacanciasHistoryModal } from "./VacanciasCardModals"
import { NotificationQueueModal, ReportsModal } from "./ControleCardModals"
import type { ComissaoDashboardData } from "./loadComissaoData"
import type { ComissaoDashboardActions } from "./comissao-action-types"

type DashboardCardProps = {
  title: string
  description?: string
  children: ReactNode
  icon?: ReactNode
  accentClass?: string
  iconClass?: string
}

function DashboardCard({ title, description, children, icon, accentClass, iconClass }: DashboardCardProps) {
  const accentBadgeClass = accentClass ?? "bg-zinc-100 text-zinc-700"

  return (
    <Card className="h-full border-none bg-white/95 shadow-lg shadow-zinc-200/60">
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className={cn("rounded-2xl p-2", iconClass ?? accentBadgeClass)}>
              {icon}
            </div>
          ) : null}
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900">{title}</CardTitle>
            {description ? <CardDescription className="text-sm text-zinc-500">{description}</CardDescription> : null}
          </div>
        </div>
        <span className={cn("inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em]", accentBadgeClass)}>
          {description ?? title}
        </span>
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
      className={cn(
        "w-full rounded-full border bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-sm transition",
        palette,
      )}
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

  const boardColumns = [
    {
      key: "resumo",
      title: "Resumo",
      description: "Acesso rápido aos cadastros",
      icon: <ClipboardList className="h-5 w-5" />,
      accentClass: "bg-red-100 text-red-900",
      iconClass: "bg-red-50 text-red-700",
      content: (
        <div className="space-y-2">
          <CardActionButton onClick={() => setOpenLoa(true)}>LOA</CardActionButton>
          <CardActionButton onClick={() => setOpenCsjt(true)}>CSJT</CardActionButton>
          <CardActionButton onClick={() => setOpenCargosVagos(true)}>CARGOS VAGOS</CardActionButton>
        </div>
      ),
    },
    {
      key: "listas",
      title: "Listas",
      description: "Pendências e ações rápidas",
      icon: <ListChecks className="h-5 w-5" />,
      accentClass: "bg-rose-100 text-rose-900",
      iconClass: "bg-rose-50 text-rose-700",
      content: (
        <>
          <button
            type="button"
            onClick={() => setOpenPendenciasListas(true)}
            className="w-full rounded-2xl border border-red-100 bg-red-50/50 p-3 text-center shadow-sm transition hover:border-red-200 hover:bg-red-100/60"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">Pendentes</p>
            <p className="text-3xl font-semibold text-red-900">{pendingOutrasAprovacoesCount}</p>
            <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-600">Outras aprovações</span>
          </button>
          <div className="space-y-1.5">
            {outrasPreview.length
              ? outrasPreview.map((approval) => (
                  <div key={approval.id} className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-zinc-900">{approval.candidatoNome}</p>
                    <p className="text-xs text-zinc-500">{approval.orgao}</p>
                  </div>
                ))
              : null}
          </div>
          <div className="space-y-2">
            <CardActionButton onClick={() => setOpenAdicionarAprovado(true)}>Adicionar aprovado</CardActionButton>
            <CardActionButton onClick={() => setOpenNomeacoes(true)}>Nova nomeação</CardActionButton>
            <CardActionButton onClick={() => setOpenAprovacaoManual(true)}>Outras aprovações</CardActionButton>
          </div>
        </>
      ),
    },
    {
      key: "tds",
      title: "TDs",
      description: "Fluxo de termos",
      icon: <FileSignature className="h-5 w-5" />,
      accentClass: "bg-amber-100 text-amber-900",
      iconClass: "bg-amber-50 text-amber-700",
      content: (
        <>
          <button
            type="button"
            onClick={() => setOpenPendenciasTds(true)}
            className="w-full rounded-2xl border border-amber-100 bg-amber-50/50 p-3 text-center shadow-sm transition hover:border-amber-200 hover:bg-amber-100/60"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-amber-600">Pendentes</p>
            <p className="text-3xl font-semibold text-amber-900">{pendingTdCount}</p>
            <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">TDs</span>
          </button>
          <div className="space-y-1.5">
            {tdPreview.length
              ? tdPreview.map((td) => (
                  <div key={td.id} className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-zinc-900">{td.candidatoNome}</p>
                    <p className="text-xs text-zinc-500">{td.tipoTd === "ENVIADO" ? "TD enviado" : "Interessado"}</p>
                  </div>
                ))
              : null}
          </div>
          <div className="space-y-2">
            <CardActionButton variant="amber" onClick={() => setOpenEditarTdConteudo(true)}>
              Editar textos
            </CardActionButton>
            <CardActionButton variant="amber" onClick={() => setOpenCadastroTdManual(true)}>
              Adicionar TD
            </CardActionButton>
          </div>
        </>
      ),
    },
    {
      key: "vacancias",
      title: "Vacâncias",
      description: "Comunicações e histórico",
      icon: <Megaphone className="h-5 w-5" />,
      accentClass: "bg-orange-100 text-orange-900",
      iconClass: "bg-orange-50 text-orange-700",
      content: (
        <div className="space-y-2">
          <CardActionButton onClick={() => setOpenNovaVacancia(true)}>Nova vacância</CardActionButton>
          <CardActionButton onClick={() => setOpenHistoricoVacancias(true)}>Histórico</CardActionButton>
        </div>
      ),
    },
    {
      key: "controle",
      title: "Controle",
      description: "Notificações e relatórios",
      icon: <Settings2 className="h-5 w-5" />,
      accentClass: "bg-slate-200 text-slate-900",
      iconClass: "bg-slate-100 text-slate-700",
      content: (
        <div className="space-y-2">
          <CardActionButton onClick={() => setOpenFilaNotificacoes(true)}>Nova notificação</CardActionButton>
          <CardActionButton onClick={() => setOpenRelatorios(true)}>Relatórios</CardActionButton>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] gap-3">
          {boardColumns.map((column) => (
            <DashboardCard
              key={column.key}
              title={column.title}
              description={column.description}
              icon={column.icon}
              accentClass={column.accentClass}
              iconClass={column.iconClass}
            >
              {column.content}
            </DashboardCard>
          ))}
        </div>
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
