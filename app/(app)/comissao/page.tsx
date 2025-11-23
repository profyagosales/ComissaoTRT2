import { redirect } from "next/navigation"

import { ComissaoDashboard } from "@/src/features/comissao/ComissaoDashboard"
import { loadComissaoData } from "@/src/features/comissao/loadComissaoData"
import {
  cancelNotificationAction,
  createManualTdAction,
  deleteVacanciaAction,
  enqueueCustomNotificationAction,
  generateExportAction,
  moderateOutraAprovacaoAction,
  moderateTdRequestAction,
  registrarNomeacaoAction,
  retryNotificationAction,
  upsertCargosVagosAction,
  upsertCsjtAuthorizationAction,
  upsertLoaAction,
  upsertTdContentAction,
  upsertVacanciaAction,
} from "@/src/features/comissao/comissao-actions"
import { createCandidateAction, saveOutraAprovacaoAction } from "@/src/features/listas/listas-actions"
import { createSupabaseServerClient } from "@/src/lib/supabase-server"

export default async function ComissaoPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/comissao")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "COMISSAO") {
    redirect("/resumo")
  }

  const data = await loadComissaoData()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-red-900/70">Fluxo operacional</p>
        <h1 className="text-3xl font-semibold text-red-950">Kanban da Comissão</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Centralize LOA, listas, TDs, vacâncias e notificações diretamente nos cinco cards abaixo. Todas as ações atualizam as demais abas em tempo real.
        </p>
      </div>

      <ComissaoDashboard
        data={data}
        actions={{
          moderateOutraAprovacao: moderateOutraAprovacaoAction,
          createCandidate: createCandidateAction,
          registrarNomeacao: registrarNomeacaoAction,
          saveOutraAprovacao: saveOutraAprovacaoAction,
          upsertLoa: upsertLoaAction,
          upsertCsjtAuthorization: upsertCsjtAuthorizationAction,
          upsertCargosVagos: upsertCargosVagosAction,
          moderateTdRequest: moderateTdRequestAction,
          upsertTdContent: upsertTdContentAction,
          createManualTd: createManualTdAction,
          upsertVacancia: upsertVacanciaAction,
          deleteVacancia: deleteVacanciaAction,
          enqueueCustomNotification: enqueueCustomNotificationAction,
          retryNotification: retryNotificationAction,
          cancelNotification: cancelNotificationAction,
          generateExport: generateExportAction,
        }}
      />
    </div>
  )
}
