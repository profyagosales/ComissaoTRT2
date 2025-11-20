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

interface CreateCandidateInput {
  nome: string
  sistema_concorrencia: SistemaConcorrencia
  classificacao_lista: number
}

function buildIdUnico(sistema: SistemaConcorrencia, classificacao: number) {
  return `${sistema}${classificacao}`
}

function mapSistemaToDatabaseValue(sistema: SistemaConcorrencia) {
  return sistema === 'IND' ? 'INDIGENA' : sistema
}

function mapPretendeAssumirToDatabase(value: PretendeAssumirChoice) {
  if (value === 'TALVEZ') return 'INDEFINIDO'
  return value
}

function mapJaNomeadoToDatabase(value: JaNomeadoChoice) {
  if (value === 'EM_ANDAMENTO') return 'EM_ANDAMENTO'
  return value
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

export async function saveOutraAprovacaoAction(input: SaveOutraAprovacaoInput) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Você precisa estar autenticado para salvar aprovações.')
  }

  const now = new Date().toISOString()

  const payload = {
    orgao: input.orgao,
    cargo: input.cargo,
    sistema_concorrencia: mapSistemaToDatabaseValue(input.sistemaConcorrencia),
    classificacao: input.classificacao ?? null,
    pretende_assumir: mapPretendeAssumirToDatabase(input.pretendeAssumir),
    ja_foi_nomeado: mapJaNomeadoToDatabase(input.jaNomeado),
    observacao: input.observacao ?? null,
    status: 'PENDENTE',
    approved_at: null,
    approved_by: null,
    updated_at: now,
  }

  let error

  if (input.id) {
    ;({ error } = await supabase
      .from('outras_aprovacoes')
      .update(payload)
      .eq('id', input.id)
      .eq('candidate_id', input.candidateId))
  } else {
    ;({ error } = await supabase.from('outras_aprovacoes').insert({
      candidate_id: input.candidateId,
      user_id: user.id,
      ...payload,
      created_at: now,
    }))
  }

  if (error) {
    console.error('[saveOutraAprovacaoAction] erro ao salvar aprovação', error)
    throw new Error('Não foi possível salvar essa aprovação. Tente novamente.')
  }

  if (input.jaNomeado === 'SIM') {
    const { data: candidateRow, error: candidateError } = await supabase
      .from('candidates')
      .select('td_status')
      .eq('id', input.candidateId)
      .maybeSingle<{ td_status: string | null }>()

    if (candidateError) {
      console.error('[saveOutraAprovacaoAction] erro ao buscar candidato', candidateError)
    }

    const tdAtual = candidateRow?.td_status ?? null
    if (tdAtual === null || tdAtual === 'TALVEZ') {
      const obs = `Nomeado no ${input.orgao}. Cargo: ${input.cargo}. Data: ${new Intl.DateTimeFormat('pt-BR').format(new Date())}.`
      const { error: tdUpdateError } = await supabase
        .from('candidates')
        .update({
          td_status: 'SIM',
          td_observacao: obs,
        })
        .eq('id', input.candidateId)

      if (tdUpdateError) {
        console.error('[saveOutraAprovacaoAction] erro ao atualizar TD do candidato', tdUpdateError)
      }
    }
  }

  revalidatePath('/listas')
  revalidatePath('/resumo')
}
