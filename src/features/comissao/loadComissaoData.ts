import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { TdRequestTipo } from "@/features/tds/td-types"
import { DEFAULT_TD_CONTENT, type TdContentSettings } from "@/features/tds/td-content"

type OutraAprovacaoQueryRow = {
  id: string
  candidate_id: string
  cargo: string
  orgao: string
  status: string
  created_at: string
}

type TdRequestQueryRow = {
  id: string
  candidate_id: string
  tipo_td: TdRequestTipo | null
  observacao: string | null
  status: string
  created_at: string
}

type CsjtAuthorizationRow = {
  id: string
  loa_id: string | null
  data_autorizacao: string
  total_provimentos: number
  observacao: string | null
  created_at: string
}

type CsjtDestinoRow = {
  csjt_autorizacao_id: string
  tribunal: string
  cargo: string | null
  quantidade: number
}

type LoaAnoRow = {
  id: string
  ano: number
}

export type PendingOutraAprovacao = {
  id: string
  candidatoNome: string
  candidatoEmail: string
  candidatoId: string
  cargoPretendido: string
  orgao: string
  status: string
  createdAt: string
}

export type PendingTdRequest = {
  id: string
  candidatoId: string
  candidatoNome: string
  candidatoEmail: string
  tipoTd: TdRequestTipo
  observacao: string | null
  status: string
  createdAt: string
}

export type LatestLoa = {
  id: string
  ano: number
  totalPrevisto: number
  status: string
  descricao: string | null
  updatedAt: string
}

export type LoaHistoryRecord = LatestLoa & {
  createdAt: string
}

export type LatestCsjtAuthorization = {
  id: string
  dataAutorizacao: string
  totalProvimentos: number
  observacao: string | null
  loaAno: number | null
  destinos: { tribunal: string; cargo: string; quantidade: number }[]
}

export type CsjtAuthorizationRecord = LatestCsjtAuthorization & {
  loaId: string | null
  createdAt: string
  updatedAt: string | null
}

export type LatestCargosVagos = {
  id: string
  dataReferencia: string
  analistaVagos: number
  tecnicoVagos: number
  observacao: string | null
  fonteUrl: string | null
}

export type CargosVagosRecord = LatestCargosVagos & {
  createdAt: string
  updatedAt: string | null
}

export type LatestVacancia = {
  id: string
  data: string | null
  tribunal: string | null
  cargo: string | null
  motivo: string | null
  tipo: string | null
  nomeServidor: string | null
}

type VacanciaRow = {
  id: string
  created_at: string
  updated_at: string | null
  [key: string]: string | number | null | undefined
}

type NotificationQueueRow = {
  id: string
  titulo: string
  corpo: string
  tipo: string | null
  visivel_para: string | null
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  scheduled_for: string | null
  sent_at: string | null
  error_message: string | null
}


export type CandidateSummary = {
  id: string
  nome: string
  sistemaConcorrencia: string
  classificacaoLista: number | null
  statusNomeacao: string | null
  ordemNomeacao: number | null
}

export type ComissaoDashboardData = {
  outrasAprovacoes: PendingOutraAprovacao[]
  tdRequests: PendingTdRequest[]
  pendingOutrasAprovacoesCount: number
  pendingTdCount: number
  latestLoa: LatestLoa | null
  latestCsjtAuthorization: LatestCsjtAuthorization | null
  latestCargosVagos: LatestCargosVagos | null
  latestVacancia: LatestVacancia | null
  loasHistory: LoaHistoryRecord[]
  csjtAuthorizationsHistory: CsjtAuthorizationRecord[]
  cargosVagosHistory: CargosVagosRecord[]
  candidates: CandidateSummary[]
  vacanciasHistory: VacanciaRecord[]
  notificationsQueue: NotificationQueueItem[]
  tdContent: TdContentSettings
}

export type VacanciaRecord = {
  id: string
  data: string | null
  tribunal: string | null
  cargo: string | null
  motivo: string | null
  tipo: string | null
  nomeServidor: string | null
  douLink: string | null
  observacao: string | null
  createdAt: string
  updatedAt: string | null
}

export type NotificationQueueItem = {
  id: string
  titulo: string
  corpo: string
  tipo: string | null
  visivelPara: string | null
  status: string
  metadata: Record<string, unknown> | null
  createdAt: string
  scheduledFor: string | null
  sentAt: string | null
  errorMessage: string | null
}

export async function loadComissaoData(): Promise<ComissaoDashboardData> {
  const supabase = await createSupabaseServerClient()

  const [
    outrasAprovacoesResult,
    tdRequestsResult,
    loasResult,
    csjtResult,
    cargosVagosResult,
    vacanciasHistoryResult,
    candidatesResult,
    tdContentResult,
    notificationsQueueResult,
  ] = await Promise.all([
    supabase
      .from("outras_aprovacoes")
      .select(
        "id, candidate_id, cargo, orgao, status, created_at"
      )
      .eq("status", "PENDENTE")
      .order("created_at", { ascending: false }),
    supabase
      .from("td_requests")
      .select("id, candidate_id, tipo_td, observacao, status, created_at")
      .eq("status", "PENDENTE")
      .order("created_at", { ascending: false }),
    supabase
      .from("loas")
      .select("id, ano, total_previsto, status, descricao, created_at, updated_at")
      .order("ano", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("csjt_autorizacoes")
      .select("id, loa_id, data_autorizacao, total_provimentos, observacao, created_at")
      .order("data_autorizacao", { ascending: false })
      .limit(5),
    supabase
      .from("cargos_vagos_trt2")
      .select("id, data_referencia, analista_vagos, tecnico_vagos, observacao, fonte_url, created_at")
      .order("data_referencia", { ascending: false })
      .limit(5),
    supabase
      .from("vacancias")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("candidates")
      .select("id, nome, sistema_concorrencia, classificacao_lista, status_nomeacao, ordem_nomeacao_base")
      .order("ordem_nomeacao_base", { ascending: true })
      .limit(200),
    supabase
      .from("td_content_settings")
      .select("content")
      .eq("key", "td_guides")
      .maybeSingle<{ content: TdContentSettings | null }>(),
    supabase
      .from("notifications_queue")
      .select("id, titulo, corpo, tipo, visivel_para, status, metadata, created_at, scheduled_for, sent_at, error_message")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  if (outrasAprovacoesResult.error) {
    console.error("[loadComissaoData] erro ao buscar outras aprovações", outrasAprovacoesResult.error)
    throw new Error("Não foi possível carregar outras aprovações pendentes.")
  }

  if (tdRequestsResult.error) {
    console.error("[loadComissaoData] erro ao buscar TDs", tdRequestsResult.error)
    throw new Error("Não foi possível carregar solicitações de TD pendentes.")
  }

  const outrasRows = (outrasAprovacoesResult.data ?? []) as OutraAprovacaoQueryRow[]

  const tdRows = (tdRequestsResult.data ?? []) as TdRequestQueryRow[]

  const csjtRows = (csjtResult.data ?? []) as CsjtAuthorizationRow[]

  if (loasResult.error) {
    console.error("[loadComissaoData] erro ao buscar LOAs", loasResult.error)
    throw new Error("Não foi possível carregar as LOAs cadastradas.")
  }

  if (csjtResult.error) {
    console.error("[loadComissaoData] erro ao buscar autorizações CSJT", csjtResult.error)
    throw new Error("Não foi possível carregar autorizações do CSJT.")
  }

  if (cargosVagosResult.error) {
    console.error("[loadComissaoData] erro ao buscar cargos vagos", cargosVagosResult.error)
    throw new Error("Não foi possível carregar os registros de cargos vagos.")
  }

  if (candidatesResult.error) {
    console.error("[loadComissaoData] erro ao buscar candidatos", candidatesResult.error)
    throw new Error("Não foi possível carregar os candidatos.")
  }

  const candidateSummaries: CandidateSummary[] = (candidatesResult.data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    sistemaConcorrencia: row.sistema_concorrencia,
    classificacaoLista: row.classificacao_lista,
    statusNomeacao: row.status_nomeacao,
    ordemNomeacao: row.ordem_nomeacao_base,
  }))

  const candidateMap = new Map(candidateSummaries.map((candidate) => [candidate.id, candidate]))

  const pendingCandidateIds = new Set<string>()
  outrasRows.forEach((row) => pendingCandidateIds.add(row.candidate_id))
  tdRows.forEach((row) => pendingCandidateIds.add(row.candidate_id))

  const missingCandidateIds = Array.from(pendingCandidateIds).filter((id) => !candidateMap.has(id))

  if (missingCandidateIds.length) {
    const { data: missingCandidates, error: missingCandidatesError } = await supabase
      .from("candidates")
      .select("id, nome, sistema_concorrencia, classificacao_lista, status_nomeacao, ordem_nomeacao_base")
      .in("id", missingCandidateIds)

    if (missingCandidatesError) {
      console.error("[loadComissaoData] erro ao buscar candidatos complementares", missingCandidatesError)
    } else {
      missingCandidates?.forEach((row) => {
        const summary: CandidateSummary = {
          id: row.id,
          nome: row.nome,
          sistemaConcorrencia: row.sistema_concorrencia,
          classificacaoLista: row.classificacao_lista,
          statusNomeacao: row.status_nomeacao,
          ordemNomeacao: row.ordem_nomeacao_base,
        }
        candidateSummaries.push(summary)
        candidateMap.set(summary.id, summary)
      })
    }
  }

  const outrasAprovacoes: PendingOutraAprovacao[] = outrasRows
    .map((item) => {
      const candidate = candidateMap.get(item.candidate_id)
      if (!candidate) return null
      return {
        id: item.id,
        candidatoNome: candidate.nome,
        candidatoEmail: "",
        candidatoId: candidate.id,
        cargoPretendido: item.cargo,
        orgao: item.orgao,
        status: item.status,
        createdAt: item.created_at,
      }
    })
    .filter((item): item is PendingOutraAprovacao => Boolean(item))

  const tdRequests: PendingTdRequest[] = tdRows
    .map((item) => {
      const candidate = candidateMap.get(item.candidate_id)
      if (!candidate) return null
      return {
        id: item.id,
        candidatoId: candidate.id,
        candidatoNome: candidate.nome,
        candidatoEmail: "",
        tipoTd: item.tipo_td ?? "INTERESSE",
        observacao: item.observacao,
        status: item.status,
        createdAt: item.created_at,
      }
    })
    .filter((item): item is PendingTdRequest => Boolean(item))

  const loasHistory: LoaHistoryRecord[] = (loasResult.data ?? []).map((row) => ({
    id: row.id,
    ano: row.ano,
    totalPrevisto: row.total_previsto,
    status: row.status,
    descricao: row.descricao ?? null,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  }))

  const csjtDestinosMap = new Map<string, CsjtDestinoRow[]>()
  if (csjtRows.length) {
    const csjtIds = csjtRows.map((row) => row.id)
    const { data: destinosData, error: destinosError } = await supabase
      .from("csjt_autorizacoes_destinos")
      .select("csjt_autorizacao_id, tribunal, cargo, quantidade")
      .in("csjt_autorizacao_id", csjtIds)

    if (destinosError) {
      console.error("[loadComissaoData] erro ao buscar destinos CSJT", destinosError)
    } else {
      const destinoRows = (destinosData ?? []) as CsjtDestinoRow[]
      destinoRows.forEach((row) => {
        const existing = csjtDestinosMap.get(row.csjt_autorizacao_id) ?? []
        existing.push(row)
        csjtDestinosMap.set(row.csjt_autorizacao_id, existing)
      })
    }
  }

  const loaMap = new Map<string, { ano: number }>()
  loasHistory.forEach((row) => {
    loaMap.set(row.id, { ano: row.ano })
  })

  const loaIdsFromCsjt = Array.from(
    new Set(
      csjtRows
        .map((row) => row.loa_id)
        .filter((value): value is string => Boolean(value) && !loaMap.has(value))
    )
  )

  if (loaIdsFromCsjt.length) {
    const { data: missingLoas, error: missingLoasError } = await supabase
      .from("loas")
      .select("id, ano")
      .in("id", loaIdsFromCsjt)

    if (missingLoasError) {
      console.error("[loadComissaoData] erro ao buscar LOAs complementares", missingLoasError)
    } else {
      const loaRows = (missingLoas ?? []) as LoaAnoRow[]
      loaRows.forEach((row) => {
        loaMap.set(row.id, { ano: row.ano })
      })
    }
  }

  const csjtAuthorizationsHistory: CsjtAuthorizationRecord[] = csjtRows.map((row) => {
    const destinos = csjtDestinosMap.get(row.id) ?? []
    const loaInfo = row.loa_id ? loaMap.get(row.loa_id) : null
    return {
      id: row.id,
      loaId: row.loa_id ?? null,
      dataAutorizacao: row.data_autorizacao,
      totalProvimentos: row.total_provimentos,
      observacao: row.observacao ?? null,
      loaAno: loaInfo?.ano ?? null,
      destinos: destinos.map((destino) => ({
        tribunal: destino.tribunal,
        cargo: destino.cargo ?? "—",
        quantidade: destino.quantidade,
      })),
      createdAt: row.created_at,
      updatedAt: null,
    }
  })

  const cargosVagosHistory: CargosVagosRecord[] = (cargosVagosResult.data ?? []).map((row) => ({
    id: row.id,
    dataReferencia: row.data_referencia,
    analistaVagos: row.analista_vagos,
    tecnicoVagos: row.tecnico_vagos,
    observacao: row.observacao ?? null,
    fonteUrl: row.fonte_url ?? null,
    createdAt: row.created_at,
    updatedAt: null,
  }))

  if (vacanciasHistoryResult.error) {
    console.error("[loadComissaoData] erro ao buscar vacâncias", vacanciasHistoryResult.error)
    throw new Error("Não foi possível carregar as vacâncias cadastradas.")
  }

  const vacanciasRows: VacanciaRow[] = (vacanciasHistoryResult.data ?? []) as VacanciaRow[]

  const readString = (row: VacanciaRow, keys: string[]): string | null => {
    for (const key of keys) {
      const value = row[key]
      if (typeof value === "string" && value.length) return value
    }
    return null
  }

  const vacanciasHistory: VacanciaRecord[] = vacanciasRows.map((row: VacanciaRow) => ({
    id: row.id,
    data: readString(row, ["data", "data_vacancia", "data_evento", "data_publicacao"]) ?? row.created_at ?? null,
    tribunal: readString(row, ["tribunal", "local", "unidade"]),
    cargo: readString(row, ["cargo", "cargo_afetado"]),
    motivo: readString(row, ["motivo", "motivo_saida"]),
    tipo: readString(row, ["tipo", "tipo_evento"]),
    nomeServidor: readString(row, ["nome_servidor", "servidor", "nome"]),
    douLink: readString(row, ["dou_link", "link", "fonte_url"]),
    observacao: readString(row, ["observacao", "observacoes", "detalhes"]),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  }))

  const latestLoa: LatestLoa | null = loasHistory[0] ?? null
  const latestCsjtAuthorization: LatestCsjtAuthorization | null = csjtAuthorizationsHistory[0] ?? null
  const latestCargosVagos: LatestCargosVagos | null = cargosVagosHistory[0] ?? null
  const latestVacancia: LatestVacancia | null = vacanciasHistory[0]
    ? {
        id: vacanciasHistory[0].id,
        data: vacanciasHistory[0].data,
        tribunal: vacanciasHistory[0].tribunal,
        cargo: vacanciasHistory[0].cargo,
        motivo: vacanciasHistory[0].motivo,
        tipo: vacanciasHistory[0].tipo,
        nomeServidor: vacanciasHistory[0].nomeServidor,
      }
    : null

  const candidates = candidateSummaries
  let tdContent: TdContentSettings = DEFAULT_TD_CONTENT
  if (tdContentResult.data?.content) {
    tdContent = {
      overview: tdContentResult.data.content.overview || DEFAULT_TD_CONTENT.overview,
      instructions: tdContentResult.data.content.instructions || DEFAULT_TD_CONTENT.instructions,
      models: Array.isArray(tdContentResult.data.content.models) && tdContentResult.data.content.models.length
        ? tdContentResult.data.content.models.filter((model) => Boolean(model?.label) && Boolean(model?.url))
        : DEFAULT_TD_CONTENT.models,
    }
  } else if (tdContentResult.error && tdContentResult.error.code !== "PGRST116") {
    console.error("[loadComissaoData] erro ao buscar td_content_settings", tdContentResult.error)
  }

  const notificationsQueue: NotificationQueueItem[] = (notificationsQueueResult.data ?? []).map((row: NotificationQueueRow) => ({
    id: row.id,
    titulo: row.titulo,
    corpo: row.corpo,
    tipo: row.tipo,
    visivelPara: row.visivel_para,
    status: row.status,
    metadata: row.metadata ?? null,
    createdAt: row.created_at,
    scheduledFor: row.scheduled_for,
    sentAt: row.sent_at,
    errorMessage: row.error_message,
  }))

  if (notificationsQueueResult.error && notificationsQueueResult.error.code !== "PGRST116") {
    console.error("[loadComissaoData] erro ao buscar notifications_queue", notificationsQueueResult.error)
  }

  return {
    outrasAprovacoes,
    tdRequests,
    pendingOutrasAprovacoesCount: outrasAprovacoes.length,
    pendingTdCount: tdRequests.length,
    latestLoa,
    latestCsjtAuthorization,
    latestCargosVagos,
    latestVacancia,
    loasHistory,
    csjtAuthorizationsHistory,
    cargosVagosHistory,
    candidates,
    vacanciasHistory,
    notificationsQueue,
    tdContent,
  }
}
