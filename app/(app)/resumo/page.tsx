import { createSupabaseServerClient } from '@/lib/supabase-server'

type CandidateProfile = {
  nome: string
  sistema_concorrencia: string
  classificacao_lista: number
  id_unico: string
}

type UserProfileRow = {
  id: string
  telefone: string | null
  instagram: string | null
  facebook: string | null
  outras_redes: string | null
  candidate?: CandidateProfile | null
}

export default async function ResumoPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id

  if (!userId) {
    // Layout deveria redirecionar, mas garantimos aqui também
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
      .select(
        'id, telefone, instagram, facebook, outras_redes, candidate:candidates (nome, sistema_concorrencia, classificacao_lista, id_unico)',
      )
    .eq('user_id', userId)
    .maybeSingle<UserProfileRow>()

  const candidate = profile?.candidate ?? null

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl shadow-lg shadow-zinc-400/30 border border-zinc-200 p-6">
        <p className="text-xs tracking-[0.22em] uppercase text-zinc-500">
          Resumo · Perfil do aprovado
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          {candidate?.nome ? `Olá, ${candidate.nome}!` : 'Olá!'}
        </h1>
        {candidate && (
          <p className="mt-2 text-sm text-zinc-600">
            Sistema de concorrência:{' '}
            <span className="font-medium">{candidate.sistema_concorrencia}</span>{' '}
            · Classificação:{' '}
            <span className="font-medium">
              {candidate.classificacao_lista} ({candidate.id_unico})
            </span>
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          Aqui vai aparecer seu resumo: quantos candidatos ainda estão na sua
          frente, status de TD, nomeações, vacâncias e muito mais. Vamos montar
          esses cards aos poucos.
        </p>
      </section>
    </div>
  )
}
