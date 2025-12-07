import type { Database } from '@/lib/database.types'

export type ComissaoResumoConfig = Database['public']['Tables']['comissao_resumo']['Row']
export type ComissaoResumoUpdateInput = Database['public']['Tables']['comissao_resumo']['Update']
