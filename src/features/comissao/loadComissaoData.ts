import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { TdRequestTipo } from "@/features/tds/td-types"

type CandidateInfo = { id: string; nome: string; email: string }

type OutraAprovacaoQueryRow = {
  id: string
  cargo_pretendido: string
  orgao: string
  localidade: string
  status: string
  created_at: string
  candidate: CandidateInfo | CandidateInfo[] | null
}

type TdRequestQueryRow = {
  id: string
  candidate_id: string
  tipo_td: TdRequestTipo | null
  observacao: string | null
  status: string
  created_at: string
  candidate: CandidateInfo | CandidateInfo[] | null
}

function resolveCandidate(candidate: CandidateInfo | CandidateInfo[] | null): CandidateInfo | null {
  if (!candidate) return null
  if (Array.isArray(candidate)) {
    return candidate[0] ?? null
  }
  return candidate
}

function resolveRelation<TValue>(value: TValue | TValue[] | null | undefined): TValue | null {
  if (!value) return null
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value
}

export type PendingOutraAprovacao = {
  id: string
  candidatoNome: string
  candidatoEmail: string
  candidatoId: string
  cargoPretendido: string
  orgao: string
  localidade: string
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
  data: string | null
  data_referencia: string | null
  tribunal: string | null
  cargo: string | null
  motivo: string | null
  tipo: string | null
  nome_servidor: string | null
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
}

export async function loadComissaoData(): Promise<ComissaoDashboardData> {
  const supabase = await createSupabaseServerClient()

  const [
    outrasAprovacoesResult,
    tdRequestsResult,
    loasResult,
    csjtResult,
    cargosVagosResult,
    latestVacanciaResult,
    candidatesResult,
  ] = await Promise.all([
    supabase
      .from("outras_aprovacoes")
      .select(
        `id, cargo_pretendido, orgao, localidade, status, created_at, updated_at, candidate:candidates(id, nome, email)`
      )
      .eq("status", "PENDENTE")
      .order("created_at", { ascending: false }),
    supabase
      .from("td_requests")
      .select(`id, candidate_id, tipo_td, observacao, status, created_at, candidate:candidates(id, nome, email)`)
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
      .select(
        `id, loa_id, data_autorizacao, total_provimentos, observacao, created_at, updated_at, loa:loas(id, ano), destinos:csjt_autorizacoes_destinos(id, tribunal, cargo, quantidade)`
      )
      .order("data_autorizacao", { ascending: false })
      .limit(5),
    supabase
      .from("cargos_vagos_trt2")
      .select("id, data_referencia, analista_vagos, tecnico_vagos, observacao, fonte_url, created_at, updated_at")
      .order("data_referencia", { ascending: false })
      .limit(5),
    supabase
      .from("vacancias")
      .select("*")
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("candidates")
      .select("id, nome, sistema_concorrencia, classificacao_lista, status_nomeacao, ordem_nomeacao_base")
      .order("ordem_nomeacao_base", { ascending: true })
      .limit(120),
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

  const outrasAprovacoes: PendingOutraAprovacao[] = outrasRows
    .map((item) => {
      const candidate = resolveCandidate(item.candidate)
      if (!candidate) return null
      return {
        id: item.id,
        candidatoNome: candidate.nome,
        candidatoEmail: candidate.email,
        candidatoId: candidate.id,
        cargoPretendido: item.cargo_pretendido,
        orgao: item.orgao,
        localidade: item.localidade,
        status: item.status,
        createdAt: item.created_at,
      }
    })
    .filter((item): item is PendingOutraAprovacao => Boolean(item))

  const tdRows = (tdRequestsResult.data ?? []) as TdRequestQueryRow[]

  const tdRequests: PendingTdRequest[] = tdRows
    .map((item) => {
      const candidate = resolveCandidate(item.candidate)
      if (!candidate) return null
      return {
        id: item.id,
        candidatoId: candidate.id,
        candidatoNome: candidate.nome,
        candidatoEmail: candidate.email,
        tipoTd: item.tipo_td ?? "INTERESSE",
        observacao: item.observacao,
        status: item.status,
        createdAt: item.created_at,
      }
    })
    .filter((item): item is PendingTdRequest => Boolean(item))

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

  const loasHistory: LoaHistoryRecord[] = (loasResult.data ?? []).map((row) => ({
    id: row.id,
    ano: row.ano,
    totalPrevisto: row.total_previsto,
    status: row.status,
    descricao: row.descricao ?? null,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  }))

  const csjtAuthorizationsHistory: CsjtAuthorizationRecord[] = (csjtResult.data ?? []).map((row) => {
    const destinos = row.destinos ?? []
    const relatedLoa = resolveRelation(row.loa)
    return {
      id: row.id,
      loaId: row.loa_id ?? relatedLoa?.id ?? null,
      dataAutorizacao: row.data_autorizacao,
      totalProvimentos: row.total_provimentos,
      observacao: row.observacao ?? null,
      loaAno: relatedLoa?.ano ?? null,
      destinos: destinos.map((destino) => ({
        tribunal: destino.tribunal,
        cargo: destino.cargo,
        quantidade: destino.quantidade,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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
    updatedAt: row.updated_at,
  }))

  const latestLoa: LatestLoa | null = loasHistory[0] ?? null
  const latestCsjtAuthorization: LatestCsjtAuthorization | null = csjtAuthorizationsHistory[0] ?? null
  const latestCargosVagos: LatestCargosVagos | null = cargosVagosHistory[0] ?? null

  let latestVacancia: LatestVacancia | null = null
  if (latestVacanciaResult.data) {
    const row = latestVacanciaResult.data as VacanciaRow
    latestVacancia = {
      id: row.id,
      data: row.data ?? row.data_referencia ?? null,
      tribunal: row.tribunal ?? null,
      cargo: row.cargo ?? null,
      motivo: row.motivo ?? null,
      tipo: row.tipo ?? null,
      nomeServidor: row.nome_servidor ?? null,
    }
  } else if (latestVacanciaResult.error && latestVacanciaResult.error.code !== "PGRST116") {
    // PGRST116 => no rows
    console.error("[loadComissaoData] erro ao buscar vacâncias", latestVacanciaResult.error)
  }

  const candidates: CandidateSummary[] = (candidatesResult.data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    sistemaConcorrencia: row.sistema_concorrencia,
    classificacaoLista: row.classificacao_lista,
    statusNomeacao: row.status_nomeacao,
    ordemNomeacao: row.ordem_nomeacao_base,
  }))

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
  }
}
