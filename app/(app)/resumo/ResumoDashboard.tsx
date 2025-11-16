'use client'

import { HeroCard, TitledCard } from '@/src/components/ui/AppCards'
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
    telefone?: string | null
    telefone_whatsapp?: string | null
    instagram?: string | null
    facebook?: string | null
    outras_redes?: string | null
  }
}

export default function ResumoDashboard({
  data,
  isComissao,
  userId,
  profileContact,
}: Props) {
  const { candidate, posicoes, concursoResumo, painelAtual } = data
  const contato = profileContact ?? {}
  const initials = getInitials(candidate.nome)
  const ordemAtual =
    (candidate as { ordem_nomeacao_atual?: number | null })?.ordem_nomeacao_atual ??
    candidate.ordem_nomeacao_base ??
    '—'

  return (
    <div className="flex flex-col gap-6 pb-16">
      <HeroCard
        left={
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-900 text-lg font-semibold text-red-50 shadow-md shadow-red-900/40">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-red-100/80">
                Resumo · Perfil do aprovado
              </div>
              <h1 className="text-xl font-semibold text-white">Olá, {candidate.nome || 'aprovado(a)'}!</h1>
              <p className="text-sm text-red-50/90">
                Sistema: <span className="font-semibold">{candidate.sistema_concorrencia}</span> · Classificação:{' '}
                <span className="font-semibold">{candidate.classificacao_lista}</span> · Ordem base:{' '}
                <span className="font-semibold">{ordemAtual}</span>
              </p>
            </div>
          </div>
        }
        right={
          <div className="space-y-3 text-xs text-red-50/90">
            <div className="font-semibold tracking-[0.22em] text-red-100/80">Seus detalhes</div>
            <p>Contato preferencial: {contato.telefone_whatsapp ?? contato.telefone ?? 'Não informado'}</p>
            <p>Instagram: {contato.instagram ?? 'Não informado'}</p>
            <p>Facebook: {contato.facebook ?? 'Não informado'}</p>
            <p>Outras redes: {contato.outras_redes ?? '—'}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <EditarInfoModal
                userId={userId}
                initialTelefone={contato.telefone_whatsapp ?? contato.telefone ?? undefined}
                initialInstagram={contato.instagram}
                initialFacebook={contato.facebook}
                initialOutrasRedes={contato.outras_redes}
                trigger={
                  <span className="rounded-full bg-black/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-100 hover:bg-black/45">
                    Editar contato
                  </span>
                }
              />
              <EnviarTdModal
                candidateId={candidate.id}
                trigger={
                  <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-700 shadow-sm shadow-black/10 hover:bg-red-50">
                    Enviar TD
                  </span>
                }
              />
              <MinhasAprovacoesModal
                candidateId={candidate.id}
                trigger={
                  <span className="rounded-full border border-white/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-50 hover:bg-white/10">
                    Outras aprovações
                  </span>
                }
              />
              {isComissao ? (
                <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-50">
                  Perfil: Comissão
                </span>
              ) : null}
            </div>
          </div>
        }
      />

      <TitledCard title="Candidatos na frente · Nomeação">
        <div className="flex flex-col gap-2">
          <div className="text-4xl font-semibold text-neutral-900">
            {posicoes.candidatosNaFrenteOrdem}
          </div>
          <p className="text-sm text-neutral-600">
            Considerando apenas TDs confirmados e nomeações registradas.
          </p>
        </div>
      </TitledCard>

      <TitledCard title="Candidatos na frente · Sua lista">
        <div className="flex flex-col gap-2">
          <div className="text-4xl font-semibold text-neutral-900">
            {posicoes.candidatosNaFrenteLista}
          </div>
          <p className="text-sm text-neutral-600">Posição dentro da sua cota (AC, PCD, PPP, Indígena).</p>
        </div>
      </TitledCard>

      <TitledCard title="Total de aprovados TJAA">
        <p className="text-sm text-neutral-700">
          Total: <strong>{concursoResumo.totalAprovados}</strong> · Ampla: {concursoResumo.totalAprovadosAmpla} · PCD:{' '}
          {concursoResumo.totalAprovadosPcd} · PPP: {concursoResumo.totalAprovadosPpp} · Indígena:{' '}
          {concursoResumo.totalAprovadosIndigena}
        </p>
      </TitledCard>

      <TitledCard title="Total de nomeados">
        <p className="text-sm text-neutral-700">
          Total: <strong>{concursoResumo.totalNomeados}</strong> · Ampla: {concursoResumo.totalNomeadosAmpla} · PCD:{' '}
          {concursoResumo.totalNomeadosPcd} · PPP: {concursoResumo.totalNomeadosPpp} · Indígena:{' '}
          {concursoResumo.totalNomeadosIndigena}
        </p>
      </TitledCard>

      {painelAtual ? (
        <TitledCard title={`Painel ${painelAtual.mes}/${painelAtual.ano}`}>
          <p className="text-sm text-neutral-700">
            Vagas autorizadas: {painelAtual.vagas_autorizadas_trt2_tjaa ?? 0} · Cargos vagos totais:{' '}
            {painelAtual.cargos_vagos_trt2_total ?? 0} (oner.: {painelAtual.cargos_vagos_trt2_onerosos ?? 0} · não oner.:
            {painelAtual.cargos_vagos_trt2_nao_onerosos ?? 0})
          </p>
        </TitledCard>
      ) : null}

      <TitledCard title="Em breve" subtitle="Novos cards e notificações">
        Em breve: notificações, nomeações, TDs, vacâncias e outros cards usando os dados já carregados.
      </TitledCard>

      <ComissaoFab isComissao={isComissao} />
    </div>
  )
}

function getInitials(nome: string) {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  )
}
