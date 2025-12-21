import type { ListaKey } from '@/features/listas/loadListasData'
import { ListaDetailPage } from '../lista-detail-page'

export const dynamic = 'force-dynamic'

const LISTA_KEY: ListaKey = 'ordem'

export default async function OrdemListaPage() {
  return ListaDetailPage({ listaKey: LISTA_KEY })
}
