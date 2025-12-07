'use client'

import { Pencil } from 'lucide-react'

import { ResumoHero } from '@/src/components/resumo/ResumoHero'
import type { CandidateResumoData } from '@/src/app/(app)/resumo/loadResumoData'
import { EditarOutraAprovacaoModal } from '@/src/app/(app)/resumo/ResumoModals'
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
    avatarUrl?: string | null
  }
  variant?: 'full' | 'perfil'
}

const SISTEMA_LABELS: Record<string, string> = {
  AC: 'Ampla concorrência',
  PCD: 'Pessoa com deficiência',
  PPP: 'Pessoas pretas e pardas',
  INDIGENA: 'Indígena',
}

type TotaisPorSistema = {
  total: number
  ampla: number
  pcd: number
  ppp: number
  indigena: number
}

function buildTotaisTDs(data: CandidateResumoData): TotaisPorSistema {
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
  userId,
  profileContact,
  variant = 'full',
}: Props) {
  const {
    candidate,
    posicoes,
    concursoResumo,
    outrasAprovacoes,
    tdContent,
    resumoConfig,
  } = data

  const contato = profileContact ?? {}
  const contatoAvatar = contato.avatarUrl ?? null
  const ordemAtualNumero =
    (candidate as { ordem_nomeacao_atual?: number | null })?.ordem_nomeacao_atual ??
    candidate.ordem_nomeacao_base ??
    null
  const concorrenciaLabel =
    SISTEMA_LABELS[candidate.sistema_concorrencia] ?? candidate.sistema_concorrencia
  const contatoEmail = contato.email ?? 'Não informado'
  const contatoTelefone = contato.telefone ?? 'Não informado'
  const contatoInstagram = contato.instagram ?? 'Não informado'
  const actionButtonClass =
    'inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/16 px-3 py-1 text-[12px] font-medium text-white/90 shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition-colors hover:border-white/45 hover:bg-white/24 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60'
  const iconActionButtonClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/16 text-white/85 shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition-colors hover:border-white/45 hover:bg-white/24 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60'

  const totaisTDs = buildTotaisTDs(data)
  const frenteLista = posicoes.candidatosNaFrenteLista ?? 0

  const heroSection = (
    <ResumoHero
      nome={candidate.nome}
      email={contatoEmail}
      telefone={contatoTelefone}
      instagram={contatoInstagram}
      concorrenciaLabel={concorrenciaLabel}
      ordemNomeacaoDisplay={ordemAtualNumero}
      classificacaoDisplay={candidate.classificacao_lista}
      tdStatus={candidate.td_status}
      tdObservacao={candidate.td_observacao}
      outrasAprovacoes={outrasAprovacoes}
      avatarUrl={contatoAvatar}
      frenteLista={frenteLista}
      concursoResumo={concursoResumo}
      totaisTDs={totaisTDs}
      resumoConfig={resumoConfig}
      editContactAction={
        <EditarInfoModal
          userId={userId}
          initialTelefone={contato.telefone ?? undefined}
          initialInstagram={contato.instagram}
          initialFacebook={contato.facebook}
          initialOutrasRedes={contato.outras_redes}
          initialAvatarUrl={contato.avatarUrl}
          trigger={
            <button type="button" className={actionButtonClass}>
              Editar dados
            </button>
          }
        />
      }
      enviarTdAction={
        <EnviarTdModal
          candidateId={candidate.id}
          tdContent={tdContent}
          trigger={
            <button type="button" className={actionButtonClass}>
              Enviar TD
            </button>
          }
        />
      }
      novaAprovacaoAction={
        <MinhasAprovacoesModal
          candidateId={candidate.id}
          trigger={
            <button type="button" className={actionButtonClass}>
              Adicionar aprovação
            </button>
          }
        />
      }
      renderOutraAprovacaoEditor={approval => (
        <EditarOutraAprovacaoModal
          key={`editar-${approval.id}`}
          candidateId={candidate.id}
          approval={approval}
          trigger={
            <button
              type="button"
              className={iconActionButtonClass}
              aria-label="Editar aprovação"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          }
        />
      )}
    />
  )

  if (variant === 'perfil') {
    return (
      <main className="w-full space-y-6 px-2 pb-28 pt-4 sm:px-3 lg:px-4 xl:px-5">
        {heroSection}
      </main>
    )
  }

  return (
    <main className="w-full space-y-6 px-2 pb-28 pt-4 sm:px-3 lg:px-4 xl:px-5">
      <div className="hidden md:block">{heroSection}</div>

      <div className="space-y-1 md:hidden">
        <h1 className="font-display text-lg font-semibold text-[#0f2f47]">Resumo</h1>
        <p className="text-sm text-[#0f2f47]/70">
          Acompanhe sua posição, notificações e critérios sem sair do painel.
        </p>
      </div>

    </main>
  )
}


