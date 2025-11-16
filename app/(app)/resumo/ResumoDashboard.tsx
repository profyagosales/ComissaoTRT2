'use client'

import { ResumoHero } from '@/src/components/resumo/ResumoHero'
import type { ResumoSliderData } from '@/src/components/resumo/ResumoSlider'
import { ConcursoInfoSlider } from '@/src/components/resumo/ConcursoInfoSlider'
import { UltimasNotificacoesCard } from '@/src/components/resumo/UltimasNotificacoesCard'
import { ComissaoFab } from '@/src/app/(app)/resumo/ComissaoFab'
import type { CandidateResumoData } from '@/src/app/(app)/resumo/loadResumoData'
import {
  EditarInfoModal,
  EnviarTdModal,
  MinhasAprovacoesModal,
} from '@/src/app/(app)/resumo/ResumoModals'

type Props = {
  data: CandidateResumoData
  isComissao: boolean
  userId: string
  profileContact?: {
    email?: string | null
    telefone?: string | null
    instagram?: string | null
    facebook?: string | null
    outras_redes?: string | null
  }
}

const SISTEMA_LABELS: Record<string, string> = {
  AC: 'Ampla concorrência',
  PCD: 'Pessoa com deficiência',
  PPP: 'Pessoas pretas e pardas',
  INDIGENA: 'Indígena',
}

function buildTotaisTDs(data: CandidateResumoData): ResumoSliderData['totaisTDs'] {
  const totals = {
    total: 0,
    ampla: 0,
    pcd: 0,
    ppp: 0,
    indigena: 0,
  }

  data.ultimosTDs.forEach(td => {
    totals.total += 1
    const sistema = (td.sistema_concorrencia ?? '').toUpperCase()
    if (sistema === 'PCD') {
      totals.pcd += 1
    } else if (sistema === 'PPP') {
      totals.ppp += 1
    } else if (sistema === 'INDIGENA') {
      totals.indigena += 1
    } else {
      totals.ampla += 1
    }
  })

  return totals
}

export default function ResumoDashboard({
  data,
  isComissao,
  userId,
  profileContact,
}: Props) { 
  const {
    candidate,
    posicoes,
    concursoResumo,
    painelAtual,
    ultimasNotificacoes,
    outrasAprovacoesCount,
  } = data
  const contato = profileContact ?? {}
  const ordemAtual =
    (candidate as { ordem_nomeacao_atual?: number | null })?.ordem_nomeacao_atual ??
    candidate.ordem_nomeacao_base ??
    '—'
  const perfilLabel = isComissao ? 'Perfil da comissão' : 'Perfil do aprovado'
  const concorrenciaLabel =
    SISTEMA_LABELS[candidate.sistema_concorrencia] ?? candidate.sistema_concorrencia
  const contatoEmail = contato.email ?? 'Não informado'
  const contatoTelefone = contato.telefone ?? 'Não informado'
  const contatoRedes = 
    [contato.instagram, contato.facebook, contato.outras_redes]
      .filter(Boolean)
      .join(' · ') || 'Não informado'
  const outrasAprovacoesText = outrasAprovacoesCount
    ? `${outrasAprovacoesCount} aprovação(ões) cadastrada(s) em outros concursos.`
    : 'Nenhuma outra aprovação cadastrada ainda.'
  const sliderData: ResumoSliderData = {
    concorrenciaLabel,
    ordemNomeacao: ordemAtual,
    classificacaoOrigem: candidate.classificacao_lista ?? '—',
    frenteOrdem: posicoes.candidatosNaFrenteOrdem ?? 0,
    frenteSistema: posicoes.candidatosNaFrenteLista ?? 0,
    totaisAprovados: {
      total: concursoResumo.totalAprovados ?? 0,
      ampla: concursoResumo.totalAprovadosAmpla ?? 0,
      pcd: concursoResumo.totalAprovadosPcd ?? 0,
      ppp: concursoResumo.totalAprovadosPpp ?? 0,
      indigena: concursoResumo.totalAprovadosIndigena ?? 0,
    },
    totaisNomeados: {
      total: concursoResumo.totalNomeados ?? 0,
      ampla: concursoResumo.totalNomeadosAmpla ?? 0,
      pcd: concursoResumo.totalNomeadosPcd ?? 0,
      ppp: concursoResumo.totalNomeadosPpp ?? 0,
      indigena: concursoResumo.totalNomeadosIndigena ?? 0,
    },
    totaisTDs: buildTotaisTDs(data),
  }

  return (
    <main className="w-full px-2 sm:px-3 lg:px-4 xl:px-5 space-y-6 pb-16">
      <ResumoHero
        nome={candidate.nome}
        email={contatoEmail}
        telefone={contatoTelefone}
        redesSociais={contatoRedes}
        perfilLabel={perfilLabel}
        sliderData={sliderData}
        outrasAprovacoesText={outrasAprovacoesText}
        editContactAction={
          <EditarInfoModal
            userId={userId}
            initialTelefone={contato.telefone ?? undefined}
            initialInstagram={contato.instagram}
            initialFacebook={contato.facebook}
            initialOutrasRedes={contato.outras_redes}
            trigger={
              <button className="inline-flex min-w-[150px] items-center justify-center rounded-full bg-[#C62828] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_7px_20px_rgba(198,40,40,0.3)] transition-colors hover:bg-[#a71d1d]">
                Editar contato
              </button>
            }
          />
        }
        enviarTdAction={
          <EnviarTdModal
            candidateId={candidate.id}
            trigger={
              <button
                className="btn-td-pulse inline-flex min-w-[150px] items-center justify-center rounded-full border border-[#C62828] px-6 py-2.5 text-sm font-semibold shadow-[0_0_25px_rgba(198,40,40,0.4)] ring-2 ring-transparent transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#FFCDD2]"
              >
                Enviar TD
              </button>
            }
          />
        }
        verEditarAprovacoesAction={
          <MinhasAprovacoesModal
            candidateId={candidate.id}
            trigger={
              <button className="inline-flex min-w-[150px] items-center justify-center rounded-full bg-[#C62828] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_7px_20px_rgba(198,40,40,0.3)] transition-colors hover:bg-[#a71d1d]">
                Ver/editar
              </button>
            }
          />
        }
        novaAprovacaoAction={
          <MinhasAprovacoesModal
            candidateId={candidate.id}
            trigger={
              <button className="inline-flex min-w-[150px] items-center justify-center rounded-full bg-[#C62828] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_7px_20px_rgba(198,40,40,0.3)] transition-colors hover:bg-[#a71d1d]">
                + Aprovação
              </button>
            }
          />
        }
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <ConcursoInfoSlider painelAtual={painelAtual} concursoResumo={concursoResumo} />
        <UltimasNotificacoesCard notificacoes={ultimasNotificacoes} />
      </section>

      <ComissaoFab isComissao={isComissao} />
    </main>
  )
}


