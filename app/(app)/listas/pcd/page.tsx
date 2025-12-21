import type { ListaKey } from '@/features/listas/loadListasData'
import { ListaDetailPage } from '../lista-detail-page'

export const dynamic = 'force-dynamic'

const LISTA_KEY: ListaKey = 'pcd'

export default async function PcdListaPage() {
  return ListaDetailPage({ listaKey: LISTA_KEY })
}
