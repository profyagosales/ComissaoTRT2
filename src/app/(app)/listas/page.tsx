import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'

import { ListasDashboard } from './ListasDashboard'
import { loadListasData } from './loadListasData'

export const dynamic = 'force-dynamic'

export default async function ListasPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  const listas = await loadListasData()

  const isComissao = profile?.role === 'COMISSAO'

  return <ListasDashboard listas={listas} isComissao={isComissao} />
}
