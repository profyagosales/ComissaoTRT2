import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { SistemaConcorrencia } from "@/features/listas/listas-actions"
import type { TdRequestTipo } from "./td-types"

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
}

function normalizeSistema(value: string | null): SistemaConcorrencia {
  if (value === "AC" || value === "PCD" || value === "PPP") return value
  if (value === "IND" || value === "INDIGENA") return "IND"
  return "AC"
}

export async function loadTdsData(): Promise<TdsData> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("ultimos_tds_view")
    .select(
      "td_request_id, data_aprovacao, tipo_td, observacao, candidate_id, nome_candidato, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base",
    )
    .order("data_aprovacao", { ascending: false })

  if (error || !data) {
    console.error("Erro ao carregar ultimos_tds_view para /tds", error)
    return { items: [] }
  }

  const items: TdItem[] = data.map(row => ({
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

  return { items }
}
