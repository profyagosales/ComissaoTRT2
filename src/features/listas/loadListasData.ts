import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { SistemaConcorrencia } from './listas-actions'
import type { TdRequestTipo } from '@/features/tds/td-types'

export const LISTA_KEYS = ['ordem', 'ac', 'pcd', 'ppp', 'ind'] as const
export type ListaKey = (typeof LISTA_KEYS)[number]

export type CandidateOutraAprovacao = {
  id: string
  orgao: string
  cargo: string
  sistema_concorrencia: SistemaConcorrencia
  classificacao: number | null
  pretende_assumir: 'SIM' | 'NAO' | 'TALVEZ'
  ja_foi_nomeado: 'SIM' | 'NAO' | 'EM_ANDAMENTO'
  observacao: string | null
  approved_at?: string | null
}

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
  outras_aprovacoes?: CandidateOutraAprovacao[]
  email?: string | null
  telefone?: string | null
  redes_sociais?: string | null
}

export type ListasTotals = {
  total_aprovados: number
  total_aprovados_ampla: number
  total_aprovados_pcd: number
  total_aprovados_ppp: number
  total_aprovados_indigena: number
  total_nomeados: number
  total_nomeados_ampla: number
  total_nomeados_pcd: number
  total_nomeados_ppp: number
  total_nomeados_indigena: number
}

export type TdCounts = Record<ListaKey, number>

export type ListasData = {
  ordem: ListaCandidate[]
  ac: ListaCandidate[]
  pcd: ListaCandidate[]
  ppp: ListaCandidate[]
  ind: ListaCandidate[]
  totals: ListasTotals
  tdCounts: TdCounts
} & ListasTotals

type CandidatesResumoRow = {
  total_aprovados: number | string | null
  total_aprovados_ampla: number | string | null
  total_aprovados_pcd: number | string | null
  total_aprovados_ppp: number | string | null
  total_aprovados_indigena: number | string | null
  total_nomeados: number | string | null
  total_nomeados_ampla: number | string | null
  total_nomeados_pcd: number | string | null
  total_nomeados_ppp: number | string | null
  total_nomeados_indigena: number | string | null
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
  outras_aprovacoes?: CandidateOutraAprovacaoRow[] | null
}

type CandidateOutraAprovacaoRow = {
  id: string
  orgao: string
  cargo: string
  sistema_concorrencia: string | null
  classificacao: number | null
  pretende_assumir: string | null
  ja_foi_nomeado: string | null
  observacao: string | null
  status: string | null
  approved_at?: string | null
  approved_by?: string | null
}

type TdRow = {
  tipo_td: TdRequestTipo | null
  sistema_concorrencia: string | null
}

function emptyListasData(): ListasData {
  const totals = emptyTotals()
  const tdCounts = emptyTdCounts()
  return {
    ordem: [],
    ac: [],
    pcd: [],
    ppp: [],
    ind: [],
    totals,
    tdCounts,
    ...totals,
  }
}

function emptyTotals(): ListasTotals {
  return {
    total_aprovados: 0,
    total_aprovados_ampla: 0,
    total_aprovados_pcd: 0,
    total_aprovados_ppp: 0,
    total_aprovados_indigena: 0,
    total_nomeados: 0,
    total_nomeados_ampla: 0,
    total_nomeados_pcd: 0,
    total_nomeados_ppp: 0,
    total_nomeados_indigena: 0,
  }
}

function emptyTdCounts(): TdCounts {
  return {
    ordem: 0,
    ac: 0,
    pcd: 0,
    ppp: 0,
    ind: 0,
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

function listaKeyFromSistema(sistema: SistemaConcorrencia): ListaKey {
  if (sistema === 'AC') return 'ac'
  if (sistema === 'PCD') return 'pcd'
  if (sistema === 'PPP') return 'ppp'
  return 'ind'
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

function normalizePretendeAssumir(value: string | null): 'SIM' | 'NAO' | 'TALVEZ' {
  if (value === 'SIM' || value === 'NAO') return value
  return 'TALVEZ'
}

function normalizeJaFoiNomeado(value: string | null): 'SIM' | 'NAO' | 'EM_ANDAMENTO' {
  if (value === 'SIM' || value === 'NAO') return value
  if (value === 'EM_ANDAMENTO') return 'EM_ANDAMENTO'
  return 'NAO'
}

function countNomeados(list: ListaCandidate[]): number {
  return list.filter(candidate => candidate.status_nomeacao === 'NOMEADO').length
}

function buildTdCounts(rows: TdRow[]): TdCounts {
  const counts = emptyTdCounts()
  rows.forEach(row => {
    if (!row || row.tipo_td !== 'ENVIADO') {
      return
    }
    const sistema = normalizeSistema(row.sistema_concorrencia)
    const key = listaKeyFromSistema(sistema)
    counts[key] += 1
  })
  counts.ordem = counts.ac + counts.pcd + counts.ppp + counts.ind
  return counts
}

function coerceNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function buildOutrasAprovacoesResumo(approvals: CandidateOutraAprovacao[]): string | null {
  if (!approvals || approvals.length === 0) {
    return null
  }
  if (approvals.length === 1) {
    const [first] = approvals
    const cargoSuffix = first.cargo ? ` — ${first.cargo}` : ''
    return `Aprovado: ${first.orgao}${cargoSuffix}`
  }
  return `Aprovado em ${approvals.length} concursos`
}

/**
 * Regras de posição por cota:
 * - PCD: vagas 5, 11, 21, 31, 41, 51, 61, ...
 * - PPP: vagas 3, 8, 13, 18, 23, 28, 33, ...
 * - IND: vagas 10, 45, 80, 115, ... (10 + 35k)
 * - AC: demais posições.
 */
function sistemaPreferidoParaPosicao(pos: number): SistemaConcorrencia {
  const isInd = pos === 10 || (pos > 10 && (pos - 10) % 35 === 0)
  const isPcd = pos === 5 || pos === 11 || (pos > 11 && (pos - 11) % 10 === 0)
  const isPpp = pos === 3 || pos === 8 || (pos > 8 && (pos - 8) % 5 === 0)

  if (isInd) return 'IND'
  if (isPcd) return 'PCD'
  if (isPpp) return 'PPP'
  return 'AC'
}

function buildDynamicOrder(base: ListaCandidate[]): ListaCandidate[] {
  const porSistema: Record<SistemaConcorrencia, ListaCandidate[]> = {
    AC: [],
    PCD: [],
    PPP: [],
    IND: [],
  }

  for (const c of base) {
    porSistema[c.sistema_concorrencia].push({ ...c })
  }

  // cada lista interna ordenada pela classificação original
  const sortByClass = (a: ListaCandidate, b: ListaCandidate) => {
    const aVal = a.classificacao_lista ?? Number.MAX_SAFE_INTEGER
    const bVal = b.classificacao_lista ?? Number.MAX_SAFE_INTEGER
    return aVal - bVal
  }

  porSistema.AC.sort(sortByClass)
  porSistema.PCD.sort(sortByClass)
  porSistema.PPP.sort(sortByClass)
  porSistema.IND.sort(sortByClass)

  const indices: Record<SistemaConcorrencia, number> = {
    AC: 0,
    PCD: 0,
    PPP: 0,
    IND: 0,
  }

  const temRestante = (s: SistemaConcorrencia) => indices[s] < porSistema[s].length

  const pegar = (s: SistemaConcorrencia, pos: number): ListaCandidate | null => {
    if (!temRestante(s)) return null
    const idx = indices[s]++
    const candidato = porSistema[s][idx]
    return { ...candidato, ordem_nomeacao_base: pos }
  }

  const total = base.length
  const ordem: ListaCandidate[] = []

  for (let pos = 1; pos <= total; pos++) {
    const preferido = sistemaPreferidoParaPosicao(pos)

    // fallback em caso de falta de candidatos naquela cota
    let prioridade: SistemaConcorrencia[]

    if (preferido === 'IND') {
      prioridade = ['IND', 'PPP', 'PCD', 'AC']
    } else if (preferido === 'PPP') {
      prioridade = ['PPP', 'AC', 'PCD', 'IND']
    } else if (preferido === 'PCD') {
      prioridade = ['PCD', 'AC', 'PPP', 'IND']
    } else {
      // AC
      prioridade = ['AC', 'PPP', 'PCD', 'IND']
    }

    let escolhido: ListaCandidate | null = null
    for (const sistema of prioridade) {
      const c = pegar(sistema as SistemaConcorrencia, pos)
      if (c) {
        escolhido = c
        break
      }
    }

    if (escolhido) {
      ordem.push(escolhido)
    }
  }

  return ordem
}

export async function loadListasData(): Promise<ListasData> {
  const supabase = await createSupabaseServerClient()

  const candidatesQuery = supabase
    .from('candidates')
    .select(
      `id,
      nome,
      sistema_concorrencia,
      classificacao_lista,
      ordem_nomeacao_base,
      status_nomeacao,
      td_status,
      td_observacao,
      outras_aprovacoes_resumo,
      outras_aprovacoes:outras_aprovacoes (
        id,
        orgao,
        cargo,
        sistema_concorrencia,
        classificacao,
        pretende_assumir,
        ja_foi_nomeado,
        observacao,
        status,
        approved_at,
        approved_by
      )`,
    )
    .order('ordem_nomeacao_base', { ascending: true })
    .order('classificacao_lista', { ascending: true })
    .eq('outras_aprovacoes.status', 'APROVADO')
    .not('outras_aprovacoes.approved_at', 'is', null)

  const resumoQuery = supabase.from('candidates_resumo_view').select('*').limit(1)
  const tdQuery = supabase.from('ultimos_tds_view').select('tipo_td, sistema_concorrencia')

  const [{ data, error }, { data: resumoData, error: resumoError }, { data: tdData, error: tdError }] = await Promise.all([
    candidatesQuery,
    resumoQuery,
    tdQuery,
  ])

  if (error || !data) {
    console.error('Erro ao carregar candidatos para /listas', error)
    return emptyListasData()
  }

  if (resumoError) {
    console.error('Erro ao carregar candidatos_resumo_view para /listas', resumoError)
  }

  if (tdError) {
    console.error('Erro ao carregar ultimos_tds_view para /listas', tdError)
  }

  const base: ListaCandidate[] = (data as CandidateRow[]).map(row => {
    const sistema = normalizeSistema(row.sistema_concorrencia)
    const approvedApprovals = (row.outras_aprovacoes ?? [])
      .filter(approval => approval?.status === 'APROVADO' && approval.approved_at)
      .map<CandidateOutraAprovacao>(approval => ({
        id: approval.id,
        orgao: approval.orgao,
        cargo: approval.cargo,
        sistema_concorrencia: normalizeSistema(approval.sistema_concorrencia),
        classificacao: approval.classificacao,
        pretende_assumir: normalizePretendeAssumir(approval.pretende_assumir),
        ja_foi_nomeado: normalizeJaFoiNomeado(approval.ja_foi_nomeado),
        observacao: approval.observacao,
        approved_at: approval.approved_at ?? undefined,
      }))
    const outrasAprovacoesResumo = buildOutrasAprovacoesResumo(approvedApprovals)
    return {
      id: row.id,
      nome: row.nome,
      sistema_concorrencia: sistema,
      classificacao_lista: row.classificacao_lista,
      ordem_nomeacao_base: row.ordem_nomeacao_base,
      status_nomeacao: normalizeStatus(row.status_nomeacao),
      td_status: normalizeTdStatus(row.td_status),
      td_observacao: row.td_observacao,
      outras_aprovacoes_resumo: outrasAprovacoesResumo,
      outras_aprovacoes: approvedApprovals,
      email: null,
      telefone: null,
      redes_sociais: null,
    }
  })

  // >>> AQUI entra a nova ordem dinâmica
  const ordem = buildDynamicOrder(base)

  // as listas específicas continuam filtrando a partir da ordem geral
  const ac = ordem.filter(candidate => candidate.sistema_concorrencia === 'AC')
  const pcd = ordem.filter(candidate => candidate.sistema_concorrencia === 'PCD')
  const ppp = ordem.filter(candidate => candidate.sistema_concorrencia === 'PPP')
  const ind = ordem.filter(candidate => candidate.sistema_concorrencia === 'IND')

  const tdCounts = Array.isArray(tdData) ? buildTdCounts(tdData as TdRow[]) : emptyTdCounts()

  const fallbackTotals: ListasTotals = {
    total_aprovados: ordem.length,
    total_aprovados_ampla: ac.length,
    total_aprovados_pcd: pcd.length,
    total_aprovados_ppp: ppp.length,
    total_aprovados_indigena: ind.length,
    total_nomeados: countNomeados(ordem),
    total_nomeados_ampla: countNomeados(ac),
    total_nomeados_pcd: countNomeados(pcd),
    total_nomeados_ppp: countNomeados(ppp),
    total_nomeados_indigena: countNomeados(ind),
  }

  const resumoRow = Array.isArray(resumoData) ? (resumoData[0] as CandidatesResumoRow | undefined) : undefined
  const resumoTotals = resumoRow
    ? {
        total_aprovados: coerceNumber(resumoRow.total_aprovados),
        total_aprovados_ampla: coerceNumber(resumoRow.total_aprovados_ampla),
        total_aprovados_pcd: coerceNumber(resumoRow.total_aprovados_pcd),
        total_aprovados_ppp: coerceNumber(resumoRow.total_aprovados_ppp),
        total_aprovados_indigena: coerceNumber(resumoRow.total_aprovados_indigena),
        total_nomeados: coerceNumber(resumoRow.total_nomeados),
        total_nomeados_ampla: coerceNumber(resumoRow.total_nomeados_ampla),
        total_nomeados_pcd: coerceNumber(resumoRow.total_nomeados_pcd),
        total_nomeados_ppp: coerceNumber(resumoRow.total_nomeados_ppp),
        total_nomeados_indigena: coerceNumber(resumoRow.total_nomeados_indigena),
      }
    : null

  const totals: ListasTotals = {
    total_aprovados: resumoTotals?.total_aprovados ?? fallbackTotals.total_aprovados,
    total_aprovados_ampla: resumoTotals?.total_aprovados_ampla ?? fallbackTotals.total_aprovados_ampla,
    total_aprovados_pcd: resumoTotals?.total_aprovados_pcd ?? fallbackTotals.total_aprovados_pcd,
    total_aprovados_ppp: resumoTotals?.total_aprovados_ppp ?? fallbackTotals.total_aprovados_ppp,
    total_aprovados_indigena: resumoTotals?.total_aprovados_indigena ?? fallbackTotals.total_aprovados_indigena,
    total_nomeados: resumoTotals?.total_nomeados ?? fallbackTotals.total_nomeados,
    total_nomeados_ampla: resumoTotals?.total_nomeados_ampla ?? fallbackTotals.total_nomeados_ampla,
    total_nomeados_pcd: resumoTotals?.total_nomeados_pcd ?? fallbackTotals.total_nomeados_pcd,
    total_nomeados_ppp: resumoTotals?.total_nomeados_ppp ?? fallbackTotals.total_nomeados_ppp,
    total_nomeados_indigena: resumoTotals?.total_nomeados_indigena ?? fallbackTotals.total_nomeados_indigena,
  }

  return {
    ordem,
    ac,
    pcd,
    ppp,
    ind,
    totals,
    tdCounts,
    ...totals,
  }
}
