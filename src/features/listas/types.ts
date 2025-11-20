import type { SistemaConcorrencia } from './listas-actions'

export type OutraAprovacaoStatus = 'PENDENTE' | 'APROVADO' | 'RECUSADO'

export type CandidateListasProfile = {
  id: string
  nome: string
  sistema_concorrencia: SistemaConcorrencia
  classificacao_lista: number | null
  ordem_nomeacao_base: number | null
  status_nomeacao: 'NOMEADO' | 'AGUARDANDO' | null
  td_status?: 'SIM' | 'TALVEZ' | null
  td_observacao?: string | null
  avatar_url?: string | null
}

export type OutraAprovacaoListItem = {
  id: string
  orgao: string
  cargo: string
  sistema_concorrencia: SistemaConcorrencia
  classificacao: number | null
  pretende_assumir: 'SIM' | 'NAO' | 'TALVEZ'
  ja_foi_nomeado: 'SIM' | 'NAO' | 'EM_ANDAMENTO'
  observacao: string | null
  status: OutraAprovacaoStatus
  created_at?: string | null
  updated_at?: string | null
  approved_at?: string | null
  approved_by?: string | null
}
