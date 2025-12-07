import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { loadResumoData } from '@/src/app/(app)/resumo/loadResumoData'

import ResumoDashboard from '../resumo/ResumoDashboard'

export const dynamic = 'force-dynamic'

type PerfilRow = {
  candidate_id: string | null
  role?: string | null
  telefone?: string | null
  instagram?: string | null
  facebook?: string | null
  outras_redes?: string | null
  avatar_url?: string | null
}

export default async function PerfilPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('user_profiles')
    .select('candidate_id, role, telefone, instagram, facebook, outras_redes, avatar_url')
    .eq('user_id', user.id)
    .single<PerfilRow>()

  if (perfilError || !perfil?.candidate_id) {
    console.error(perfilError)
    throw new Error('Não foi possível encontrar o candidato vinculado a este usuário.')
  }

  const data = await loadResumoData(perfil.candidate_id)
  const isComissao = perfil.role === 'COMISSAO'

  return (
    <ResumoDashboard
      data={data}
      isComissao={isComissao}
      userId={user.id}
      profileContact={{
        email: user.email,
        telefone: perfil.telefone,
        instagram: perfil.instagram,
        facebook: perfil.facebook,
        outras_redes: perfil.outras_redes,
        avatarUrl: perfil.avatar_url,
      }}
      variant="perfil"
    />
  )
}
