'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import DOMPurify from 'dompurify'
import { AlertTriangle, NotebookPen, UserRound, X } from 'lucide-react'

import { createTdRequest, updateUserProfileContact } from './resumo-actions'
import {
  requestOutraAprovacaoCreate,
  requestOutraAprovacaoUpdate,
} from '@/features/listas/listas-actions'
import type { OutraAprovacaoItem } from '@/src/components/resumo/ResumoHeroNew'
import type { TdRequestTipo } from '@/features/tds/td-types'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { DEFAULT_TD_CONTENT, type TdContentSettings } from '@/features/tds/td-content'
import { useToast } from '@/components/ui/toast-provider'

type BaseModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function BaseModal({ open, onClose, title, children }: BaseModalProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 hidden bg-[#021d33]/20 backdrop-blur-md md:block" aria-hidden="true" />

      <div className="fixed inset-0 z-50 flex h-full w-full flex-col bg-white md:items-center md:justify-center md:px-6 md:py-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-white via-white to-[#eef4fb] px-5 pb-6 pt-5 text-[#0f2f47] shadow-[0_18px_60px_rgba(6,33,54,0.18)] sm:px-6 sm:pb-7 sm:pt-6 md:h-[540px] md:w-[720px] md:max-h-[75vh] md:rounded-[26px] md:border md:border-[#0f2f47]/12 md:px-8 md:py-6"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[#0f2f47]/12 pb-3">
            <h2 className="font-display text-lg font-semibold text-[#0f2f47]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#0f2f47]/15 bg-white/80 text-[#0f2f47]/70 transition hover:border-[#0f2f47]/30 hover:text-[#0f2f47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067a0]/40"
              aria-label="Fechar modal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="mt-4 flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </>
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

const modalLabelClass =
  'text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0f2f47]/65'
const modalInputClass =
  'w-full rounded-2xl border border-[#0f2f47]/14 bg-white px-3 py-2 text-[13px] text-[#0f2f47] placeholder:text-[#0f2f47]/45 focus:border-[#0067a0] focus:outline-none focus:ring-2 focus:ring-[#0067a0]/25'
const modalSelectClass =
  'w-full rounded-2xl border border-[#0f2f47]/14 bg-white px-3 py-2 text-[13px] text-[#0f2f47] focus:border-[#0067a0] focus:outline-none focus:ring-2 focus:ring-[#0067a0]/25'
const modalTextareaClass = modalInputClass
const modalRadioLabelClass =
  'inline-flex items-center gap-2 rounded-2xl border border-[#0067a0]/25 bg-white px-3 py-2 text-[12px] text-[#0f2f47] transition hover:border-[#0067a0]/45 hover:bg-[#eaf4fb]'
const modalHelperTextClass = 'text-[12px] text-[#0f2f47]/65'
const modalErrorClass = 'text-[12px] font-semibold text-[#d45555]'
const modalPrimaryButtonClass =
  'inline-flex h-11 items-center justify-center rounded-full bg-[#0067a0] px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(0,58,96,0.22)] transition hover:bg-[#005885] disabled:cursor-not-allowed disabled:opacity-60'
const modalSecondaryButtonClass =
  'inline-flex h-11 items-center justify-center rounded-full border border-[#0067a0]/40 px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#005885] transition hover:border-[#0067a0] hover:text-[#003d63]'

const CARGO_PRESET_OPTIONS = ['TJAA', 'TJ-APJ', 'TJ-TI', 'AJAJ', 'AJAA', 'AJ-TI', 'OJAF'] as const
const CARGO_OTHER_OPTION = 'Outros' as const

type CargoPresetOption = (typeof CARGO_PRESET_OPTIONS)[number]
type CargoSelectOption = CargoPresetOption | typeof CARGO_OTHER_OPTION | ''

const NOMEACAO_STATUS_OPTIONS = [
  'Tomei posse',
  'Não tomei posse',
  'Final de fila',
  'Enviei TD',
  'Nomeação sem efeito',
] as const

type NomeacaoStatusOption = (typeof NOMEACAO_STATUS_OPTIONS)[number]

const NOMEACAO_STATUS_PREFIX = '[Status pós-nomeação:'

const composeObservacaoWithStatus = (status: NomeacaoStatusOption | '', text: string) => {
  const trimmedText = text.trim()

  if (!status) {
    return trimmedText
  }

  const statusLine = `${NOMEACAO_STATUS_PREFIX} ${status}]`
  if (trimmedText) {
    return `${statusLine}\n${trimmedText}`
  }
  return statusLine
}

const parseObservacaoWithStatus = (value: string | null | undefined) => {
  if (!value) {
    return { status: '' as NomeacaoStatusOption | '', observation: '' }
  }

  const regex = new RegExp(`^\\[Status pós-nomeação:\\s*(.+?)\\]\\s*\n?`, 'i')
  const match = value.match(regex)

  if (!match) {
    return { status: '' as NomeacaoStatusOption | '', observation: value }
  }

  const potentialStatus = match[1]?.trim() ?? ''
  const isKnownStatus = (NOMEACAO_STATUS_OPTIONS as readonly string[]).includes(potentialStatus)

  if (!isKnownStatus) {
    return { status: '' as NomeacaoStatusOption | '', observation: value }
  }

  const observation = value.replace(regex, '').trimStart()

  return {
    status: potentialStatus as NomeacaoStatusOption,
    observation,
  }
}

const MAX_MODEL_LABEL_LENGTH = 48

const sanitizeHtml = (value: string) => {
  const sanitizeFn = (DOMPurify as unknown as { sanitize?: (input: string) => string }).sanitize ??
    (DOMPurify as unknown as { default?: { sanitize?: (input: string) => string } }).default?.sanitize

  if (typeof sanitizeFn === 'function') {
    return sanitizeFn(value)
  }

  return value
}

const sanitizeModelLabel = (rawLabel?: string | null) => {
  const fallback = rawLabel?.trim() || 'Termo de desistência'
  return sanitizeHtml(fallback)
}

const formatModelButtonLabel = (rawLabel?: string | null) => {
  const fallback = rawLabel?.trim() || 'Termo de desistência'
  if (fallback.length <= MAX_MODEL_LABEL_LENGTH) return fallback
  return `${fallback.slice(0, MAX_MODEL_LABEL_LENGTH - 1).trimEnd()}…`
}

type EditarInfoModalProps = {
  trigger: React.ReactNode
  userId: string
  initialTelefone?: string | null
  initialInstagram?: string | null
  initialFacebook?: string | null
  initialOutrasRedes?: string | null
  initialAvatarUrl?: string | null
}

export function EditarInfoModal(props: EditarInfoModalProps) {
  const [open, setOpen] = useState(false)
  const [telefone, setTelefone] = useState(props.initialTelefone ?? '')
  const [instagram, setInstagram] = useState(props.initialInstagram ?? '')
  const [facebook, setFacebook] = useState(props.initialFacebook ?? '')
  const [outras, setOutras] = useState(props.initialOutrasRedes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, beginTransition] = useTransition()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(props.initialAvatarUrl ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    if (!open) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      return
    }

    // Reset avatar preview and controls whenever the modal reabre.
    React.startTransition(() => {
      setAvatarPreview(props.initialAvatarUrl ?? null)
      setAvatarFile(null)
      setAvatarRemoved(false)
    })
  }, [open, props.initialAvatarUrl])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem precisa ter no máximo 5MB.')
      showToast('A imagem precisa ter no máximo 5MB.', { variant: 'error' })
      event.target.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    objectUrlRef.current = objectUrl

    setError(null)
    setAvatarFile(file)
    setAvatarPreview(objectUrl)
    setAvatarRemoved(false)
    event.target.value = ''
  }

  const handleAvatarRemove = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarRemoved(true)
    setError(null)
  }

  const resolveStoragePathFromUrl = (url: string | null | undefined) => {
    if (!url) return null
    const marker = '/storage/v1/object/public/avatars/'
    const index = url.indexOf(marker)
    if (index === -1) return null
    return url.substring(index + marker.length)
  }

  const uploadAvatar = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `public/${props.userId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabaseBrowser.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro ao enviar avatar:', uploadError)
      throw new Error('Não foi possível salvar a nova foto de perfil.')
    }

    const publicResult = supabaseBrowser.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = publicResult.data?.publicUrl ?? null

    if (!publicUrl) {
      throw new Error('Não foi possível salvar a nova foto de perfil.')
    }

    return { publicUrl, storagePath: filePath }
  }

  const deleteAvatarByPath = async (path: string | null) => {
    if (!path) return

    const { error: deleteError } = await supabaseBrowser.storage
      .from('avatars')
      .remove([path])

    if (deleteError) {
      console.error('Erro ao remover avatar do armazenamento:', deleteError)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    beginTransition(async () => {
      const previousAvatarUrl = props.initialAvatarUrl ?? null
      const shouldRemoveAvatar = avatarRemoved && !avatarFile
      let uploadedAvatar: { publicUrl: string; storagePath: string } | null = null

      try {
        if (avatarFile) {
          uploadedAvatar = await uploadAvatar(avatarFile)
        }

        const avatarUrlToPersist = avatarFile
          ? uploadedAvatar?.publicUrl ?? null
          : shouldRemoveAvatar
            ? null
            : undefined

        await updateUserProfileContact({
          userId: props.userId,
          telefone: telefone || undefined,
          instagram: instagram || undefined,
          facebook: facebook || undefined,
          outras_redes: outras || undefined,
          avatarUrl: avatarUrlToPersist,
        })

        if (avatarFile || shouldRemoveAvatar) {
          await deleteAvatarByPath(resolveStoragePathFromUrl(previousAvatarUrl))
        }

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        setAvatarFile(null)
        setAvatarRemoved(false)
        if (avatarFile) {
          setAvatarPreview(uploadedAvatar?.publicUrl ?? null)
        } else if (shouldRemoveAvatar) {
          setAvatarPreview(null)
        }

        router.refresh()
  setError(null)
        setOpen(false)
        showToast('Dados de contato atualizados com sucesso.', { variant: 'success' })
      } catch (err: unknown) {
        if (uploadedAvatar?.storagePath) {
          await deleteAvatarByPath(uploadedAvatar.storagePath)
        }
        const message = err instanceof Error ? err.message : 'Erro ao salvar dados.'
        setError(message)
        showToast(message, { variant: 'error' })
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
        <form onSubmit={handleSubmit} className="flex h-full flex-col text-[13px] text-[#0f2f47]/85">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-2xl border border-[#FBDB65]/45 bg-[#FBDB65]/18 px-4 py-3 text-[#5a4400]">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBDB65] text-[#1e2a36]">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-[12px] font-medium leading-snug">
                  Os seus dados ficam visíveis apenas à Comissão, para contato sobre TD, nomeações e outras pendências.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className={modalLabelClass}>
                Foto de perfil
              </label>
              <div className="flex flex-col gap-4 rounded-2xl border border-[#0f2f47]/12 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#0f2f47]/15 bg-[#eff5fb]">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt="Foto de perfil do candidato"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-7 w-7 text-[#0f2f47]/40" aria-hidden="true" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="text-[11px] font-medium text-[#0f2f47]">
                      {avatarFile
                        ? `Selecionado: ${avatarFile.name}`
                        : avatarPreview
                          ? 'Esta é a sua foto atual.'
                          : 'Nenhuma foto enviada ainda.'}
                    </p>
                    <p className="text-[11px] text-[#0f2f47]/65">
                      PNG ou JPG até 5MB.
                    </p>
                    {avatarRemoved && !avatarFile && (
                      <p className="text-[11px] font-semibold text-[#d45555]">
                        A foto será removida ao salvar.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:flex-none">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center rounded-full bg-[#0067a0] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(0,58,96,0.18)] transition hover:bg-[#005885] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067a0]/40"
                  >
                    {avatarPreview || avatarFile ? 'Alterar foto' : 'Enviar foto'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={!avatarPreview && !avatarFile}
                    className="inline-flex items-center justify-center rounded-full border border-[#0f2f47]/22 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f2f47]/70 transition hover:border-[#0f2f47]/40 hover:text-[#0f2f47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2f47]/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            <div className="space-y-2">
              <label className={modalLabelClass}>
                Telefone / WhatsApp (opcional)
              </label>
              <input
                type="text"
                value={telefone}
                onChange={event => setTelefone(event.target.value)}
                placeholder="(11) 99999-0000"
                className={modalInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={modalLabelClass}>
                Instagram (opcional)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={event => setInstagram(event.target.value)}
                placeholder="@seuusuario"
                className={modalInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={modalLabelClass}>
                Facebook (opcional)
              </label>
              <input
                type="text"
                value={facebook}
                onChange={event => setFacebook(event.target.value)}
                placeholder="Perfil ou página"
                className={modalInputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={modalLabelClass}>
                Outras redes / contato (opcional)
              </label>
              <textarea
                value={outras}
                onChange={event => setOutras(event.target.value)}
                rows={3}
                placeholder="LinkedIn, e-mail alternativo, site pessoal etc."
                className={modalTextareaClass}
              />
            </div>

            {error && <p className={modalErrorClass}>{error}</p>}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className={modalPrimaryButtonClass}
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
  tdContent?: TdContentSettings
}

export function EnviarTdModal({ trigger, candidateId, tdContent }: EnviarTdModalProps) {
  const effectiveContent = tdContent ?? DEFAULT_TD_CONTENT
  const [open, setOpen] = useState(false)
  const [tipoTd, setTipoTd] = useState<TdRequestTipo>('INTERESSE')
  const [observacao, setObservacao] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, beginTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  const sanitizedGuidelines = useMemo(
    () => sanitizeHtml(effectiveContent.guidelinesHtml ?? ''),
    [effectiveContent.guidelinesHtml],
  )

  const sanitizedModels = useMemo(
    () =>
      (Array.isArray(effectiveContent.models) ? effectiveContent.models : []).map(model => ({
        url: model.url,
        labelHtml: sanitizeModelLabel(model.label),
        buttonLabel: formatModelButtonLabel(model.label),
      })),
    [effectiveContent.models],
  )

  if (!candidateId) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    beginTransition(async () => {
      try {
        await createTdRequest({
          tipoTd,
          observacao: observacao.trim() || undefined,
        })
        router.refresh()
        setObservacao('')
        setTipoTd('INTERESSE')
        setError(null)
        setOpen(false)
        showToast(
          'Solicitação registrada. A Comissão irá analisar e, se aprovado, o TD será refletido nas listas.',
          { variant: 'success' },
        )
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao registrar TD.'
        setError(message)
        showToast(message, { variant: 'error' })
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
        <form onSubmit={handleSubmit} className="flex h-full flex-col text-[13px] text-[#0f2f47]/85">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-2xl border border-[#99c9ff]/45 bg-[#eaf2ff] px-4 py-3 text-[#163a67]">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#99c9ff] text-[#0f2f47]">
                  <NotebookPen className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-[12px] font-medium leading-snug">
                  Preencha este formulário apenas se você{' '}
                  <strong className="font-semibold text-[#0d4c86]">já enviou</strong> ou pretende enviar o Termo de Desistência ao TRT-2.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className={modalLabelClass}>Situação do TD</p>
              <div className="flex flex-col gap-2 md:flex-row">
                <label className={modalRadioLabelClass}>
                  <input
                    type="radio"
                    name="tipo_td"
                    value="INTERESSE"
                    checked={tipoTd === 'INTERESSE'}
                    onChange={() => setTipoTd('INTERESSE')}
                    className="accent-[#0067a0]"
                  />
                  <span>Tenho interesse em enviar TD</span>
                </label>
                <label className={modalRadioLabelClass}>
                  <input
                    type="radio"
                    name="tipo_td"
                    value="ENVIADO"
                    checked={tipoTd === 'ENVIADO'}
                    onChange={() => setTipoTd('ENVIADO')}
                    className="accent-[#0067a0]"
                  />
                  <span>Já enviei meu TD ao TRT-2</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className={modalLabelClass}>Observação (opcional)</label>
              <textarea
                value={observacao}
                onChange={event => setObservacao(event.target.value)}
                rows={4}
                placeholder="Ex.: Enviei o TD em 10/11/2025, protocolo nº XXXXX, aguardo confirmação."
                className={modalTextareaClass}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-2xl border border-[#0f2f47]/12 bg-white px-4 py-4 shadow-[0_6px_18px_rgba(3,36,60,0.08)]">
                <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0f2f47]/80">
                  Orientações gerais
                </h3>
                <div
                  className="text-[12px] leading-relaxed text-[#0f2f47]/85 [&_a]:font-semibold [&_a]:text-[#0d4c86] [&_a]:underline [&_p:not(:last-child)]:mb-2"
                  dangerouslySetInnerHTML={{ __html: sanitizedGuidelines }}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-[#0f2f47]/12 bg-white px-4 py-4 shadow-[0_6px_18px_rgba(3,36,60,0.08)]">
                <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-[#0f2f47]/80">
                  Modelo de TD
                </h3>

                {sanitizedModels.length ? (
                  <div className="space-y-3 text-[#0f2f47]/85">
                    {sanitizedModels.map((model, index) => (
                      <div key={`td-model-modal-${index}`} className="space-y-2">
                        <div
                          className="text-[12px] leading-relaxed [&_a]:font-semibold [&_a]:text-[#0d4c86] [&_a]:underline"
                          dangerouslySetInnerHTML={{ __html: model.labelHtml }}
                        />
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={model.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`Abrir ${model.buttonLabel}`}
                            title={model.buttonLabel}
                            className="inline-flex items-center gap-1 rounded-full bg-[#FFCD00] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_24px_rgba(255,205,0,0.25)] transition hover:translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFCD00]"
                          >
                            Abrir
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#0f2f47]/60">
                    Nenhum modelo disponível no momento.
                  </p>
                )}
              </div>
            </div>

            {error && <p className={modalErrorClass}>{error}</p>}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`max-w-xs ${modalHelperTextClass}`}>
              Após a aprovação pela Comissão, seu TD passa a impactar diretamente a ordem de nomeação
              e os resumos do painel.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className={modalPrimaryButtonClass}
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
  const [cargoOption, setCargoOption] = useState<CargoSelectOption>('')
  const [customCargo, setCustomCargo] = useState('')
  const [sistema, setSistema] = useState<'AC' | 'PCD' | 'PPP' | 'INDIGENA'>('AC')
  const [classificacao, setClassificacao] = useState('')
  const [pretendeAssumir, setPretendeAssumir] = useState<'SIM' | 'NAO' | 'INDEFINIDO'>(
    'INDEFINIDO',
  )
  const [jaNomeado, setJaNomeado] = useState<'SIM' | 'NAO'>('NAO')
  const [jaNomeadoStatus, setJaNomeadoStatus] = useState<NomeacaoStatusOption | ''>('')
  const [observacao, setObservacao] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, beginTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  const handleCargoOptionChange = (value: CargoSelectOption) => {
    setCargoOption(value)

    if (value === CARGO_OTHER_OPTION) {
      setCargo('')
      setCustomCargo('')
      return
    }

    if (value === '') {
      setCargo('')
      setCustomCargo('')
      return
    }

    setCargo(value)
    setCustomCargo('')
  }

  const handleCustomCargoChange = (value: string) => {
    setCustomCargo(value)
    setCargo(value)
  }

  const handleJaNomeadoChange = (value: 'SIM' | 'NAO') => {
    setJaNomeado(value)
    if (value !== 'SIM') {
      setJaNomeadoStatus('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!orgao.trim() || !cargo.trim()) {
      setError('Preencha pelo menos o órgão e o cargo.')
      showToast('Preencha pelo menos o órgão e o cargo.', { variant: 'error' })
      return
    }

    const classificacaoNumber = classificacao ? Number(classificacao) : undefined

    if (classificacao && Number.isNaN(classificacaoNumber)) {
      setError('Classificação deve ser um número inteiro.')
      showToast('Classificação deve ser um número inteiro.', { variant: 'error' })
      return
    }

    if (jaNomeado === 'SIM' && !jaNomeadoStatus) {
      setError('Informe o status após a nomeação.')
      showToast('Informe o status após a nomeação.', { variant: 'error' })
      return
    }

    beginTransition(async () => {
      try {
        const observacaoPayload = composeObservacaoWithStatus(
          jaNomeado === 'SIM' ? jaNomeadoStatus : '',
          observacao,
        )

        await requestOutraAprovacaoCreate({
          candidateId,
          orgao: orgao.trim(),
          cargo: cargo.trim(),
          sistemaConcorrencia: sistema,
          classificacao: classificacaoNumber ?? null,
          pretendeAssumir,
          jaNomeado,
          observacao: observacaoPayload || undefined,
        })
        router.refresh()
        setOrgao('')
        setCargo('')
        setCargoOption('')
        setCustomCargo('')
        setClassificacao('')
        setObservacao('')
        setJaNomeado('NAO')
        setJaNomeadoStatus('')
        setError(null)
        setOpen(false)
        showToast('Aprovação registrada. A Comissão vai validar os dados.', {
          variant: 'success',
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao registrar aprovação.'
        setError(message)
        showToast(message, { variant: 'error' })
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
        <form onSubmit={handleSubmit} className="flex h-full flex-col text-[13px] text-[#0f2f47]/85">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="rounded-2xl border border-[#99c9ff]/45 bg-[#eaf2ff] px-4 py-3 text-[#163a67]">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#99c9ff] text-[#0f2f47]">
                  <NotebookPen className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-[12px] font-medium leading-snug">
                  Cadastre aqui outras aprovações em concursos públicos.<br />
                  Essas informações ajudam a Comissão a projetar possíveis TDs e movimentações em outros órgãos.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className={modalLabelClass}>Órgão em que fui aprovado</label>
                <input
                  type="text"
                  value={orgao}
                  onChange={event => setOrgao(event.target.value)}
                  placeholder="Ex.: TRT-15, TRF-3, TJ-SP..."
                  className={modalInputClass}
                />
              </div>

              <div className="space-y-2">
                <label className={modalLabelClass}>Cargo</label>
                <select
                  value={cargoOption}
                  onChange={event =>
                    handleCargoOptionChange(event.target.value as CargoSelectOption)
                  }
                  className={modalSelectClass}
                >
                  <option value="">Selecione uma opção</option>
                  {CARGO_PRESET_OPTIONS.map(option => (
                    <option key={`cargo-option-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={CARGO_OTHER_OPTION}>{CARGO_OTHER_OPTION}</option>
                </select>
                {cargoOption === CARGO_OTHER_OPTION && (
                  <input
                    type="text"
                    value={customCargo}
                    onChange={event => handleCustomCargoChange(event.target.value)}
                    placeholder="Digite o cargo"
                    className={modalInputClass}
                  />
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className={modalLabelClass}>Sistema de concorrência</label>
                <select
                  value={sistema}
                  onChange={event =>
                    setSistema(event.target.value as 'AC' | 'PCD' | 'PPP' | 'INDIGENA')
                  }
                  className={modalSelectClass}
                >
                  <option value="AC">Ampla Concorrência</option>
                  <option value="PCD">Pessoa com Deficiência</option>
                  <option value="PPP">Pessoas Pretas e Pardas</option>
                  <option value="INDIGENA">Indígena</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={modalLabelClass}>Classificação (opcional)</label>
                <input
                  type="number"
                  min={1}
                  value={classificacao}
                  onChange={event => setClassificacao(event.target.value)}
                  placeholder="3"
                  className={modalInputClass}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className={modalLabelClass}>Já foi nomeado neste concurso?</label>
                <select
                  value={jaNomeado}
                  onChange={event => handleJaNomeadoChange(event.target.value as 'SIM' | 'NAO')}
                  className={modalSelectClass}
                >
                  <option value="SIM">Sim</option>
                  <option value="NAO">Não</option>
                </select>
                {jaNomeado === 'SIM' && (
                  <div className="space-y-2">
                    <label className={modalLabelClass}>Situação após a nomeação</label>
                    <select
                      value={jaNomeadoStatus}
                      onChange={event =>
                        setJaNomeadoStatus(event.target.value as NomeacaoStatusOption | '')
                      }
                      className={modalSelectClass}
                    >
                      <option value="">Selecione uma opção</option>
                      {NOMEACAO_STATUS_OPTIONS.map(option => (
                        <option key={`status-nomeacao-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className={modalLabelClass}>Caso nomeado, pretende assumir?</label>
                <select
                  value={pretendeAssumir}
                  onChange={event =>
                    setPretendeAssumir(event.target.value as 'SIM' | 'NAO' | 'INDEFINIDO')
                  }
                  className={modalSelectClass}
                >
                  <option value="SIM">Sim</option>
                  <option value="NAO">Não</option>
                  <option value="INDEFINIDO">Ainda não sei</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={modalLabelClass}>Observação (opcional)</label>
              <textarea
                value={observacao}
                onChange={event => setObservacao(event.target.value)}
                rows={3}
                placeholder="Ex.: Concurso do TJ-SP com previsão de nomeação para 2026..."
                className={modalTextareaClass}
              />
            </div>

            {error && <p className={modalErrorClass}>{error}</p>}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`max-w-xs ${modalHelperTextClass}`}>
              Após a aprovação da Comissão, essas informações passam a aparecer nos painéis internos e
              listas resumidas.
            </p>
            <button
              type="submit"
              disabled={isPending}
              className={modalPrimaryButtonClass}
            >
              {isPending ? 'Enviando...' : 'Cadastrar aprovação'}
            </button>
          </div>
        </form>
      </BaseModal>
    </>
  )
}

type EditarOutraAprovacaoModalProps = {
  trigger: React.ReactNode
  candidateId: string
  approval: OutraAprovacaoItem
}

export function EditarOutraAprovacaoModal({
  trigger,
  candidateId,
  approval,
}: EditarOutraAprovacaoModalProps) {
  const [open, setOpen] = useState(false)
  const initialCargoOption = useMemo<CargoSelectOption>(() => {
    const value = approval.cargo ?? ''
    if ((CARGO_PRESET_OPTIONS as readonly string[]).includes(value)) {
      return value as CargoPresetOption
    }
    if (!value) {
      return ''
    }
    return CARGO_OTHER_OPTION
  }, [approval.cargo])

  const initialCustomCargo = useMemo(() => {
    if (initialCargoOption === CARGO_OTHER_OPTION) {
      return approval.cargo ?? ''
    }
    return ''
  }, [approval.cargo, initialCargoOption])

  const initialCargo = useMemo(() => {
    if (initialCargoOption === CARGO_OTHER_OPTION) {
      return initialCustomCargo
    }
    return approval.cargo ?? ''
  }, [approval.cargo, initialCargoOption, initialCustomCargo])

  const parsedObservacao = useMemo(() => parseObservacaoWithStatus(approval.observacao), [approval.observacao])
  const initialJaNomeado: 'SIM' | 'NAO' = approval.ja_foi_nomeado === 'SIM' ? 'SIM' : 'NAO'

  const [orgao, setOrgao] = useState(approval.orgao ?? '')
  const [cargo, setCargo] = useState(initialCargo)
  const [cargoOption, setCargoOption] = useState<CargoSelectOption>(initialCargoOption)
  const [customCargo, setCustomCargo] = useState(initialCustomCargo)
  const [sistema, setSistema] = useState<'AC' | 'PCD' | 'PPP' | 'INDIGENA'>(
    (approval.sistema_concorrencia as 'AC' | 'PCD' | 'PPP' | 'INDIGENA') ?? 'AC',
  )
  const [classificacao, setClassificacao] = useState(
    approval.classificacao ? String(approval.classificacao) : '',
  )
  const [pretendeAssumir, setPretendeAssumir] = useState<'SIM' | 'NAO' | 'INDEFINIDO'>(
    (approval.pretende_assumir as 'SIM' | 'NAO' | 'INDEFINIDO') ?? 'INDEFINIDO',
  )
  const [jaNomeado, setJaNomeado] = useState<'SIM' | 'NAO'>(initialJaNomeado)
  const [jaNomeadoStatus, setJaNomeadoStatus] = useState<NomeacaoStatusOption | ''>(
    parsedObservacao.status,
  )
  const [observacao, setObservacao] = useState(parsedObservacao.observation)
  const [error, setError] = useState<string | null>(null)
  const [isPending, beginTransition] = useTransition()
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    if (!open) {
      return
    }

    React.startTransition(() => {
      setOrgao(approval.orgao ?? '')
      setCargo(initialCargo)
      setCargoOption(initialCargoOption)
      setCustomCargo(initialCustomCargo)
      setSistema((approval.sistema_concorrencia as 'AC' | 'PCD' | 'PPP' | 'INDIGENA') ?? 'AC')
      setClassificacao(approval.classificacao ? String(approval.classificacao) : '')
      setPretendeAssumir(
        (approval.pretende_assumir as 'SIM' | 'NAO' | 'INDEFINIDO') ?? 'INDEFINIDO',
      )
      setJaNomeado(initialJaNomeado)
      setJaNomeadoStatus(parsedObservacao.status)
      setObservacao(parsedObservacao.observation)
      setError(null)
    })
  }, [
    approval.classificacao,
    approval.cargo,
    approval.observacao,
    approval.orgao,
    approval.pretende_assumir,
    approval.sistema_concorrencia,
    approval.ja_foi_nomeado,
    initialCargo,
    initialCargoOption,
    initialCustomCargo,
    initialJaNomeado,
    open,
    parsedObservacao.observation,
    parsedObservacao.status,
  ])

  const handleCargoOptionChange = (value: CargoSelectOption) => {
    setCargoOption(value)

    if (value === CARGO_OTHER_OPTION) {
      setCargo('')
      setCustomCargo('')
      return
    }

    if (value === '') {
      setCargo('')
      setCustomCargo('')
      return
    }

    setCargo(value)
    setCustomCargo('')
  }

  const handleCustomCargoChange = (value: string) => {
    setCustomCargo(value)
    setCargo(value)
  }

  const handleJaNomeadoChange = (value: 'SIM' | 'NAO') => {
    setJaNomeado(value)
    if (value !== 'SIM') {
      setJaNomeadoStatus('')
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!orgao.trim() || !cargo.trim()) {
      setError('Preencha pelo menos o órgão e o cargo.')
      showToast('Preencha pelo menos o órgão e o cargo.', { variant: 'error' })
      return
    }

    const classificacaoNumber = classificacao ? Number(classificacao) : undefined

    if (classificacao && Number.isNaN(classificacaoNumber)) {
      setError('Classificação deve ser um número inteiro.')
      showToast('Classificação deve ser um número inteiro.', { variant: 'error' })
      return
    }

    if (jaNomeado === 'SIM' && !jaNomeadoStatus) {
      setError('Informe o status após a nomeação.')
      showToast('Informe o status após a nomeação.', { variant: 'error' })
      return
    }

    beginTransition(async () => {
      try {
        const observacaoPayload = composeObservacaoWithStatus(
          jaNomeado === 'SIM' ? jaNomeadoStatus : '',
          observacao,
        )

        await requestOutraAprovacaoUpdate({
          approvalId: approval.id,
          candidateId,
          orgao: orgao.trim(),
          cargo: cargo.trim(),
          sistemaConcorrencia: sistema,
          classificacao: classificacaoNumber ?? null,
          pretendeAssumir,
          jaNomeado,
          observacao: observacaoPayload || undefined,
        })
        router.refresh()
        setError(null)
        setOpen(false)
        showToast('Aprovação atualizada. A Comissão será notificada.', {
          variant: 'success',
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar aprovação.'
        setError(message)
        showToast(message, { variant: 'error' })
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
        title="Editar aprovação em outro concurso"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col text-[13px] text-[#0f2f47]/85">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className={modalLabelClass}>Órgão em que fui aprovado</label>
                <input
                  type="text"
                  value={orgao}
                  onChange={event => setOrgao(event.target.value)}
                  className={modalInputClass}
                />
              </div>

              <div className="space-y-2">
                <label className={modalLabelClass}>Cargo</label>
                <select
                  value={cargoOption}
                  onChange={event =>
                    handleCargoOptionChange(event.target.value as CargoSelectOption)
                  }
                  className={modalSelectClass}
                >
                  <option value="">Selecione uma opção</option>
                  {CARGO_PRESET_OPTIONS.map(option => (
                    <option key={`editar-cargo-option-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={CARGO_OTHER_OPTION}>{CARGO_OTHER_OPTION}</option>
                </select>
                {cargoOption === CARGO_OTHER_OPTION && (
                  <input
                    type="text"
                    value={customCargo}
                    onChange={event => handleCustomCargoChange(event.target.value)}
                    placeholder="Digite o cargo"
                    className={modalInputClass}
                  />
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className={modalLabelClass}>Sistema de concorrência</label>
                <select
                  value={sistema}
                  onChange={event =>
                    setSistema(event.target.value as 'AC' | 'PCD' | 'PPP' | 'INDIGENA')
                  }
                  className={modalSelectClass}
                >
                  <option value="AC">Ampla Concorrência</option>
                  <option value="PCD">Pessoa com Deficiência</option>
                  <option value="PPP">Pessoas Pretas e Pardas</option>
                  <option value="INDIGENA">Indígena</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={modalLabelClass}>Classificação (opcional)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={classificacao}
                  onChange={event => setClassificacao(event.target.value)}
                  className={modalInputClass}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className={modalLabelClass}>Já foi nomeado neste concurso?</label>
                <select
                  value={jaNomeado}
                  onChange={event => handleJaNomeadoChange(event.target.value as 'SIM' | 'NAO')}
                  className={modalSelectClass}
                >
                  <option value="SIM">Sim</option>
                  <option value="NAO">Não</option>
                </select>
                {jaNomeado === 'SIM' && (
                  <div className="space-y-2">
                    <label className={modalLabelClass}>Situação após a nomeação</label>
                    <select
                      value={jaNomeadoStatus}
                      onChange={event =>
                        setJaNomeadoStatus(event.target.value as NomeacaoStatusOption | '')
                      }
                      className={modalSelectClass}
                    >
                      <option value="">Selecione uma opção</option>
                      {NOMEACAO_STATUS_OPTIONS.map(option => (
                        <option key={`editar-status-nomeacao-${option}`} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className={modalLabelClass}>Caso nomeado, pretende assumir?</label>
                <select
                  value={pretendeAssumir}
                  onChange={event =>
                    setPretendeAssumir(event.target.value as 'SIM' | 'NAO' | 'INDEFINIDO')
                  }
                  className={modalSelectClass}
                >
                  <option value="SIM">Sim</option>
                  <option value="NAO">Não</option>
                  <option value="INDEFINIDO">Ainda não sei</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={modalLabelClass}>Observação (opcional)</label>
              <textarea
                rows={3}
                value={observacao}
                onChange={event => setObservacao(event.target.value)}
                className={modalTextareaClass}
              />
            </div>

            {error && <p className={modalErrorClass}>{error}</p>}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => !isPending && setOpen(false)}
              className={modalSecondaryButtonClass}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={modalPrimaryButtonClass}
            >
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </BaseModal>
    </>
  )
}
