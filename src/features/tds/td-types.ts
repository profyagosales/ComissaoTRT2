export const TD_REQUEST_TIPOS = ["INTERESSE", "ENVIADO"] as const
export type TdRequestTipo = (typeof TD_REQUEST_TIPOS)[number]

export const TD_REQUEST_STATUSES = ["PENDENTE", "APROVADO", "REJEITADO"] as const
export type TdRequestStatus = (typeof TD_REQUEST_STATUSES)[number]

export const CANDIDATE_TD_STATUS = ["SIM", "TALVEZ"] as const
export type CandidateTdStatus = (typeof CANDIDATE_TD_STATUS)[number] | null

export function mapTipoTdToCandidateStatus(tipo: TdRequestTipo): Exclude<CandidateTdStatus, null> {
  return tipo === "ENVIADO" ? "SIM" : "TALVEZ"
}
