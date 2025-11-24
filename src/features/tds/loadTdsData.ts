import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { SistemaConcorrencia } from "@/features/listas/listas-actions"
import type { TdRequestTipo } from "./td-types"
import { DEFAULT_TD_CONTENT, type TdContentSettings } from "./td-content"

export type TdItem = {
  td_request_id: string
  data_aprovacao: string | null
  tipo_td: TdRequestTipo | null
  observacao: string | null
  candidate_id: string
  nome_candidato: string
  sistema_concorrencia: SistemaConcorrencia
  classificacao_lista: number | null
  ordem_nomeacao_base: number | null
  avatar_url: string | null
}

export type TdsData = {
  items: TdItem[]
  content: TdContentSettings
}

function normalizeSistema(value: string | null): SistemaConcorrencia {
  if (value === "AC" || value === "PCD" || value === "PPP") return value
  if (value === "IND" || value === "INDIGENA") return "IND"
  return "AC"
}

export async function loadTdsData(): Promise<TdsData> {
  const supabase = await createSupabaseServerClient()

  const [items, content] = await Promise.all([
    fetchApprovedTdItems(supabase),
    fetchTdContentSettings(supabase),
  ])

  return { items, content }
}

async function fetchTdContentSettings(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<TdContentSettings> {
  const contentResult = await supabase
    .from("td_content_settings")
    .select("content")
    .eq("key", "td_guides")
    .maybeSingle<{ content: TdContentSettings | null }>()

  let content: TdContentSettings = { ...DEFAULT_TD_CONTENT }
  if (contentResult.data?.content) {
    const stored = contentResult.data.content as Record<string, unknown>
    const models = Array.isArray(stored.models)
      ? (stored.models as TdContentSettings["models"]).filter((model) => Boolean(model?.label) && Boolean(model?.url))
      : DEFAULT_TD_CONTENT.models

    content = {
      howItWorksHtml: typeof stored.howItWorksHtml === "string"
        ? stored.howItWorksHtml
        : typeof stored.overview === "string"
          ? stored.overview
          : DEFAULT_TD_CONTENT.howItWorksHtml,
      guidelinesHtml: typeof stored.guidelinesHtml === "string"
        ? stored.guidelinesHtml
        : typeof stored.instructions === "string"
          ? stored.instructions
          : DEFAULT_TD_CONTENT.guidelinesHtml,
      models,
    }
  } else if (contentResult.error && contentResult.error.code !== "PGRST116") {
    console.error("[loadTdsData] erro ao buscar td_content_settings", contentResult.error)
  }

  return content
}

type CandidateRow = {
  id: string
  nome: string
  avatar_url: string | null
  sistema_concorrencia: string | null
  classificacao_lista: number | null
  ordem_nomeacao_base: number | null
}

async function fetchApprovedTdItems(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<TdItem[]> {
  const { data: tdRows, error } = await supabase
    .from("td_requests")
    .select("id, candidate_id, tipo_td, observacao, data_aprovacao, approved_at, created_at")
    .eq("status", "APROVADO")
    .order("data_aprovacao", { ascending: false, nullsFirst: false })
    .order("approved_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[loadTdsData] erro ao buscar td_requests aprovados, tentando fallback", error)
    return fetchLegacyLatestView(supabase)
  }

  if (!tdRows || !tdRows.length) {
    return []
  }

  const candidateIds = Array.from(new Set(tdRows.map((row) => row.candidate_id).filter(Boolean)))
  const candidateMap = new Map<string, CandidateRow>()

  if (candidateIds.length) {
    const { data: candidateRows, error: candidateError } = await supabase
      .from("candidates")
      .select("id, nome, avatar_url, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base")
      .in("id", candidateIds)

    if (candidateError) {
      console.error("[loadTdsData] erro ao buscar candidatos para TDs", candidateError)
    } else {
      (candidateRows ?? []).forEach((candidate) => {
        candidateMap.set(candidate.id, candidate as CandidateRow)
      })
    }
  }

  return tdRows.map((row) => {
    const candidate = candidateMap.get(row.candidate_id)
    return {
      td_request_id: row.id,
      data_aprovacao: row.data_aprovacao ?? row.approved_at ?? row.created_at ?? null,
      tipo_td: (row.tipo_td as TdRequestTipo | null) ?? null,
      observacao: row.observacao ?? null,
      candidate_id: row.candidate_id,
      nome_candidato: candidate?.nome ?? "Aprovado sem nome",
      avatar_url: candidate?.avatar_url ?? null,
      sistema_concorrencia: normalizeSistema(candidate?.sistema_concorrencia ?? null),
      classificacao_lista: candidate?.classificacao_lista ?? null,
      ordem_nomeacao_base: candidate?.ordem_nomeacao_base ?? null,
    }
  })
}

async function fetchLegacyLatestView(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<TdItem[]> {
  const { data, error } = await supabase
    .from("ultimos_tds_view")
    .select(
      "td_request_id, data_aprovacao, tipo_td, observacao, candidate_id, nome_candidato, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base",
    )
    .order("data_aprovacao", { ascending: false })

  if (error || !data) {
    console.error("[loadTdsData] fallback ultimos_tds_view sem sucesso", error)
    return []
  }

  return data.map((row) => ({
    td_request_id: String(row.td_request_id),
    data_aprovacao: row.data_aprovacao,
    tipo_td: (row.tipo_td as TdRequestTipo | null) ?? null,
    observacao: row.observacao ?? null,
    candidate_id: row.candidate_id,
    nome_candidato: row.nome_candidato,
    avatar_url: null,
    sistema_concorrencia: normalizeSistema(row.sistema_concorrencia),
    classificacao_lista: row.classificacao_lista,
    ordem_nomeacao_base: row.ordem_nomeacao_base,
  }))
}
