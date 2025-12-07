export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      comissao_resumo: {
        Row: {
          id: number
          logo_url: string | null
          logo_storage_path: string | null
          homologado_em: string | null
          valido_ate: string | null
          foi_prorrogado: boolean
          prorrogado_em: string | null
          valido_ate_prorrogado: string | null
          instagram_url: string | null
          email_comissao: string | null
          grupo_aprovados_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          logo_url?: string | null
          logo_storage_path?: string | null
          homologado_em?: string | null
          valido_ate?: string | null
          foi_prorrogado?: boolean
          prorrogado_em?: string | null
          valido_ate_prorrogado?: string | null
          instagram_url?: string | null
          email_comissao?: string | null
          grupo_aprovados_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          logo_url?: string | null
          logo_storage_path?: string | null
          homologado_em?: string | null
          valido_ate?: string | null
          foi_prorrogado?: boolean
          prorrogado_em?: string | null
          valido_ate_prorrogado?: string | null
          instagram_url?: string | null
          email_comissao?: string | null
          grupo_aprovados_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
