import type {
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
} from "./comissao-actions"
import type { createCandidateAction, saveOutraAprovacaoAction } from "@/src/features/listas/listas-actions"

export type ComissaoDashboardActions = {
  moderateOutraAprovacao: typeof moderateOutraAprovacaoAction
  createCandidate: typeof createCandidateAction
  registrarNomeacao: typeof registrarNomeacaoAction
  saveOutraAprovacao: typeof saveOutraAprovacaoAction
  upsertLoa: typeof upsertLoaAction
  upsertCsjtAuthorization: typeof upsertCsjtAuthorizationAction
  upsertCargosVagos: typeof upsertCargosVagosAction
  moderateTdRequest: typeof moderateTdRequestAction
  upsertTdContent: typeof upsertTdContentAction
  createManualTd: typeof createManualTdAction
  upsertVacancia: typeof upsertVacanciaAction
  deleteVacancia: typeof deleteVacanciaAction
  enqueueCustomNotification: typeof enqueueCustomNotificationAction
  retryNotification: typeof retryNotificationAction
  cancelNotification: typeof cancelNotificationAction
  generateExport: typeof generateExportAction
}
