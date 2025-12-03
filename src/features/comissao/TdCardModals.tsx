"use client"

import { useMemo, useState, useTransition, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { TD_REQUEST_TIPOS, type TdRequestTipo } from "@/features/tds/td-types"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { KanbanDialogBody, KanbanDialogContent, KanbanDialogFooter, KanbanDialogHeader } from "./KanbanDialog"

import type { CandidateSummary, PendingTdRequest } from "./loadComissaoData"
import type { TdContentSettings } from "@/features/tds/td-content"
import { TD_CONTENT_DEFAULTS } from "@/features/tds/td-content"
import type { ComissaoDashboardActions } from "./comissao-action-types"

function MessageBanner({ state }: { state: { type: "success" | "error"; text: string } | null }) {
  if (!state) return null
  const colorClasses =
    state.type === "error"
      ? "bg-red-50 text-red-700 border-red-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100"

  return <p className={cn("rounded-2xl border px-3 py-2 text-sm", colorClasses)}>{state.text}</p>
}

type TdPendenciasModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: PendingTdRequest[]
  onModerateTdRequest: ComissaoDashboardActions["moderateTdRequest"]
}

export function TdPendenciasModal({ open, onOpenChange, pending, onModerateTdRequest }: TdPendenciasModalProps) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleDecision = (requestId: string, decision: "APROVAR" | "REJEITAR") => {
    startTransition(async () => {
      setActiveId(requestId)
      setFeedback(null)
      try {
        await onModerateTdRequest({ requestId, decision })
        setFeedback({ type: "success", text: decision === "APROVAR" ? "TD aprovado." : "Solicitação rejeitada." })
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível atualizar o TD."
        setFeedback({ type: "error", text: message })
      } finally {
        setActiveId(null)
      }
    })
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setFeedback(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="large">
        <div className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="TDs aguardando decisão"
            description="Aprove ou recuse os envios feitos pelos aprovados. As decisões atualizam o status dos candidatos automaticamente."
          />

          <KanbanDialogBody>
            {pending.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma solicitação pendente.</p>
            ) : (
              <div className="space-y-3">
                {pending.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-zinc-900">{item.candidatoNome}</p>
                        <p className="text-xs uppercase tracking-[0.25em] text-amber-700">{item.tipoTd === "ENVIADO" ? "TD enviado" : "Interesse"}</p>
                        {item.observacao ? <p className="text-xs text-zinc-500">{item.observacao}</p> : null}
                      </div>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, "REJEITAR")}
                          disabled={isPending && activeId === item.id}
                          className="rounded-full border border-zinc-300 px-4 py-1 text-xs font-semibold text-zinc-600 transition hover:border-zinc-400"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, "APROVAR")}
                          disabled={isPending && activeId === item.id}
                          className="rounded-full bg-amber-600 px-4 py-1 text-xs font-semibold text-white shadow hover:bg-amber-500 disabled:bg-amber-300"
                        >
                          Aprovar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4">
              <MessageBanner state={feedback} />
            </div>
          </KanbanDialogBody>

          <KanbanDialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300"
              >
                Fechar
              </button>
            </DialogClose>
          </KanbanDialogFooter>
        </div>
      </KanbanDialogContent>
    </Dialog>
  )
}

type TdContentEditorModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: TdContentSettings
  onUpsertTdContent: ComissaoDashboardActions["upsertTdContent"]
}

type EditableModel = { clientId: string; label: string; url: string }
type TdContentFormState = {
  howItWorksHtml: string
  guidelinesHtml: string
  models: EditableModel[]
}

const TD_MODELS_BUCKET = process.env.NEXT_PUBLIC_TD_MODELS_BUCKET || "avatars"
const TD_MODELS_FOLDER = "td-models"

const createClientId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

const mapContentToForm = (content: TdContentSettings): TdContentFormState => {
  const models = (content.models ?? [])
    .slice(0, 1)
    .map((model, index) => ({ clientId: createClientId() + index, label: model.label, url: model.url }))

  if (!models.length) {
    models.push({ clientId: createClientId(), label: "", url: "" })
  }

  return {
    howItWorksHtml: content.howItWorksHtml || TD_CONTENT_DEFAULTS.howItWorksHtml,
    guidelinesHtml: content.guidelinesHtml || TD_CONTENT_DEFAULTS.guidelinesHtml,
    models,
  }
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim()

const prettyFileName = (url: string) => {
  try {
    const fileName = new URL(url).pathname.split("/").pop()
    return fileName || url
  } catch {
    return url
  }
}

export function TdContentEditorModal({ open, onOpenChange, content, onUpsertTdContent }: TdContentEditorModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<TdContentFormState>(() => mapContentToForm(content))
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploadState, setUploadState] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null)
  const primaryModel = form.models[0]

  const setFileInputRef = (element: HTMLInputElement | null) => {
    setFileInput(element)
  }

  const handleModelLabelChange = (label: string) => {
    setForm((prev) => {
      const current = prev.models[0]
      if (current) {
        return { ...prev, models: [{ ...current, label }] }
      }
      return { ...prev, models: [{ clientId: createClientId(), label, url: "" }] }
    })
  }

  const handleRemoveModelFile = () => {
    setForm((prev) => {
      const current = prev.models[0]
      if (!current) return prev
      return { ...prev, models: [{ ...current, url: "" }] }
    })
    setUploadState(null)
  }

  const handleUploadClick = () => {
    setUploadState(null)
    fileInput?.click()
  }

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setUploadState(null)
    setIsUploading(true)

    try {
      const uploadedModel = await uploadModelFile(file)
      setForm((prev) => {
        const current = prev.models[0]
        const nextModel: EditableModel = {
          clientId: current?.clientId ?? uploadedModel.clientId,
          label: current?.label?.trim() ? current.label : uploadedModel.label,
          url: uploadedModel.url,
        }
        return { ...prev, models: [nextModel] }
      })
      setUploadState({ type: "success", text: "Arquivo enviado. Ajuste o rótulo se necessário." })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível enviar o arquivo."
      setUploadState({ type: "error", text: message })
    } finally {
      setIsUploading(false)
    }
  }

  const uploadModelFile = async (file: File): Promise<EditableModel> => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf"
    const uniqueId = createClientId()
    const path = `${TD_MODELS_FOLDER}/${uniqueId}.${extension}`

    const { error } = await supabaseBrowser.storage.from(TD_MODELS_BUCKET).upload(path, file, { upsert: false })
    if (error) {
      console.error("[TdContentEditorModal] erro ao enviar modelo", error)
      if (typeof error.message === "string" && error.message.toLowerCase().includes("bucket")) {
        throw new Error("Bucket de Storage não encontrado. Configure NEXT_PUBLIC_TD_MODELS_BUCKET com um bucket válido no Supabase e tente novamente.")
      }
      throw new Error("Falha ao enviar o arquivo para o Storage.")
    }

    const { data: publicData } = supabaseBrowser.storage.from(TD_MODELS_BUCKET).getPublicUrl(path)
    const publicUrl = publicData?.publicUrl
    if (!publicUrl) {
      throw new Error("Não foi possível gerar o link público do arquivo.")
    }

    return {
      clientId: uniqueId,
      label: file.name.replace(/\.[^/.]+$/, ""),
      url: publicUrl,
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    const payloadModels = form.models
      .map((model) => ({ label: model.label.trim(), url: model.url.trim() }))
      .filter((model) => model.label && model.url)

    if (!stripHtml(form.howItWorksHtml) || !stripHtml(form.guidelinesHtml)) {
      setFeedback({ type: "error", text: "As seções de texto precisam ter conteúdo." })
      return
    }

    startTransition(async () => {
      try {
        await onUpsertTdContent({
          howItWorksHtml: form.howItWorksHtml,
          guidelinesHtml: form.guidelinesHtml,
          models: payloadModels,
        })
        setFeedback({ type: "success", text: "Conteúdo atualizado." })
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar o conteúdo."
        setFeedback({ type: "error", text: message })
      }
    })
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (nextOpen) {
      setForm(mapContentToForm(content))
      setFeedback(null)
      setUploadState(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="wide">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader title="Editor de conteúdo do TD" />

          <KanbanDialogBody>
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Como funciona o TD?</p>
                <RichTextEditor
                  value={form.howItWorksHtml}
                  onChange={(value) => setForm((prev) => ({ ...prev, howItWorksHtml: value }))}
                  placeholder="Descreva aos aprovados como funciona o envio do TD..."
                  ariaLabel="Como funciona o TD"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Orientações gerais</p>
                <RichTextEditor
                  value={form.guidelinesHtml}
                  onChange={(value) => setForm((prev) => ({ ...prev, guidelinesHtml: value }))}
                  placeholder="Inclua orientações de envio, prazos e anexos obrigatórios."
                  ariaLabel="Orientações gerais"
                />
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Modelo de TD</label>
                  <p className="text-[11px] text-zinc-500">Configure o rótulo exibido e envie apenas um arquivo.</p>
                </div>

                <input
                  ref={setFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.odt"
                  className="hidden"
                  onChange={handleFileSelected}
                />

                {uploadState ? <MessageBanner state={uploadState} /> : null}

                <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white/95 p-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Rótulo exibido</label>
                    <RichTextEditor
                      value={primaryModel?.label ?? ""}
                      onChange={(value) => handleModelLabelChange(value)}
                      placeholder="Descreva o rótulo exibido para o modelo"
                      ariaLabel="Rótulo exibido do modelo de TD"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Arquivo do modelo</label>
                    {primaryModel?.url ? (
                      <div className="space-y-2 rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 px-3 py-2 text-xs text-rose-900">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="truncate">{prettyFileName(primaryModel.url)}</span>
                          <div className="flex items-center gap-3">
                            <a
                              href={primaryModel.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700"
                            >
                              Abrir
                            </a>
                            <button
                              type="button"
                              onClick={handleRemoveModelFile}
                              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500 hover:text-rose-700"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/60 px-4 py-4 text-center text-rose-900">
                        <p className="text-sm">Nenhum arquivo enviado.</p>
                        <p className="mt-1 text-[11px] text-rose-700">Envie um PDF, DOC, DOCX ou ODT.</p>
                        <div className="mt-3 flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="rounded-full border-rose-200 bg-white text-rose-700 hover:border-rose-300"
                          >
                            {isUploading ? "Enviando..." : "Selecionar arquivo"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <MessageBanner state={feedback} />
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
              className="rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/10 transition hover:bg-amber-500 disabled:bg-amber-300"
            >
              {isPending ? "Salvando..." : "Salvar conteúdo"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}

type CandidateSelectProps = {
  value: string
  onChange: (value: string) => void
  candidates: CandidateSummary[]
  placeholder?: string
}

function CandidateSelect({ value, onChange, candidates, placeholder }: CandidateSelectProps) {
  const grouped = useMemo(() => {
    const map: Record<string, CandidateSummary[]> = {}
    candidates.forEach((candidate) => {
      const key = (candidate.sistemaConcorrencia ?? "AC").toUpperCase()
      map[key] = map[key] ? [...map[key], candidate] : [candidate]
    })
    return map
  }, [candidates])

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? "Selecione"} />
      </SelectTrigger>
      <SelectContent className="max-h-72 overflow-y-auto">
        {Object.entries(grouped).map(([sistema, list]) => (
          <div key={sistema} className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">{sistema}</p>
            {list.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <span className="flex flex-col text-left">
                  <span className="text-sm font-medium">{item.nome}</span>
                  <span className="text-[11px] text-zinc-500">#{item.classificacaoLista ?? "—"} · {item.statusNomeacao ?? "AGUARDANDO"}</span>
                </span>
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  )
}

type TdManualModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: CandidateSummary[]
  onCreateManualTd: ComissaoDashboardActions["createManualTd"]
}

export function TdManualModal({ open, onOpenChange, candidates, onCreateManualTd }: TdManualModalProps) {
  const router = useRouter()
  const buildForm = () => ({
    candidateId: "",
    tipoTd: "ENVIADO" as TdRequestTipo,
    dataAprovacao: "",
    observacao: "",
    shouldNotify: true,
  })
  const [form, setForm] = useState(buildForm)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    if (!form.candidateId) {
      setFeedback({ type: "error", text: "Selecione o aprovado." })
      return
    }

    startTransition(async () => {
      try {
        await onCreateManualTd({
          candidateId: form.candidateId,
          tipoTd: form.tipoTd,
          dataReferencia: form.dataAprovacao || null,
          observacao: form.observacao || null,
          shouldNotify: form.shouldNotify,
        })
        setFeedback({ type: "success", text: "TD registrado com sucesso." })
        setForm(buildForm())
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao registrar TD."
        setFeedback({ type: "error", text: message })
      }
    })
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setFeedback(null)
      setForm(buildForm())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="large">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Registrar TD manual"
            description="Use este fluxo quando a comissão receber TDs por e-mail ou outro canal externo."
          />

          <KanbanDialogBody>
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Aprovado</label>
                <CandidateSelect
                  value={form.candidateId}
                  onChange={(value) => setForm((prev) => ({ ...prev, candidateId: value }))}
                  candidates={candidates}
                  placeholder="Selecione o aprovado"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Tipo de TD</label>
                  <Select value={form.tipoTd} onValueChange={(value) => setForm((prev) => ({ ...prev, tipoTd: value as TdRequestTipo }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TD_REQUEST_TIPOS.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo === "ENVIADO" ? "TD enviado" : "Interesse em enviar"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Data de referência</label>
                  <Input
                    type="date"
                    value={form.dataAprovacao}
                    onChange={(event) => setForm((prev) => ({ ...prev, dataAprovacao: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Observação</label>
                <textarea
                  value={form.observacao}
                  onChange={(event) => setForm((prev) => ({ ...prev, observacao: event.target.value }))}
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                  placeholder="Detalhes do TD, número do protocolo, etc."
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                  checked={form.shouldNotify}
                  onChange={(event) => setForm((prev) => ({ ...prev, shouldNotify: event.target.checked }))}
                />
                Notificar os aprovados sobre esta atualização
              </label>

              <MessageBanner state={feedback} />
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
              className="rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/10 transition hover:bg-amber-500 disabled:bg-amber-300"
            >
              {isPending ? "Registrando..." : "Registrar TD"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}
