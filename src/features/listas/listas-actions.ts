'use server'

import { revalidatePath } from 'next/cache'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export type SistemaConcorrencia = 'AC' | 'PCD' | 'PPP' | 'IND'
export type PretendeAssumirChoice = 'SIM' | 'NAO' | 'TALVEZ'
export type JaNomeadoChoice = 'SIM' | 'NAO' | 'EM_ANDAMENTO'

export type SaveOutraAprovacaoInput = {
  id?: string
  candidateId: string
  orgao: string
  cargo: string
  sistemaConcorrencia: SistemaConcorrencia
  classificacao?: number | null
  pretendeAssumir: PretendeAssumirChoice
  jaNomeado: JaNomeadoChoice
  observacao?: string | null
}

type OutraAprovacaoPayloadInput = {
  orgao: string
  cargo: string
  sistemaConcorrencia: SistemaConcorrencia | 'INDIGENA'
  classificacao?: number | null
  pretendeAssumir?: PretendeAssumirChoice | 'INDEFINIDO'
  jaNomeado?: JaNomeadoChoice
  observacao?: string | null
}

export type RequestOutraAprovacaoCreateInput = OutraAprovacaoPayloadInput & {
  candidateId: string
}

export type RequestOutraAprovacaoUpdateInput = RequestOutraAprovacaoCreateInput & {
  approvalId: string
}

type OutraAprovacaoDbPayload = {
  orgao: string
  cargo: string
  sistema_concorrencia: string
  classificacao: number | null
  pretende_assumir: string
  ja_foi_nomeado: string
  observacao: string | null
}

interface CreateCandidateInput {
  nome: string
  sistema_concorrencia: SistemaConcorrencia
  classificacao_lista: number
}

function buildIdUnico(sistema: SistemaConcorrencia, classificacao: number) {
  return `${sistema}${classificacao}`
}

function mapSistemaToDatabaseValue(sistema: SistemaConcorrencia | 'INDIGENA') {
  if (sistema === 'INDIGENA') return 'INDIGENA'
  return sistema === 'IND' ? 'INDIGENA' : sistema
}

function mapPretendeAssumirToDatabase(value: PretendeAssumirChoice | 'INDEFINIDO') {
  if (value === 'INDEFINIDO') return 'INDEFINIDO'
  if (value === 'TALVEZ') return 'INDEFINIDO'
  return value
}

function mapJaNomeadoToDatabase(value: JaNomeadoChoice) {
  if (value === 'EM_ANDAMENTO') return 'EM_ANDAMENTO'
  return value
}

function sanitizeClassificacao(value?: number | null) {
  if (value === null || value === undefined) return null
  if (Number.isNaN(value)) return null
  return Number.isFinite(value) ? value : null
}

function buildOutraAprovacaoDbPayload(input: OutraAprovacaoPayloadInput): OutraAprovacaoDbPayload {
  const orgao = input.orgao?.trim()
  if (!orgao) {
    throw new Error('Informe o órgão da aprovação.')
  }

  const cargo = input.cargo?.trim()
  if (!cargo) {
    throw new Error('Informe o cargo da aprovação.')
  }

  const sistema = mapSistemaToDatabaseValue(input.sistemaConcorrencia)
  const classificacao = sanitizeClassificacao(input.classificacao)
  const pretendeAssumir = mapPretendeAssumirToDatabase(input.pretendeAssumir ?? 'INDEFINIDO')
  const jaFoiNomeado = mapJaNomeadoToDatabase(input.jaNomeado ?? 'NAO')
  const observacao = input.observacao?.trim() ? input.observacao.trim() : null

  return {
    orgao,
    cargo,
    sistema_concorrencia: sistema,
    classificacao,
    pretende_assumir: pretendeAssumir,
    ja_foi_nomeado: jaFoiNomeado,
    observacao,
  }
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function ensureCandidateOwnership(supabase: SupabaseServerClient, candidateId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Você precisa estar autenticado para salvar aprovações.')
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('candidate_id')
    .eq('user_id', user.id)
    .maybeSingle<{ candidate_id: string | null }>()

  if (error) {
    console.error('[ensureCandidateOwnership] erro ao buscar perfil', error)
    throw new Error('Não foi possível validar seu perfil de candidato.')
  }

  if (!profile?.candidate_id) {
    throw new Error('Associe-se a um candidato antes de salvar aprovações.')
  }

  if (profile.candidate_id !== candidateId) {
    throw new Error('Você não pode atualizar aprovações de outro candidato.')
  }

  return { userId: user.id, candidateId }
}

async function updateCandidateTdStatusIfNomeado(
  supabase: SupabaseServerClient,
  candidateId: string,
  jaFoiNomeado: string,
  orgao: string,
  cargo: string,
) {
  if (jaFoiNomeado !== 'SIM') {
    return
  }

  const { data: candidateRow, error: candidateError } = await supabase
    .from('candidates')
    .select('td_status')
    .eq('id', candidateId)
    .maybeSingle<{ td_status: string | null }>()

  if (candidateError) {
    console.error('[updateCandidateTdStatusIfNomeado] erro ao buscar candidato', candidateError)
    return
  }

  const tdAtual = candidateRow?.td_status ?? null
  if (tdAtual !== null && tdAtual !== 'TALVEZ') {
    return
  }

  const obs = `Nomeado no ${orgao}. Cargo: ${cargo}. Data: ${new Intl.DateTimeFormat('pt-BR').format(new Date())}.`
  const { error: tdUpdateError } = await supabase
    .from('candidates')
    .update({
      td_status: 'SIM',
      td_observacao: obs,
    })
    .eq('id', candidateId)

  if (tdUpdateError) {
    console.error('[updateCandidateTdStatusIfNomeado] erro ao atualizar TD do candidato', tdUpdateError)
  }
}

export async function createCandidateAction(input: CreateCandidateInput) {
  const supabase = await createSupabaseServerClient()

  const { nome, sistema_concorrencia, classificacao_lista } = input
  const id_unico = buildIdUnico(sistema_concorrencia, classificacao_lista)

  const { error } = await supabase.from('candidates').insert({
    nome,
    sistema_concorrencia: mapSistemaToDatabaseValue(sistema_concorrencia),
    classificacao_lista,
    ordem_nomeacao_base: null,
    id_unico,
    status_nomeacao: null,
    td_status: null,
    td_observacao: null,
  })

  if (error) {
    console.error('[createCandidateAction] erro ao inserir candidato', error)
    throw new Error('Não foi possível cadastrar o aprovado. Tente novamente.')
  }

  revalidatePath('/listas')
}

export async function requestOutraAprovacaoCreate(input: RequestOutraAprovacaoCreateInput) {
  const supabase = await createSupabaseServerClient()
  const { userId, candidateId } = await ensureCandidateOwnership(supabase, input.candidateId)
  const now = new Date().toISOString()
  const payload = buildOutraAprovacaoDbPayload(input)

  const { error } = await supabase.from('outras_aprovacoes').insert({
    candidate_id: candidateId,
    user_id: userId,
    status: 'PENDENTE',
    approved_at: null,
    approved_by: null,
    created_at: now,
    updated_at: now,
    ...payload,
  })

  if (error) {
    console.error('[requestOutraAprovacaoCreate] erro ao salvar aprovação', error)
    throw new Error('Não foi possível salvar essa aprovação. Tente novamente.')
  }

  await updateCandidateTdStatusIfNomeado(supabase, candidateId, payload.ja_foi_nomeado, payload.orgao, payload.cargo)

  revalidatePath('/resumo')
  revalidatePath('/listas')
  revalidatePath('/comissao')

  return { success: true }
}

export async function requestOutraAprovacaoUpdate(input: RequestOutraAprovacaoUpdateInput) {
  const supabase = await createSupabaseServerClient()
  const { candidateId } = await ensureCandidateOwnership(supabase, input.candidateId)
  const now = new Date().toISOString()
  const payload = buildOutraAprovacaoDbPayload(input)

  const { data: approvalRow, error: approvalError } = await supabase
    .from('outras_aprovacoes')
    .select('id, candidate_id')
    .eq('id', input.approvalId)
    .maybeSingle<{ id: string; candidate_id: string }>()

  if (approvalError || !approvalRow) {
    console.error('[requestOutraAprovacaoUpdate] erro ao validar aprovação', approvalError)
    throw new Error('Não foi possível localizar essa aprovação para atualização.')
  }

  if (approvalRow.candidate_id !== candidateId) {
    throw new Error('Você não pode atualizar aprovações de outro candidato.')
  }

  const { error } = await supabase
    .from('outras_aprovacoes')
    .update({
      ...payload,
      status: 'PENDENTE',
      approved_at: null,
      approved_by: null,
      updated_at: now,
    })
    .eq('id', input.approvalId)
    .eq('candidate_id', candidateId)

  if (error) {
    console.error('[requestOutraAprovacaoUpdate] erro ao atualizar aprovação', error)
    throw new Error('Não foi possível atualizar essa aprovação. Tente novamente.')
  }

  await updateCandidateTdStatusIfNomeado(supabase, candidateId, payload.ja_foi_nomeado, payload.orgao, payload.cargo)

  revalidatePath('/resumo')
  revalidatePath('/listas')
  revalidatePath('/comissao')

  return { success: true }
}

export async function saveOutraAprovacaoAction(input: SaveOutraAprovacaoInput) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Você precisa estar autenticado para salvar aprovações.')
  }

  const now = new Date().toISOString()
  const payload = buildOutraAprovacaoDbPayload({
    orgao: input.orgao,
    cargo: input.cargo,
    sistemaConcorrencia: input.sistemaConcorrencia,
    classificacao: input.classificacao ?? null,
    pretendeAssumir: input.pretendeAssumir,
    jaNomeado: input.jaNomeado,
    observacao: input.observacao ?? null,
  })

  const mutationPayload = {
    ...payload,
    status: 'PENDENTE',
    approved_at: null,
    approved_by: null,
    updated_at: now,
  }

  let error

  if (input.id) {
    ;({ error } = await supabase
      .from('outras_aprovacoes')
      .update(mutationPayload)
      .eq('id', input.id)
      .eq('candidate_id', input.candidateId))
  } else {
    ;({ error } = await supabase.from('outras_aprovacoes').insert({
      candidate_id: input.candidateId,
      user_id: user.id,
      ...mutationPayload,
      created_at: now,
    }))
  }

  if (error) {
    console.error('[saveOutraAprovacaoAction] erro ao salvar aprovação', error)
    throw new Error('Não foi possível salvar essa aprovação. Tente novamente.')
  }

  await updateCandidateTdStatusIfNomeado(
    supabase,
    input.candidateId,
    payload.ja_foi_nomeado,
    payload.orgao,
    payload.cargo,
  )

  revalidatePath('/listas')
  revalidatePath('/resumo')
  revalidatePath('/comissao')
}
