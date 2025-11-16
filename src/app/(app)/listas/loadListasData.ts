import { createSupabaseServerClient } from '@/lib/supabase-server'

export type SistemaConcorrencia = 'AC' | 'PCD' | 'PPP' | 'INDIGENA'

export type CandidateListRow = {
  id: string
  nome: string
  sistema_concorrencia: SistemaConcorrencia
  classificacao_lista: number | null
  ordem_nomeacao_base: number | null
  status_nomeacao: string | null
  td_status: string | null
  td_observacao: string | null
  outras_aprovacoes_count: number
}

export type ListasData = {
  geral: CandidateListRow[]
  ac: CandidateListRow[]
  pcd: CandidateListRow[]
  ppp: CandidateListRow[]
  indigena: CandidateListRow[]
}

export async function loadListasData(): Promise<ListasData> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('candidates')
    .select(
      'id, nome, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base, status_nomeacao, td_status, td_observacao',
    )
    .order('ordem_nomeacao_base', { ascending: true })

  if (error) {
    console.error('Erro ao carregar candidates para /listas:', error)
    return {
      geral: [],
      ac: [],
      pcd: [],
      ppp: [],
      indigena: [],
    }
  }

  const base: CandidateListRow[] =
    data?.map(row => ({
      id: row.id,
      nome: row.nome,
      sistema_concorrencia: row.sistema_concorrencia as SistemaConcorrencia,
      classificacao_lista: row.classificacao_lista,
      ordem_nomeacao_base: row.ordem_nomeacao_base,
      status_nomeacao: row.status_nomeacao,
      td_status: row.td_status,
      td_observacao: row.td_observacao,
      outras_aprovacoes_count: 0,
    })) ?? []

  return {
    geral: base,
    ac: base.filter(candidate => candidate.sistema_concorrencia === 'AC'),
    pcd: base.filter(candidate => candidate.sistema_concorrencia === 'PCD'),
    ppp: base.filter(candidate => candidate.sistema_concorrencia === 'PPP'),
    indigena: base.filter(candidate => candidate.sistema_concorrencia === 'INDIGENA'),
  }
}
