import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { loadListasData, type ListaKey } from '@/features/listas/loadListasData'
import { ListasDashboard } from '@/features/listas/ListasDashboard'
import {
  requestOutraAprovacaoCreate,
  requestOutraAprovacaoUpdate,
  type JaNomeadoChoice,
  type PretendeAssumirChoice,
  type SaveOutraAprovacaoInput,
  type SistemaConcorrencia,
} from '@/features/listas/listas-actions'
import type { CandidateListasProfile, OutraAprovacaoListItem } from '@/features/listas/types'

function normalizeSistema(value: string | null): SistemaConcorrencia {
  if (value === 'PCD' || value === 'PPP' || value === 'AC') return value
  if (value === 'IND' || value === 'INDIGENA') return 'IND'
  return 'AC'
}

function normalizeStatus(value: string | null): 'NOMEADO' | 'AGUARDANDO' | null {
  if (value === 'NOMEADO' || value === 'AGUARDANDO') return value
  if (value === 'POSSE' || value === 'EM_POSSE') return 'NOMEADO'
  return null
}

function normalizeTdStatus(value: string | null): 'SIM' | 'TALVEZ' | null {
  if (value === 'SIM') return 'SIM'
  if (value === 'TALVEZ' || value === 'PROVAVEL') return 'TALVEZ'
  return null
}

function normalizePretendeAssumir(value: string | null): PretendeAssumirChoice {
  if (value === 'SIM' || value === 'NAO') return value
  return 'TALVEZ'
}

function normalizeJaNomeado(value: string | null): JaNomeadoChoice {
  if (value === 'SIM' || value === 'NAO') return value
  if (value === 'EM_ANDAMENTO') return 'EM_ANDAMENTO'
  return 'NAO'
}

function normalizeApprovalStatus(value: string | null): 'PENDENTE' | 'APROVADO' | 'RECUSADO' {
  if (value === 'APROVADO' || value === 'RECUSADO') return value
  return 'PENDENTE'
}

async function handleCandidateOutraAprovacao(input: SaveOutraAprovacaoInput) {
  'use server'

  const basePayload = {
    candidateId: input.candidateId,
    orgao: input.orgao,
    cargo: input.cargo,
    sistemaConcorrencia: input.sistemaConcorrencia,
    classificacao: input.classificacao ?? null,
    pretendeAssumir: input.pretendeAssumir,
    jaNomeado: input.jaNomeado,
    observacao: input.observacao ?? null,
  }

  if (input.id) {
    await requestOutraAprovacaoUpdate({
      approvalId: input.id,
      ...basePayload,
    })
    return
  }

  await requestOutraAprovacaoCreate(basePayload)
}

export async function ListaDetailPage({ listaKey }: { listaKey: ListaKey }) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, candidate_id, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle()

  const listasData = await loadListasData()

  let candidateProfile: CandidateListasProfile | null = null
  let outrasAprovacoes: OutraAprovacaoListItem[] = []

  if (profile?.candidate_id) {
    const { data: candidateRow, error: candidateError } = await supabase
      .from('candidates')
      .select('id, nome, sistema_concorrencia, classificacao_lista, ordem_nomeacao_base, status_nomeacao, td_status, td_observacao')
      .eq('id', profile.candidate_id)
      .maybeSingle()

    if (candidateError) {
      console.error('Erro ao carregar candidato vinculado ao usuário', candidateError)
    }

    if (candidateRow) {
      candidateProfile = {
        id: candidateRow.id,
        nome: candidateRow.nome,
        sistema_concorrencia: normalizeSistema(candidateRow.sistema_concorrencia as string | null),
        classificacao_lista: candidateRow.classificacao_lista,
        ordem_nomeacao_base: candidateRow.ordem_nomeacao_base,
        status_nomeacao: normalizeStatus(candidateRow.status_nomeacao as string | null),
        td_status: normalizeTdStatus(candidateRow.td_status as string | null),
        td_observacao: candidateRow.td_observacao,
        avatar_url: profile?.avatar_url,
      }
    }

    const { data: aprovacoesRows, error: aprovacoesError } = await supabase
      .from('outras_aprovacoes')
      .select('id, orgao, cargo, sistema_concorrencia, classificacao, pretende_assumir, ja_foi_nomeado, observacao, status, created_at, updated_at, approved_at')
      .eq('candidate_id', profile.candidate_id)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (aprovacoesError) {
      console.error('Erro ao carregar outras aprovações do candidato', aprovacoesError)
    }

    if (Array.isArray(aprovacoesRows)) {
      outrasAprovacoes = aprovacoesRows.map((row) => ({
        id: row.id,
        orgao: row.orgao,
        cargo: row.cargo,
        sistema_concorrencia: normalizeSistema(row.sistema_concorrencia as string | null),
        classificacao: row.classificacao,
        pretende_assumir: normalizePretendeAssumir(row.pretende_assumir as string | null),
        ja_foi_nomeado: normalizeJaNomeado(row.ja_foi_nomeado as string | null),
        observacao: row.observacao,
        status: normalizeApprovalStatus(row.status),
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
        approved_at: row.approved_at ?? null,
      }))
    }
  }

  return (
    <ListasDashboard
      data={listasData}
      isComissao={profile?.role === 'COMISSAO'}
      selectedListKey={listaKey}
      currentCandidate={candidateProfile ?? undefined}
      outrasAprovacoes={outrasAprovacoes}
      onSaveOutraAprovacao={candidateProfile ? handleCandidateOutraAprovacao : undefined}
    />
  )
}
