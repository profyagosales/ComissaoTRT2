import { notFound } from 'next/navigation'

import { LISTA_KEYS, type ListaKey } from '@/features/listas/loadListasData'
import { ListaDetailPage } from '../lista-detail-page'

export const dynamic = 'force-dynamic'

interface ListaDetalhePageProps {
  params: Promise<{
    listaKey: string
  }>
}

function isListaKey(value: string): value is ListaKey {
  return LISTA_KEYS.includes(value as ListaKey)
}

export default async function ListaDetalhePage({ params }: ListaDetalhePageProps) {
  const { listaKey } = await params

  if (!isListaKey(listaKey)) {
    notFound()
  }

  return ListaDetailPage({ listaKey })
}
