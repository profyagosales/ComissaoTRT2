"use client"

import React, { useCallback, useEffect, useRef, useState, useTransition } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { KanbanDialogBody, KanbanDialogContent, KanbanDialogFooter, KanbanDialogHeader } from "./KanbanDialog"
import { useToast } from "@/components/ui/toast-provider"
import {
  getComissaoResumoConfig,
  removeComissaoLogo,
  updateComissaoResumoConfig,
  uploadComissaoLogo,
} from "./comissao-resumo-actions"
import type { ComissaoResumoConfig, ComissaoResumoUpdateInput } from "./comissao-resumo-types"
import { getCommissionLogoRelativeUrl } from "./logo-utils"
import type {
  CargosVagosRecord,
  CsjtAuthorizationRecord,
  LoaHistoryRecord,
} from "./loadComissaoData"
import type { ComissaoDashboardActions } from "./comissao-action-types"

const sectionTitleClasses = "text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400"

type MessageState = { type: "error" | "success"; text: string } | null

function MessageBanner({ state }: { state: MessageState }) {
  if (!state) return null
  const colorClasses =
    state.type === "error"
      ? "bg-red-50 text-red-700 border-red-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100"

  return (
    <p className={cn("rounded-2xl border px-3 py-2 text-sm", colorClasses)}>{state.text}</p>
  )
}

type ComissaoLogoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComissaoLogoModal({ open, onOpenChange }: ComissaoLogoModalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [config, setConfig] = useState<ComissaoResumoConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPending, beginTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const resetSelection = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const loadConfig = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)
    try {
      const data = await getComissaoResumoConfig()
      setConfig(data)
    } catch (error) {
      const text = error instanceof Error ? error.message : "Não foi possível carregar os dados da comissão."
      setMessage({ type: "error", text })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    React.startTransition(() => {
      resetSelection()
      void loadConfig()
    })
  }, [loadConfig, open, resetSelection])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    resetSelection()

    if (!file) {
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const validationImage = new Image()

    validationImage.onload = () => {
      const { width, height } = validationImage

      if (width !== height) {
        URL.revokeObjectURL(objectUrl)
        setMessage({
          type: "error",
          text: "Envie uma imagem quadrada (mesma largura e altura) para usar como ícone.",
        })
        return
      }

      if (width < 512) {
        URL.revokeObjectURL(objectUrl)
        setMessage({
          type: "error",
          text: "A logo precisa ter pelo menos 512x512 pixels para ser usada como ícone do app.",
        })
        return
      }

      previewUrlRef.current = objectUrl
      setSelectedFile(file)
      setPreviewUrl(objectUrl)
      setMessage({
        type: "success",
        text: `Imagem validada (${width}x${height}).`,
      })
    }

    validationImage.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      setMessage({
        type: "error",
        text: "Não foi possível ler a imagem. Tente enviar outro arquivo em PNG ou JPG.",
      })
    }

    validationImage.src = objectUrl
  }

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    if (!selectedFile) {
      setMessage({ type: "error", text: "Selecione um arquivo de logo para enviar." })
      return
    }

    beginTransition(async () => {
      try {
        await uploadComissaoLogo(selectedFile)
        showToast("Logo atualizada com sucesso.", { variant: "success" })
        resetSelection()
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao salvar a nova logo."
        setMessage({ type: "error", text })
      }
    })
  }

  const handleRemove = () => {
    setMessage(null)
    beginTransition(async () => {
      try {
        await removeComissaoLogo()
        showToast("Logo removida.", { variant: "success" })
        resetSelection()
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao remover a logo."
        setMessage({ type: "error", text })
      }
    })
  }

  const currentLogoUrl = previewUrl ?? getCommissionLogoRelativeUrl(config)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <KanbanDialogContent size="medium">
        <form onSubmit={handleSave} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Logo da comissão"
            description="Atualize a marca que aparece no resumo do concurso. Recomenda-se usar imagem quadrada (PNG)."
          />

          <KanbanDialogBody className="space-y-6">
            <div>
              <p className={sectionTitleClasses}>Pré-visualização</p>
              <div className="mt-2 flex items-center justify-center">
                <div className="flex h-40 w-40 items-center justify-center rounded-3xl border border-[#0f2f47]/12 bg-white/80 p-4 shadow-sm">
                  {isLoading ? (
                    <span className="text-sm text-[#0f2f47]/60">Carregando...</span>
                  ) : currentLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentLogoUrl} alt="Logo da comissão" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-center text-xs text-[#0f2f47]/50">
                      Nenhuma logo cadastrada.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={sectionTitleClasses}>Selecionar arquivo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-[#0f2f47]/14 bg-white px-3 py-2 text-sm text-[#0f2f47]"
              />
              <p className="text-xs text-[#0f2f47]/60">Use uma imagem quadrada (mínimo 512x512, preferencialmente PNG com fundo transparente).</p>
            </div>

            <MessageBanner state={message} />
          </KanbanDialogBody>

          <KanbanDialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-[#0f2f47]/15 px-4 py-2 text-sm font-semibold text-[#0f2f47]/70 transition hover:border-[#0f2f47]/30 hover:text-[#0f2f47]"
              >
                Cancelar
              </button>
            </DialogClose>
            {config?.logo_url ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remover logo
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isPending || !selectedFile}
              className="rounded-full bg-[#0067A0] px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,58,96,0.25)] transition hover:bg-[#005885] disabled:cursor-not-allowed disabled:bg-[#0067A0]/60"
            >
              {isPending ? "Salvando..." : "Salvar logo"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}

type ValidadeFormState = {
  homologadoEm: string
  validoAte: string
  foiProrrogado: boolean
  prorrogadoEm: string
  validoAteProrrogado: string
}

type ComissaoValidadeModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComissaoValidadeModal({ open, onOpenChange }: ComissaoValidadeModalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [form, setForm] = useState<ValidadeFormState>({
    homologadoEm: "",
    validoAte: "",
    foiProrrogado: false,
    prorrogadoEm: "",
    validoAteProrrogado: "",
  })
  const [message, setMessage] = useState<MessageState>(null)
  const [isPending, beginTransition] = useTransition()

  const loadConfig = useCallback(async () => {
    setMessage(null)
    try {
      const data = await getComissaoResumoConfig()
      setForm({
        homologadoEm: data.homologado_em?.slice(0, 10) ?? "",
        validoAte: data.valido_ate?.slice(0, 10) ?? "",
        foiProrrogado: Boolean(data.foi_prorrogado),
        prorrogadoEm: data.prorrogado_em?.slice(0, 10) ?? "",
        validoAteProrrogado: data.valido_ate_prorrogado?.slice(0, 10) ?? "",
      })
    } catch (error) {
      const text = error instanceof Error ? error.message : "Não foi possível carregar as datas atuais."
      setMessage({ type: "error", text })
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }
    React.startTransition(() => {
      void loadConfig()
    })
  }, [loadConfig, open])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    if (form.foiProrrogado) {
      if (!form.prorrogadoEm || !form.validoAteProrrogado) {
        setMessage({ type: "error", text: "Informe as datas de prorrogação." })
        return
      }
    }

    beginTransition(async () => {
      try {
        await updateComissaoResumoConfig({
          homologado_em: form.homologadoEm || null,
          valido_ate: form.validoAte || null,
          foi_prorrogado: form.foiProrrogado,
          prorrogado_em: form.foiProrrogado ? form.prorrogadoEm || null : null,
          valido_ate_prorrogado: form.foiProrrogado ? form.validoAteProrrogado || null : null,
        })
        showToast("Validade atualizada.", { variant: "success" })
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao atualizar a validade."
        setMessage({ type: "error", text })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <KanbanDialogContent size="medium">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Validade do concurso"
            description="Registre as datas de homologação, validade e eventuais prorrogações."
          />

          <KanbanDialogBody className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className={sectionTitleClasses}>Homologado em</label>
                <Input
                  type="date"
                  value={form.homologadoEm}
                  onChange={(event) => setForm(prev => ({ ...prev, homologadoEm: event.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className={sectionTitleClasses}>Válido até</label>
                <Input
                  type="date"
                  value={form.validoAte}
                  onChange={(event) => setForm(prev => ({ ...prev, validoAte: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={sectionTitleClasses}>Já foi prorrogado?</label>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, foiProrrogado: true }))}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center rounded-2xl border px-3 py-2",
                    form.foiProrrogado ? "border-[#0067A0] bg-[#0067A0]/10 text-[#0067A0]" : "border-[#0f2f47]/12 bg-white text-[#0f2f47]/70"
                  )}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, foiProrrogado: false, prorrogadoEm: "", validoAteProrrogado: "" }))}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center rounded-2xl border px-3 py-2",
                    !form.foiProrrogado ? "border-[#0067A0] bg-[#0067A0]/10 text-[#0067A0]" : "border-[#0f2f47]/12 bg-white text-[#0f2f47]/70"
                  )}
                >
                  Não
                </button>
              </div>
            </div>

            {form.foiProrrogado ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className={sectionTitleClasses}>Prorrogado em</label>
                  <Input
                    type="date"
                    value={form.prorrogadoEm}
                    onChange={(event) => setForm(prev => ({ ...prev, prorrogadoEm: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className={sectionTitleClasses}>Válido até (após prorrogação)</label>
                  <Input
                    type="date"
                    value={form.validoAteProrrogado}
                    onChange={(event) => setForm(prev => ({ ...prev, validoAteProrrogado: event.target.value }))}
                  />
                </div>
              </div>
            ) : null}

            <MessageBanner state={message} />
          </KanbanDialogBody>

          <KanbanDialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-[#0f2f47]/15 px-4 py-2 text-sm font-semibold text-[#0f2f47]/70 transition hover:border-[#0f2f47]/30 hover:text-[#0f2f47]"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#0067A0] px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,58,96,0.25)] transition hover:bg-[#005885] disabled:cursor-not-allowed disabled:bg-[#0067A0]/60"
            >
              {isPending ? "Salvando..." : "Salvar validade"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}

type SimpleFieldModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldKey: keyof Pick<ComissaoResumoConfig, "instagram_url" | "email_comissao" | "grupo_aprovados_url">
  title: string
  description: string
  placeholder: string
  successMessage: string
  label: string
}

function SimpleFieldModal({
  open,
  onOpenChange,
  fieldKey,
  title,
  description,
  placeholder,
  successMessage,
  label,
}: SimpleFieldModalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [value, setValue] = useState("")
  const [message, setMessage] = useState<MessageState>(null)
  const [isPending, beginTransition] = useTransition()

  const loadConfig = useCallback(async () => {
    setMessage(null)
    try {
      const data = await getComissaoResumoConfig()
      const current = data[fieldKey]
      setValue(typeof current === "string" ? current : "")
    } catch (error) {
      const text = error instanceof Error ? error.message : "Não foi possível carregar a configuração."
      setMessage({ type: "error", text })
    }
  }, [fieldKey])

  useEffect(() => {
    if (!open) {
      return
    }
    React.startTransition(() => {
      void loadConfig()
    })
  }, [loadConfig, open])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    beginTransition(async () => {
      try {
        const payload: ComissaoResumoUpdateInput = {
          [fieldKey]: value.trim() || null,
        } as ComissaoResumoUpdateInput

        await updateComissaoResumoConfig(payload)
        showToast(successMessage, { variant: "success" })
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao salvar informações."
        setMessage({ type: "error", text })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <KanbanDialogContent size="narrow">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <KanbanDialogHeader title={title} description={description} />

          <KanbanDialogBody className="space-y-4">
            <div className="space-y-1">
              <label className={sectionTitleClasses}>{label}</label>
              <Input
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={placeholder}
              />
            </div>

            <MessageBanner state={message} />
          </KanbanDialogBody>

          <KanbanDialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-[#0f2f47]/15 px-4 py-2 text-sm font-semibold text-[#0f2f47]/70 transition hover:border-[#0f2f47]/30 hover:text-[#0f2f47]"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#0067A0] px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,58,96,0.25)] transition hover:bg-[#005885] disabled:cursor-not-allowed disabled:bg-[#0067A0]/60"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}

export const ComissaoInstagramModal = (props: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <SimpleFieldModal
    fieldKey="instagram_url"
    title="Instagram da comissão"
    description="Informe o link público do perfil da comissão."
    placeholder="https://instagram.com/comissao"
    successMessage="Instagram atualizado."
    label="URL do Instagram"
    {...props}
  />
)

export const ComissaoEmailModal = (props: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <SimpleFieldModal
    fieldKey="email_comissao"
    title="E-mail da comissão"
    description="Defina o endereço de e-mail oficial para contato."
    placeholder="comissao@trt2.jus.br"
    successMessage="E-mail atualizado."
    label="Endereço de e-mail"
    {...props}
  />
)

export const ComissaoGrupoModal = (props: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <SimpleFieldModal
    fieldKey="grupo_aprovados_url"
    title="Grupo de aprovados"
    description="Indique o link do grupo de aprovados (WhatsApp, Telegram etc.)."
    placeholder="https://chat.whatsapp.com/..."
    successMessage="Link do grupo atualizado."
    label="Link do grupo"
    {...props}
  />
)

type LoaFormState = {
  id?: string
  ano: string
  totalPrevisto: string
  status: string
  descricao: string
  shouldNotify: boolean
}

type CsjtFormState = {
  id?: string
  dataAutorizacao: string
  totalProvimentos: string
  observacao: string
  loaId: string
  shouldNotify: boolean
}

type DestinoFormState = {
  tribunal: string
  cargo: string
  quantidade: string
}

type CargosFormState = {
  id?: string
  dataReferencia: string
  analistaVagos: string
  tecnicoVagos: string
  observacao: string
  fonteUrl: string
  shouldNotify: boolean
}

function buildLoaFormState(record?: LoaHistoryRecord | null): LoaFormState {
  return {
    id: record?.id,
    ano: record?.ano ? String(record.ano) : "",
    totalPrevisto: record?.totalPrevisto ? String(record.totalPrevisto) : "",
    status: record?.status ?? "",
    descricao: record?.descricao ?? "",
    shouldNotify: false,
  }
}

function buildCsjtFormState(record?: CsjtAuthorizationRecord | null): CsjtFormState {
  return {
    id: record?.id,
    dataAutorizacao: record?.dataAutorizacao?.slice(0, 10) ?? "",
    totalProvimentos: record?.totalProvimentos ? String(record.totalProvimentos) : "",
    observacao: record?.observacao ?? "",
    loaId: record?.loaId ?? "",
    shouldNotify: false,
  }
}

function buildDestinosFromRecord(record?: CsjtAuthorizationRecord | null): DestinoFormState[] {
  if (record?.destinos?.length) {
    return record.destinos.map((dest) => ({ tribunal: dest.tribunal, cargo: dest.cargo, quantidade: String(dest.quantidade) }))
  }
  return [{ tribunal: "", cargo: "", quantidade: "" }]
}

function buildCargosFormState(record?: CargosVagosRecord | null): CargosFormState {
  return {
    id: record?.id,
    dataReferencia: record?.dataReferencia?.slice(0, 10) ?? "",
    analistaVagos: record?.analistaVagos ? String(record.analistaVagos) : "",
    tecnicoVagos: record?.tecnicoVagos ? String(record.tecnicoVagos) : "",
    observacao: record?.observacao ?? "",
    fonteUrl: record?.fonteUrl ?? "",
    shouldNotify: false,
  }
}

function HistoryList<T extends { id: string }>(
  props: {
    title: string
    emptyLabel: string
    items: T[]
    renderItem: (item: T) => ReactNode
    selectedId: string | null
    onSelect: (id: string) => void
    onCreateNew?: () => void
  }
) {
  const { title, emptyLabel, items, renderItem, selectedId, onSelect, onCreateNew } = props
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={sectionTitleClasses}>{title}</p>
        {onCreateNew ? (
          <button
            type="button"
            className="text-xs font-semibold text-red-600 hover:text-red-700"
            onClick={onCreateNew}
          >
            Novo registro
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full rounded-2xl border px-3 py-2 text-left text-sm",
                selectedId === item.id
                  ? "border-red-200 bg-red-50/80 text-red-900"
                  : "border-zinc-100 bg-zinc-50/80 hover:border-red-100 hover:bg-white"
              )}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type LoaModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  loas: LoaHistoryRecord[]
  onUpsertLoa: ComissaoDashboardActions["upsertLoa"]
}

export function LoaModal({ open, onOpenChange, loas, onUpsertLoa }: LoaModalProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(loas[0]?.id ?? null)
  const [message, setMessage] = useState<MessageState>(null)
  const [isPending, beginTransition] = useTransition()
  const [form, setForm] = useState<LoaFormState>(buildLoaFormState(loas[0] ?? null))

  const selectLoa = (id: string | null) => {
    if (!id) {
      setSelectedId(null)
      setForm(buildLoaFormState(null))
      return
    }

    const record = loas.find((item) => item.id === id) ?? null
    setSelectedId(record?.id ?? null)
    setForm(buildLoaFormState(record))
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (nextOpen) {
      selectLoa(loas[0]?.id ?? null)
      setMessage(null)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    const anoNumber = Number(form.ano)
    if (!Number.isFinite(anoNumber)) {
      setMessage({ type: "error", text: "Informe um ano válido." })
      return
    }

    const totalNumber = Number(form.totalPrevisto)
    if (!Number.isFinite(totalNumber) || totalNumber <= 0) {
      setMessage({ type: "error", text: "Total previsto precisa ser maior que zero." })
      return
    }

    if (!form.status.trim()) {
      setMessage({ type: "error", text: "Informe o status da LOA." })
      return
    }

    beginTransition(async () => {
      try {
        await onUpsertLoa({
          id: form.id,
          ano: anoNumber,
          totalPrevisto: totalNumber,
          status: form.status,
          descricao: form.descricao || null,
          shouldNotify: form.shouldNotify,
        })
        setMessage({ type: "success", text: "LOA salva com sucesso." })
        setForm(prev => ({ ...prev, shouldNotify: false }))
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar LOA."
        setMessage({ type: "error", text: message })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="wide">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="LOA e previsão de provimentos"
            description="Consulte o histórico recente e cadastre novas projeções de LOA."
          />

          <KanbanDialogBody>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-5/12">
                <HistoryList
                  title="Últimas LOAs"
                  emptyLabel="Nenhum registro encontrado."
                  items={loas}
                  selectedId={selectedId}
                  onSelect={(id) => selectLoa(id)}
                  onCreateNew={() => selectLoa(null)}
                  renderItem={(item) => (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-900">{item.ano}</p>
                      <p className="text-xs text-zinc-500">
                        {item.status} · {item.totalPrevisto} provimentos
                      </p>
                    </div>
                  )}
                />
              </div>

              <div className="md:flex-1">
                <div className="space-y-4 text-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Ano</label>
                      <Input
                        type="number"
                        value={form.ano}
                        onChange={(event) => setForm((prev) => ({ ...prev, ano: event.target.value }))}
                        placeholder="2025"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Total previsto</label>
                      <Input
                        type="number"
                        value={form.totalPrevisto}
                        onChange={(event) => setForm((prev) => ({ ...prev, totalPrevisto: event.target.value }))}
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Status</label>
                    <Input
                      value={form.status}
                      onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                      placeholder="Em tramitação"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Descrição (opcional)</label>
                    <textarea
                      value={form.descricao}
                      onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                      rows={4}
                      className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
                      placeholder="Detalhes adicionais"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                      checked={form.shouldNotify}
                      onChange={(event) => setForm((prev) => ({ ...prev, shouldNotify: event.target.checked }))}
                    />
                    Notificar aprovados sobre essa atualização
                  </label>

                  <MessageBanner state={message} />
                </div>
              </div>
            </div>
          </KanbanDialogBody>

          <KanbanDialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isPending ? "Salvando..." : form.id ? "Atualizar LOA" : "Cadastrar LOA"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}

type CsjtModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  autorizacoes: CsjtAuthorizationRecord[]
  loas: LoaHistoryRecord[]
  onUpsertCsjtAuthorization: ComissaoDashboardActions["upsertCsjtAuthorization"]
}

export function CsjtModal({ open, onOpenChange, autorizacoes, loas, onUpsertCsjtAuthorization }: CsjtModalProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(autorizacoes[0]?.id ?? null)
  const [message, setMessage] = useState<MessageState>(null)
  const [isPending, beginTransition] = useTransition()
  const [form, setForm] = useState<CsjtFormState>(buildCsjtFormState(autorizacoes[0] ?? null))
  const [destinos, setDestinos] = useState<DestinoFormState[]>(buildDestinosFromRecord(autorizacoes[0] ?? null))

  const selectAuthorization = (id: string | null) => {
    if (!id) {
      setSelectedId(null)
      setForm(buildCsjtFormState(null))
      setDestinos(buildDestinosFromRecord(null))
      return
    }

    const record = autorizacoes.find((item) => item.id === id) ?? null
    setSelectedId(record?.id ?? null)
    setForm(buildCsjtFormState(record))
    setDestinos(buildDestinosFromRecord(record))
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (nextOpen) {
      selectAuthorization(autorizacoes[0]?.id ?? null)
      setMessage(null)
    }
  }

  const handleDestinoChange = (index: number, field: "tribunal" | "cargo" | "quantidade", value: string) => {
    setDestinos((prev) => prev.map((dest, idx) => (idx === index ? { ...dest, [field]: value } : dest)))
  }

  const addDestinoRow = () => {
    setDestinos((prev) => [...prev, { tribunal: "", cargo: "", quantidade: "" }])
  }

  const removeDestinoRow = (index: number) => {
    setDestinos((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))
  }

  const somaDestinos = destinos.reduce((acc, dest) => acc + (Number(dest.quantidade) || 0), 0)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    const totalNumber = Number(form.totalProvimentos)
    if (!Number.isFinite(totalNumber) || totalNumber <= 0) {
      setMessage({ type: "error", text: "Informe o total de provimentos." })
      return
    }

    if (!form.dataAutorizacao) {
      setMessage({ type: "error", text: "Informe a data de autorização." })
      return
    }

    const destinosValidos = destinos.filter((dest) => dest.tribunal.trim() && Number(dest.quantidade) > 0)
    if (!destinosValidos.length) {
      setMessage({ type: "error", text: "Cadastre ao menos um destino válido." })
      return
    }

    const somaValidos = destinosValidos.reduce((acc, dest) => acc + (Number(dest.quantidade) || 0), 0)
    if (somaValidos !== totalNumber) {
      setMessage({ type: "error", text: "A soma dos destinos precisa fechar com o total." })
      return
    }

    beginTransition(async () => {
      try {
        await onUpsertCsjtAuthorization({
          id: form.id,
          dataAutorizacao: form.dataAutorizacao,
          totalProvimentos: totalNumber,
          observacao: form.observacao || null,
          loaId: form.loaId || null,
          destinos: destinosValidos.map((dest) => ({
            tribunal: dest.tribunal,
            cargo: dest.cargo,
            quantidade: Number(dest.quantidade),
          })),
          shouldNotify: form.shouldNotify,
        })
        setMessage({ type: "success", text: "Autorização salva." })
        setForm((prev) => ({ ...prev, shouldNotify: false }))
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar autorização."
        setMessage({ type: "error", text: message })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="wide">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Autorizações do CSJT"
            description="Controle centralizado das autorizações e destinos."
          />

          <KanbanDialogBody>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-5/12">
                <HistoryList
                  title="Últimas autorizações"
                  emptyLabel="Ainda não há registros."
                  items={autorizacoes}
                  selectedId={selectedId}
                  onSelect={(id) => selectAuthorization(id)}
                  onCreateNew={() => selectAuthorization(null)}
                  renderItem={(item) => (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-900">
                        {new Date(item.dataAutorizacao).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {item.totalProvimentos} provimentos · {item.destinos.length} destinos
                      </p>
                    </div>
                  )}
                />
              </div>

              <div className="md:flex-1">
                <div className="space-y-4 text-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className={sectionTitleClasses}>Data da autorização</label>
                      <Input
                        type="date"
                        value={form.dataAutorizacao}
                        onChange={(event) => setForm((prev) => ({ ...prev, dataAutorizacao: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={sectionTitleClasses}>Total de provimentos</label>
                      <Input
                        type="number"
                        value={form.totalProvimentos}
                        onChange={(event) => setForm((prev) => ({ ...prev, totalProvimentos: event.target.value }))}
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={sectionTitleClasses}>LOA vinculada (opcional)</label>
                    <select
                      value={form.loaId ?? ""}
                      onChange={(event) => setForm((prev) => ({ ...prev, loaId: event.target.value }))}
                      className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                    >
                      <option value="">Sem vínculo</option>
                      {loas.map((loa) => (
                        <option key={loa.id} value={loa.id}>
                          LOA {loa.ano} · {loa.totalPrevisto} vagas
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className={sectionTitleClasses}>Destinos</p>
                      <button
                        type="button"
                        onClick={addDestinoRow}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        + Destino
                      </button>
                    </div>
                    <div className="space-y-3">
                      {destinos.map((destino, index) => (
                        <div key={`dest-${index}`} className="grid gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3 md:grid-cols-[1fr,1fr,120px,auto]">
                          <Input
                            placeholder="Tribunal"
                            value={destino.tribunal}
                            onChange={(event) => handleDestinoChange(index, "tribunal", event.target.value)}
                          />
                          <Input
                            placeholder="Cargo"
                            value={destino.cargo}
                            onChange={(event) => handleDestinoChange(index, "cargo", event.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Qtd"
                            value={destino.quantidade}
                            onChange={(event) => handleDestinoChange(index, "quantidade", event.target.value)}
                          />
                          <button
                            type="button"
                            className="text-xs font-semibold text-zinc-400 hover:text-red-600"
                            onClick={() => removeDestinoRow(index)}
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">Soma atual: {somaDestinos} provimentos.</p>
                  </div>

                  <div className="space-y-1">
                    <label className={sectionTitleClasses}>Observação</label>
                    <textarea
                      value={form.observacao}
                      onChange={(event) => setForm((prev) => ({ ...prev, observacao: event.target.value }))}
                      rows={4}
                      className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
                      placeholder="Anotações internas"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                      checked={form.shouldNotify}
                      onChange={(event) => setForm((prev) => ({ ...prev, shouldNotify: event.target.checked }))}
                    />
                    Notificar aprovados sobre essa autorização
                  </label>

                  <MessageBanner state={message} />
                </div>
              </div>
            </div>
          </KanbanDialogBody>

          <KanbanDialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isPending ? "Salvando..." : form.id ? "Atualizar autorização" : "Registrar autorização"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}

type CargosModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  registros: CargosVagosRecord[]
  onUpsertCargosVagos: ComissaoDashboardActions["upsertCargosVagos"]
}

export function CargosVagosModal({ open, onOpenChange, registros, onUpsertCargosVagos }: CargosModalProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(registros[0]?.id ?? null)
  const [message, setMessage] = useState<MessageState>(null)
  const [isPending, beginTransition] = useTransition()
  const [form, setForm] = useState<CargosFormState>(buildCargosFormState(registros[0] ?? null))

  const selectRegistro = (id: string | null) => {
    if (!id) {
      setSelectedId(null)
      setForm(buildCargosFormState(null))
      return
    }

    const record = registros.find((item) => item.id === id) ?? null
    setSelectedId(record?.id ?? null)
    setForm(buildCargosFormState(record))
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (nextOpen) {
      selectRegistro(registros[0]?.id ?? null)
      setMessage(null)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    if (!form.dataReferencia) {
      setMessage({ type: "error", text: "Informe a data de referência." })
      return
    }

    const analistaNumber = Number(form.analistaVagos)
    const tecnicoNumber = Number(form.tecnicoVagos)

    if (analistaNumber < 0 || tecnicoNumber < 0 || !Number.isFinite(analistaNumber) || !Number.isFinite(tecnicoNumber)) {
      setMessage({ type: "error", text: "Valores de cargos vagos inválidos." })
      return
    }

    beginTransition(async () => {
      try {
        await onUpsertCargosVagos({
          id: form.id,
          dataReferencia: form.dataReferencia,
          analistaVagos: analistaNumber,
          tecnicoVagos: tecnicoNumber,
          observacao: form.observacao || null,
          fonteUrl: form.fonteUrl || null,
          shouldNotify: form.shouldNotify,
        })
        setMessage({ type: "success", text: "Registro de cargos vagos salvo." })
        setForm((prev) => ({ ...prev, shouldNotify: false }))
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar registro."
        setMessage({ type: "error", text: message })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="large">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Cargos vagos TRT-2"
            description="Registre as últimas apurações de vagas para analistas e técnicos."
          />

          <KanbanDialogBody>
            <div className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-5/12">
                <HistoryList
                  title="Histórico recente"
                  emptyLabel="Nenhum registro disponível."
                  items={registros}
                  selectedId={selectedId}
                  onSelect={(id) => selectRegistro(id)}
                  onCreateNew={() => selectRegistro(null)}
                  renderItem={(item) => (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-900">
                        {new Date(item.dataReferencia).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-zinc-500">{item.analistaVagos} AJ · {item.tecnicoVagos} TJ</p>
                    </div>
                  )}
                />
              </div>

              <div className="md:flex-1">
                <div className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <label className={sectionTitleClasses}>Data de referência</label>
                    <Input
                      type="date"
                      value={form.dataReferencia}
                      onChange={(event) => setForm((prev) => ({ ...prev, dataReferencia: event.target.value }))}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className={sectionTitleClasses}>Analista</label>
                      <Input
                        type="number"
                        value={form.analistaVagos}
                        onChange={(event) => setForm((prev) => ({ ...prev, analistaVagos: event.target.value }))}
                        placeholder="35"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={sectionTitleClasses}>Técnico</label>
                      <Input
                        type="number"
                        value={form.tecnicoVagos}
                        onChange={(event) => setForm((prev) => ({ ...prev, tecnicoVagos: event.target.value }))}
                        placeholder="18"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={sectionTitleClasses}>Fonte / link (opcional)</label>
                    <Input
                      value={form.fonteUrl}
                      onChange={(event) => setForm((prev) => ({ ...prev, fonteUrl: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={sectionTitleClasses}>Observação</label>
                    <textarea
                      value={form.observacao}
                      onChange={(event) => setForm((prev) => ({ ...prev, observacao: event.target.value }))}
                      rows={4}
                      className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
                      placeholder="Detalhes complementares"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                      checked={form.shouldNotify}
                      onChange={(event) => setForm((prev) => ({ ...prev, shouldNotify: event.target.checked }))}
                    />
                    Notificar aprovados
                  </label>

                  <MessageBanner state={message} />
                </div>
              </div>
            </div>
          </KanbanDialogBody>

          <KanbanDialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300"
              >
                Cancelar
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isPending ? "Salvando..." : form.id ? "Atualizar registro" : "Registrar dados"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}
