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

  const [tdsResult, contentResult] = await Promise.all([
    supabase
      .from("ultimos_tds_view")
      .select(
        "td_request_id, data_aprovacao, tipo_td, observacao, candidate_id, nome_candidato, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base",
      )
      .order("data_aprovacao", { ascending: false }),
    supabase
      .from("td_content_settings")
      .select("content")
      .eq("key", "td_guides")
      .maybeSingle<{ content: TdContentSettings | null }>(),
  ])

  if (tdsResult.error || !tdsResult.data) {
    console.error("Erro ao carregar ultimos_tds_view para /tds", tdsResult.error)
    return { items: [], content: DEFAULT_TD_CONTENT }
  }

  const items: TdItem[] = tdsResult.data.map(row => ({
    td_request_id: String(row.td_request_id),
    data_aprovacao: row.data_aprovacao,
    tipo_td: (row.tipo_td as TdRequestTipo | null) ?? null,
    observacao: row.observacao ?? null,
    candidate_id: row.candidate_id,
    nome_candidato: row.nome_candidato,
    sistema_concorrencia: normalizeSistema(row.sistema_concorrencia),
    classificacao_lista: row.classificacao_lista,
    ordem_nomeacao_base: row.ordem_nomeacao_base,
  }))

  let content: TdContentSettings = DEFAULT_TD_CONTENT
  if (contentResult.data?.content) {
    content = {
      overview: contentResult.data.content.overview || DEFAULT_TD_CONTENT.overview,
      instructions: contentResult.data.content.instructions || DEFAULT_TD_CONTENT.instructions,
      models: Array.isArray(contentResult.data.content.models) && contentResult.data.content.models.length
        ? contentResult.data.content.models.filter((model) => Boolean(model?.label) && Boolean(model?.url))
        : DEFAULT_TD_CONTENT.models,
    }
  } else if (contentResult.error && contentResult.error.code !== "PGRST116") {
    console.error("[loadTdsData] erro ao buscar td_content_settings", contentResult.error)
  }

  return { items, content }
}
