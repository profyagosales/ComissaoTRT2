'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useTransition } from 'react'

import {
  createOutraAprovacao,
  createTdRequest,
  updateUserProfileContact,
} from './resumo-actions'
import type { TdRequestTipo } from '@/features/tds/td-types'

type BaseModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function BaseModal({ open, onClose, title, children }: BaseModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-700">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
          >
            Fechar
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function ModalTrigger({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{
      onClick?: (event: React.MouseEvent) => void
    }>

    return React.cloneElement(element, {
      onClick: (event: React.MouseEvent) => {
        element.props.onClick?.(event)
        onClick()
      },
    })
  }

  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}

type EditarInfoModalProps = {
  trigger: React.ReactNode
  userId: string
  initialTelefone?: string | null
  initialInstagram?: string | null
  initialFacebook?: string | null
  initialOutrasRedes?: string | null
}

export function EditarInfoModal(props: EditarInfoModalProps) {
  const [open, setOpen] = useState(false)
  const [telefone, setTelefone] = useState(props.initialTelefone ?? '')
  const [instagram, setInstagram] = useState(props.initialInstagram ?? '')
  const [facebook, setFacebook] = useState(props.initialFacebook ?? '')
  const [outras, setOutras] = useState(props.initialOutrasRedes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        await updateUserProfileContact({
          userId: props.userId,
          telefone: telefone || undefined,
          instagram: instagram || undefined,
          facebook: facebook || undefined,
          outras_redes: outras || undefined,
        })
        setSuccess('Dados de contato atualizados com sucesso.')
        router.refresh()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar dados.')
      }
    })
  }

  return (
    <>
      <ModalTrigger onClick={() => setOpen(true)}>{props.trigger}</ModalTrigger>

      <BaseModal
        open={open}
        onClose={() => {
          if (!isPending) setOpen(false)
        }}
        title="Editar informações de contato"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-neutral-800">
          <p className="text-xs text-neutral-600">
            Esses dados ficam visíveis apenas para a Comissão, para contato sobre TD, nomeações e
            outras pendências.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">
              Telefone / WhatsApp (opcional)
            </label>
            <input
              type="text"
              value={telefone}
              onChange={event => setTelefone(event.target.value)}
              placeholder="(11) 99999-0000"
              className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">Instagram (opcional)</label>
            <input
              type="text"
              value={instagram}
              onChange={event => setInstagram(event.target.value)}
              placeholder="@seuusuario"
              className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">Facebook (opcional)</label>
            <input
              type="text"
              value={facebook}
              onChange={event => setFacebook(event.target.value)}
              placeholder="Perfil ou página"
              className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">
              Outras redes / contato (opcional)
            </label>
            <textarea
              value={outras}
              onChange={event => setOutras(event.target.value)}
              rows={3}
              placeholder="LinkedIn, e-mail alternativo, site pessoal etc."
              className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
          {success && <p className="text-xs font-semibold text-emerald-700">{success}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-400"
            >
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </BaseModal>
    </>
  )
}

type EnviarTdModalProps = {
  trigger: React.ReactNode
  candidateId: string
}

export function EnviarTdModal({ trigger, candidateId }: EnviarTdModalProps) {
  const [open, setOpen] = useState(false)
  const [tipoTd, setTipoTd] = useState<TdRequestTipo>('INTERESSE')
  const [observacao, setObservacao] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!candidateId) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        await createTdRequest({
          tipoTd,
          observacao: observacao.trim() || undefined,
        })
        setSuccess(
          'Solicitação registrada. A Comissão irá analisar e, se aprovado, o TD será refletido nas listas.',
        )
        setObservacao('')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao registrar TD.')
      }
    })
  }

  return (
    <>
      <ModalTrigger onClick={() => setOpen(true)}>{trigger}</ModalTrigger>

      <BaseModal
        open={open}
        onClose={() => {
          if (!isPending) setOpen(false)
        }}
        title="Enviar meu Termo de Desistência (TD)"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm text-neutral-800">
          <p className="text-xs text-neutral-600">
            Preencha esse formulário apenas se você <strong>já enviou</strong> ou pretende enviar o
            Termo de Desistência ao TRT-2.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-700">Situação do TD</p>
            <div className="flex flex-col gap-2 md:flex-row">
              <label className="inline-flex items-center gap-2 rounded-2xl bg-neutral-200/80 px-3 py-2 text-xs text-neutral-800">
                <input
                  type="radio"
                  name="tipo_td"
                  value="INTERESSE"
                  checked={tipoTd === 'INTERESSE'}
                  onChange={() => setTipoTd('INTERESSE')}
                />
                <span>Tenho interesse em enviar TD</span>
              </label>
              <label className="inline-flex items-center gap-2 rounded-2xl bg-neutral-200/80 px-3 py-2 text-xs text-neutral-800">
                <input
                  type="radio"
                  name="tipo_td"
                  value="ENVIADO"
                  checked={tipoTd === 'ENVIADO'}
                  onChange={() => setTipoTd('ENVIADO')}
                />
                <span>Já enviei meu TD ao TRT-2</span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700">Observação (opcional)</label>
            <textarea
              value={observacao}
              onChange={event => setObservacao(event.target.value)}
              rows={4}
              placeholder="Ex.: Enviei o TD em 10/11/2025, protocolo nº XXXXX, aguardo confirmação."
              className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>

          {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
          {success && <p className="text-xs font-semibold text-emerald-700">{success}</p>}

          <div className="pt-2 flex items-center justify-between">
            <p className="max-w-xs text-[11px] text-neutral-500">
              Após a aprovação pela Comissão, seu TD passa a impactar diretamente a ordem de nomeação
              e os resumos do painel.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-400"
            >
              {isPending ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </div>
        </form>
      </BaseModal>
    </>
  )
}

type MinhasAprovacoesModalProps = {
  trigger: React.ReactNode
  candidateId: string
}

export function MinhasAprovacoesModal({
  trigger,
  candidateId,
}: MinhasAprovacoesModalProps) {
  const [open, setOpen] = useState(false)
  const [orgao, setOrgao] = useState('')
  const [cargo, setCargo] = useState('')
  const [sistema, setSistema] = useState<'AC' | 'PCD' | 'PPP' | 'INDIGENA'>('AC')
  const [classificacao, setClassificacao] = useState('')
  const [pretendeAssumir, setPretendeAssumir] = useState<'SIM' | 'NAO' | 'INDEFINIDO'>(
    'INDEFINIDO',
  )
  const [jaNomeado, setJaNomeado] = useState<'SIM' | 'NAO' | 'EM_ANDAMENTO'>('NAO')
  const [observacao, setObservacao] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!orgao.trim() || !cargo.trim()) {
      setError('Preencha pelo menos o órgão e o cargo.')
      return
    }

    const classificacaoNumber = classificacao ? Number(classificacao) : undefined

    if (classificacao && Number.isNaN(classificacaoNumber)) {
      setError('Classificação deve ser um número inteiro.')
      return
    }

    startTransition(async () => {
      try {
        await createOutraAprovacao({
          candidateId,
          orgao: orgao.trim(),
          cargo: cargo.trim(),
          sistemaConcorrencia: sistema,
          classificacao: classificacaoNumber,
          pretendeAssumir,
          jaNomeado,
          observacao: observacao || undefined,
        })
        setSuccess('Aprovação registrada. A Comissão vai validar os dados.')
        setOrgao('')
        setCargo('')
        setClassificacao('')
        setObservacao('')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao registrar aprovação.')
      }
    })
  }

  return (
    <>
      <ModalTrigger onClick={() => setOpen(true)}>{trigger}</ModalTrigger>

      <BaseModal
        open={open}
        onClose={() => {
          if (!isPending) setOpen(false)
        }}
        title="Minhas aprovações em outros concursos"
      >
        <div className="space-y-4 text-sm text-neutral-800">
          <p className="text-xs text-neutral-600">
            Cadastre aqui outras aprovações em concursos públicos. Essas informações ajudam a Comissão
            a projetar possíveis TDs e movimentações em outros órgãos.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Órgão em que fui aprovado
              </label>
              <input
                type="text"
                value={orgao}
                onChange={event => setOrgao(event.target.value)}
                placeholder="Ex.: TRT-15, TRF-3, TJ-SP..."
                className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Cargo</label>
              <input
                type="text"
                value={cargo}
                onChange={event => setCargo(event.target.value)}
                placeholder="Ex.: Técnico Judiciário – Área Administrativa"
                className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Sistema de concorrência
                </label>
                <select
                  value={sistema}
                  onChange={event =>
                    setSistema(event.target.value as 'AC' | 'PCD' | 'PPP' | 'INDIGENA')
                  }
                  className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <option value="AC">Ampla Concorrência</option>
                  <option value="PCD">Pessoa com Deficiência</option>
                  <option value="PPP">Pessoas Pretas e Pardas</option>
                  <option value="INDIGENA">Indígena</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Classificação (opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={classificacao}
                  onChange={event => setClassificacao(event.target.value)}
                  placeholder="3"
                  className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Pretende assumir?
                </label>
                <select
                  value={pretendeAssumir}
                  onChange={event =>
                    setPretendeAssumir(event.target.value as 'SIM' | 'NAO' | 'INDEFINIDO')
                  }
                  className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <option value="SIM">Sim</option>
                  <option value="NAO">Não</option>
                  <option value="INDEFINIDO">Ainda não sei</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Já foi nomeado?</label>
                <select
                  value={jaNomeado}
                  onChange={event =>
                    setJaNomeado(event.target.value as 'SIM' | 'NAO' | 'EM_ANDAMENTO')
                  }
                  className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <option value="NAO">Não</option>
                  <option value="EM_ANDAMENTO">Em andamento (homologação etc.)</option>
                  <option value="SIM">Sim</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">Observação (opcional)</label>
              <textarea
                value={observacao}
                onChange={event => setObservacao(event.target.value)}
                rows={3}
                placeholder="Ex.: Concurso do TJ-SP com previsão de nomeação para 2026..."
                className="w-full rounded-2xl border border-neutral-300 bg-neutral-200/70 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
            {success && <p className="text-xs font-semibold text-emerald-700">{success}</p>}

            <div className="pt-2 flex items-center justify-between">
              <p className="max-w-xs text-[11px] text-neutral-500">
                Após a aprovação da Comissão, essas informações passam a aparecer nos painéis internos e
                listas resumidas.
              </p>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full bg-red-700 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {isPending ? 'Enviando...' : 'Cadastrar aprovação'}
              </button>
            </div>
          </form>
        </div>
      </BaseModal>
    </>
  )
}
