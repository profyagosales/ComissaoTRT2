import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { TdRequestTipo } from "@/features/tds/td-types"

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
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("candidates")
      .select("id, nome, sistema_concorrencia, classificacao_lista, status_nomeacao, ordem_nomeacao_base")
      .order("ordem_nomeacao_base", { ascending: true })
      .limit(200),
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

  const candidates = candidateSummaries

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
