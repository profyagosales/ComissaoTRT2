'use server'

import { revalidatePath } from 'next/cache'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export type SistemaConcorrencia = 'AC' | 'PCD' | 'PPP' | 'IND'

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
