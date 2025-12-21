import type { ListaKey } from '@/features/listas/loadListasData'
import { ListaDetailPage } from '../lista-detail-page'

export const dynamic = 'force-dynamic'

const LISTA_KEY: ListaKey = 'ppp'

export default async function PppListaPage() {
  return ListaDetailPage({ listaKey: LISTA_KEY })
}
