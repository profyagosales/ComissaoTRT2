import { redirect, notFound } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { loadListasData, LISTA_KEYS, type ListaKey } from '@/features/listas/loadListasData'
import { ListasDashboard } from '@/features/listas/ListasDashboard'

function isListaKey(value: string): value is ListaKey {
  return LISTA_KEYS.includes(value as ListaKey)
}

export const dynamic = 'force-dynamic'

interface ListaDetalhePageProps {
  params: {
    listaKey: string
  }
}

export default async function ListaDetalhePage({ params }: ListaDetalhePageProps) {
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

  if (!isListaKey(params.listaKey)) {
    notFound()
  }

  const listasData = await loadListasData()

  return <ListasDashboard data={listasData} isComissao={profile?.role === 'COMISSAO'} selectedListKey={params.listaKey} />
}
