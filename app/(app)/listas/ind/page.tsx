import type { ListaKey } from '@/features/listas/loadListasData'
import { ListaDetailPage } from '../lista-detail-page'

export const dynamic = 'force-dynamic'

const LISTA_KEY: ListaKey = 'ind'

export default async function IndListaPage() {
  return ListaDetailPage({ listaKey: LISTA_KEY })
}
