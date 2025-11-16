import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { SistemaConcorrencia } from './listas-actions'

export type ListaCandidate = {
  id: string
  nome: string
  sistema_concorrencia: SistemaConcorrencia
  classificacao_lista: number | null
  ordem_nomeacao_base: number | null
  status_nomeacao: 'NOMEADO' | 'AGUARDANDO' | null
  td_status: 'SIM' | 'TALVEZ' | null
  td_observacao: string | null
  outras_aprovacoes_resumo?: string | null
  email?: string | null
  telefone?: string | null
  redes_sociais?: string | null
}

export type ListasData = {
  ordem: ListaCandidate[]
  ac: ListaCandidate[]
  pcd: ListaCandidate[]
  ppp: ListaCandidate[]
  ind: ListaCandidate[]
  totals: {
    total: number
    ac: number
    pcd: number
    ppp: number
    ind: number
  }
}

type CandidateRow = {
  id: string
  nome: string
  sistema_concorrencia: string | null
  classificacao_lista: number | null
  ordem_nomeacao_base: number | null
  status_nomeacao: string | null
  td_status: string | null
  td_observacao: string | null
  outras_aprovacoes_resumo?: string | null
}

function emptyListasData(): ListasData {
  return {
    ordem: [],
    ac: [],
    pcd: [],
    ppp: [],
    ind: [],
    totals: {
      total: 0,
      ac: 0,
      pcd: 0,
      ppp: 0,
      ind: 0,
    },
  }
}

function normalizeSistema(value: string | null): SistemaConcorrencia {
  if (value === 'PCD' || value === 'PPP' || value === 'AC') {
    return value
  }
  if (value === 'IND' || value === 'INDIGENA') {
    return 'IND'
  }
  return 'AC'
}

function normalizeStatus(value: string | null): 'NOMEADO' | 'AGUARDANDO' | null {
  if (!value) return null
  if (value === 'NOMEADO' || value === 'AGUARDANDO') {
    return value
  }
  if (value === 'POSSE' || value === 'EM_POSSE') {
    return 'NOMEADO'
  }
  return null
}

function normalizeTdStatus(value: string | null): 'SIM' | 'TALVEZ' | null {
  if (value === 'SIM') return 'SIM'
  if (value === 'TALVEZ' || value === 'PROVAVEL') return 'TALVEZ'
  return null
}

function sortByOrdem(a: ListaCandidate, b: ListaCandidate) {
  const aVal = a.ordem_nomeacao_base ?? Number.MAX_SAFE_INTEGER
  const bVal = b.ordem_nomeacao_base ?? Number.MAX_SAFE_INTEGER
  if (aVal !== bVal) {
    return aVal - bVal
  }
  const classA = a.classificacao_lista ?? Number.MAX_SAFE_INTEGER
  const classB = b.classificacao_lista ?? Number.MAX_SAFE_INTEGER
  return classA - classB
}

export async function loadListasData(): Promise<ListasData> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('candidates')
    .select(
      'id, nome, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base, status_nomeacao, td_status, td_observacao, outras_aprovacoes_resumo',
    )
    .order('ordem_nomeacao_base', { ascending: true })
    .order('classificacao_lista', { ascending: true })

  if (error) {
    console.error('Erro ao carregar candidatos para /listas', error)
    return emptyListasData()
  }

  const base: ListaCandidate[] = (data as CandidateRow[]).map(row => {
    const sistema = normalizeSistema(row.sistema_concorrencia)
    return {
      id: row.id,
      nome: row.nome,
      sistema_concorrencia: sistema,
      classificacao_lista: row.classificacao_lista,
      ordem_nomeacao_base: row.ordem_nomeacao_base,
      status_nomeacao: normalizeStatus(row.status_nomeacao),
      td_status: normalizeTdStatus(row.td_status),
      td_observacao: row.td_observacao,
      outras_aprovacoes_resumo: row.outras_aprovacoes_resumo ?? null,
      email: null,
      telefone: null,
      redes_sociais: null,
    }
  })

  const ordem = base.slice().sort(sortByOrdem)
  const ac = ordem.filter(candidate => candidate.sistema_concorrencia === 'AC')
  const pcd = ordem.filter(candidate => candidate.sistema_concorrencia === 'PCD')
  const ppp = ordem.filter(candidate => candidate.sistema_concorrencia === 'PPP')
  const ind = ordem.filter(candidate => candidate.sistema_concorrencia === 'IND')

  return {
    ordem,
    ac,
    pcd,
    ppp,
    ind,
    totals: {
      total: ordem.length,
      ac: ac.length,
      pcd: pcd.length,
      ppp: ppp.length,
      ind: ind.length,
    },
  }
}
