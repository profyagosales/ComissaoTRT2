"use client"

import type { ReactNode } from "react"
import { ClipboardList, FileSignature, ListChecks, Megaphone, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ComissaoDashboardData } from "./loadComissaoData"
import { ResumoCardActions } from "./ResumoCardModals"
import { ListasCardActions } from "./ListasCardModals"

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

function PlaceholderButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled
      className="w-full justify-center rounded-full border-dashed border-red-200 text-xs font-semibold text-red-600"
    >
      {label}
    </Button>
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
    latestVacancia,
    outrasAprovacoes,
    tdRequests,
    loasHistory,
    csjtAuthorizationsHistory,
    cargosVagosHistory,
    candidates,
  } = data

  const outrasPreview = outrasAprovacoes.slice(0, 3)
  const tdPreview = tdRequests.slice(0, 3)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none bg-gradient-to-br from-red-900 via-red-700 to-red-600 text-white">
          <CardContent className="flex flex-col gap-3 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-red-100">Pendências</p>
            <h2 className="text-3xl font-semibold">{pendingOutrasAprovacoesCount + pendingTdCount}</h2>
            <p className="text-sm text-red-100">Itens aguardando despacho da Comissão.</p>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-red-100">Outras aprovações</p>
                <p className="text-xl font-semibold">{pendingOutrasAprovacoesCount}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-red-100">TDs</p>
                <p className="text-xl font-semibold">{pendingTdCount}</p>
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
            <div className="text-xs text-zinc-500">
              <p>
                CSJT: {latestCsjtAuthorization ? `${latestCsjtAuthorization.totalProvimentos} vagas autorizadas em ${formatDate(latestCsjtAuthorization.dataAutorizacao)}` : "Nenhuma autorização registrada"}
              </p>
              <p>Cargos vagos TRT-2: {latestCargosVagos ? `${latestCargosVagos.analistaVagos} AJ / ${latestCargosVagos.tecnicoVagos} TJ` : "Sem dados"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <DashboardCard title="Resumo" description="LOA, CSJT e cargos vagos em um só lugar." icon={<ClipboardList className="h-5 w-5" />}>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 text-sm">
            <p className="font-semibold text-zinc-800">LOA atual</p>
            <p className="text-zinc-600">{latestLoa ? `Ano ${latestLoa.ano} · ${latestLoa.totalPrevisto} provimentos previstos` : "Nenhum registro."}</p>
            <p className="text-xs text-zinc-400">Atualizado em {formatDate(latestLoa?.updatedAt)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 text-sm">
            <p className="font-semibold text-zinc-800">Última autorização do CSJT</p>
            <p className="text-zinc-600">
              {latestCsjtAuthorization
                ? `${latestCsjtAuthorization.totalProvimentos} vagas em ${formatDate(latestCsjtAuthorization.dataAutorizacao)}`
                : "Sem autorizações cadastradas."}
            </p>
          </div>
          <ResumoCardActions loas={loasHistory} csjtAuthorizations={csjtAuthorizationsHistory} cargosVagos={cargosVagosHistory} />
        </DashboardCard>

        <DashboardCard title="Listas" description="Controle de aprovados, nomeações e pendências." icon={<ListChecks className="h-5 w-5" />}>
          <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Pendências</p>
              <p className="text-2xl font-semibold text-zinc-900">{pendingOutrasAprovacoesCount}</p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">Outras aprovações</span>
          </div>
          <div className="space-y-2 text-sm">
            {outrasPreview.length ? (
              outrasPreview.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-3 py-2">
                  <span className="font-medium text-zinc-800">{approval.candidatoNome}</span>
                  <span className="text-xs text-zinc-500">{approval.orgao}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Sem envios recentes.</p>
            )}
          </div>
          <ListasCardActions pending={outrasAprovacoes} candidates={candidates} />
        </DashboardCard>

        <DashboardCard title="TDs" description="Solicitações e textos de referência." icon={<FileSignature className="h-5 w-5" />}>
          <div className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Pendentes</p>
              <p className="text-2xl font-semibold text-zinc-900">{pendingTdCount}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">TDs</span>
          </div>
          <div className="space-y-2 text-sm">
            {tdPreview.length ? (
              tdPreview.map((request) => (
                <div key={request.id} className="rounded-xl border border-zinc-100 bg-white px-3 py-2">
                  <p className="font-medium text-zinc-800">{request.candidatoNome}</p>
                  <p className="text-xs text-zinc-500">{request.tipoTd === "ENVIADO" ? "TD enviado" : "Interessado"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Nenhum TD pendente.</p>
            )}
          </div>
          <div className="grid gap-2">
            <PlaceholderButton label="Pendentes" />
            <PlaceholderButton label="Alterar texto" />
            <PlaceholderButton label="Cadastrar TD manual" />
          </div>
        </DashboardCard>

        <DashboardCard title="Vacâncias" description="Controle das saídas e impactos." icon={<Megaphone className="h-5 w-5" />}>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 text-sm">
            {latestVacancia ? (
              <>
                <p className="font-semibold text-zinc-800">{latestVacancia.cargo ?? "Cargo"}</p>
                <p className="text-zinc-600">Motivo: {latestVacancia.motivo ?? "—"}</p>
                <p className="text-xs text-zinc-400">Data: {formatDate(latestVacancia.data)}</p>
              </>
            ) : (
              <p className="text-zinc-600">Nenhuma vacância registrada ainda.</p>
            )}
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <PlaceholderButton label="Nova vacância" />
            <PlaceholderButton label="Editar vacâncias" />
          </div>
        </DashboardCard>

        <DashboardCard title="Controle" description="Notificações e relatórios." icon={<Settings2 className="h-5 w-5" />}>
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/70 p-4 text-sm text-zinc-600">
            Configure a fila de notificações e gere relatórios completos do concurso.
          </div>
          <div className="grid gap-2">
            <PlaceholderButton label="Fila de notificações" />
            <PlaceholderButton label="Gerar relatórios" />
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}
