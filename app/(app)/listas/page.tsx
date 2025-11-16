import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { loadListasData } from '@/features/listas/loadListasData'
import { ListasDashboard } from '@/features/listas/ListasDashboard'

export const dynamic = 'force-dynamic'

export default async function ListasPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('user_id', session.user.id)
    .maybeSingle()

  const listasData = await loadListasData()

  return <ListasDashboard data={listasData} isComissao={profile?.role === 'COMISSAO'} />
}
