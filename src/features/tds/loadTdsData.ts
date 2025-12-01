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

function normalizeTipoTd(value: string | null): TdRequestTipo | null {
  if (!value) return null
  const normalized = value.trim().toUpperCase()
  if (normalized === "ENVIADO" || normalized === "ENVIADOS" || normalized === "TD_ENVIADO") return "ENVIADO"
  if (
    normalized === "INTERESSE" ||
    normalized === "TALVEZ" ||
    normalized === "INTERESSADO" ||
    normalized === "TD_POSSIVEL" ||
    normalized === "TD_INTERESSE"
  ) {
    return "INTERESSE"
  }
  return null
}

async function fetchApprovedTdItems(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<TdItem[]> {
  const { data, error } = await supabase
    .from("ultimos_tds_view")
    .select(
      "td_request_id, data_aprovacao, tipo_td, observacao, candidate_id, nome_candidato, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base",
      { count: "exact" },
    )
    .order("data_aprovacao", { ascending: false })
    .limit(200)

  if (error || !data) {
    console.error("[loadTdsData] erro ao buscar ultimos_tds_view", error)
    return []
  }

  console.log("[loadTdsData] raw rows from ultimos_tds_view", data.length, data.slice(0, 5))

  const items = data
    .map((row) => {
      const normalizedTipo = normalizeTipoTd((row as { tipo_td?: string | null }).tipo_td ?? null)
      return {
        td_request_id: String(row.td_request_id),
        data_aprovacao: row.data_aprovacao,
        tipo_td: normalizedTipo,
        observacao: row.observacao ?? null,
        candidate_id: String(row.candidate_id),
        nome_candidato: row.nome_candidato ?? "Aprovado sem nome",
        avatar_url: null, // candidatos não possuem avatar registrado na view
        sistema_concorrencia: normalizeSistema(row.sistema_concorrencia ?? null),
        classificacao_lista: row.classificacao_lista,
        ordem_nomeacao_base: row.ordem_nomeacao_base,
      }
    })
    .filter((item) => item.tipo_td !== null)

  console.log("[loadTdsData] mapped items", items.length, items.slice(0, 3))

  return items
}
