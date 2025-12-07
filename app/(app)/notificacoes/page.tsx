import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { UltimasNotificacoesCard } from '@/src/components/resumo/UltimasNotificacoesCard'
import { loadResumoData } from '@/src/app/(app)/resumo/loadResumoData'

export const dynamic = 'force-dynamic'

type PerfilRow = {
  candidate_id: string | null
}

export default async function NotificacoesPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('user_profiles')
    .select('candidate_id')
    .eq('user_id', user.id)
    .single<PerfilRow>()

  if (perfilError || !perfil?.candidate_id) {
    console.error(perfilError)
    throw new Error('Não foi possível encontrar o candidato vinculado a este usuário.')
  }

  const data = await loadResumoData(perfil.candidate_id)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-2 pb-28 pt-4 sm:px-3 md:pb-16 lg:px-4 xl:px-6">
      <div className="space-y-2">
        <h1 className="font-display text-xl font-semibold text-[#0f2f47]">Notificações</h1>
        <p className="text-sm text-[#0f2f47]/70">
          Acompanhe os avisos mais recentes enviados pela Comissão e pelo TRT-2.
        </p>
      </div>

      <UltimasNotificacoesCard notificacoes={data.ultimasNotificacoes} />
    </div>
  )
}
