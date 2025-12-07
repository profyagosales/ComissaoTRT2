import type { ComissaoResumoConfig } from "@/features/comissao/comissao-resumo-types"
import { createSupabaseServiceRoleClient } from "@/lib/supabase-service-role"

const COMISSAO_RESUMO_ID = 1

export async function fetchComissaoResumoConfig(): Promise<ComissaoResumoConfig | null> {
  try {
    const serviceClient = createSupabaseServiceRoleClient()
    const { data, error } = await serviceClient
      .from("comissao_resumo")
      .select("*")
      .eq("id", COMISSAO_RESUMO_ID)
      .maybeSingle<ComissaoResumoConfig>()

    if (error) {
      console.error("[fetchComissaoResumoConfig] erro ao buscar configuração", error)
      return null
    }

    return data ?? null
  } catch (error) {
    console.error("[fetchComissaoResumoConfig] exceção inesperada", error)
    return null
  }
}
