"use client"

import { useMemo, useState, useTransition } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatDateBrMedium } from "@/lib/date-format"
import { decodeVacanciaMetadata } from "@/features/vacancias/vacancia-metadata"
import {
  VACANCIA_CLASSE_HELPER_TEXT,
  VACANCIA_CLASSE_LABEL,
  VACANCIA_CLASSES_BY_TIPO,
  VACANCIA_TIPO_LABEL,
  type VacanciaClasse,
  type VacanciaTipo,
} from "@/features/vacancias/vacancia-types"
import type { VacanciaRecord } from "./loadComissaoData"
import type { ComissaoDashboardActions } from "./comissao-action-types"
import { KanbanDialogBody, KanbanDialogContent, KanbanDialogFooter, KanbanDialogHeader } from "./KanbanDialog"


function MessageBanner({ state }: { state: { type: "success" | "error"; text: string } | null }) {
  if (!state) return null
  const colorClasses =
    state.type === "error"
      ? "bg-red-50 text-red-700 border-red-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100"

  return <p className={cn("rounded-2xl border px-3 py-2 text-sm", colorClasses)}>{state.text}</p>
}
const VACANCIA_TIPO_OPTIONS: Array<{ value: VacanciaTipo; label: string }> = [
  { value: "ONEROSA", label: VACANCIA_TIPO_LABEL.ONEROSA },
  { value: "NAO_ONEROSA", label: VACANCIA_TIPO_LABEL.NAO_ONEROSA },
]

const VACANCIA_CLASSE_OPTIONS: Record<VacanciaTipo, Array<{ value: VacanciaClasse; label: string }>> = {
  ONEROSA: buildClasseOptions("ONEROSA"),
  NAO_ONEROSA: buildClasseOptions("NAO_ONEROSA"),
}

function buildClasseOptions(tipo: VacanciaTipo) {
  return VACANCIA_CLASSES_BY_TIPO[tipo].map((value) => {
    const helper = VACANCIA_CLASSE_HELPER_TEXT[value]
    const baseLabel = VACANCIA_CLASSE_LABEL[value]
    return {
      value,
      label: helper ? `${baseLabel} (${helper})` : baseLabel,
    }
  })
}

type VacanciaFormState = {
  id: string | null
  data: string
  tribunal: string
  cargo: string
  tipo: VacanciaTipo | ""
  classe: VacanciaClasse | ""
  nomeServidor: string
  douLink: string
  observacao: string
  shouldNotify: boolean
  preenchida: boolean
}

type VacanciaFormChangeHandler = <Key extends keyof VacanciaFormState>(
  field: Key,
  value: VacanciaFormState[Key],
) => void

const normalizeKey = (value?: string | null) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "") ?? ""

const CLASSE_LABEL_TO_KEY = new Map<string, VacanciaClasse>(
  Object.entries(VACANCIA_CLASSE_LABEL).map(([key, label]) => [normalizeKey(label), key as VacanciaClasse]),
)

const inferTipoFromLabel = (value?: string | null): VacanciaTipo | "" => {
  const normalized = normalizeKey(value)
  if (!normalized) return ""
  if (normalized.includes("NAO")) return "NAO_ONEROSA"
  if (normalized.includes("ONER")) return "ONEROSA"
  return ""
}

const inferClasseFromLabel = (value?: string | null): VacanciaClasse | "" => {
  const normalized = normalizeKey(value)
  if (!normalized) return ""
  return CLASSE_LABEL_TO_KEY.get(normalized) ?? ""
}

const resolveClasseLabel = (value?: string | null) => {
  if (!value) return "—"
  const { label } = decodeVacanciaMetadata(value)
  if (label) return label
  const classe = inferClasseFromLabel(value)
  if (classe) {
    return VACANCIA_CLASSE_LABEL[classe]
  }
  return value ?? "—"
}

const todayInputDate = () => new Date().toISOString().slice(0, 10)

const createVacanciaForm = (): VacanciaFormState => ({
  id: null,
  data: todayInputDate(),
  tribunal: "TRT-2",
  cargo: "TJAA",
  tipo: "",
  classe: "",
  nomeServidor: "",
  douLink: "",
  observacao: "",
  shouldNotify: true,
  preenchida: false,
})


type VacanciaFormFieldsProps = {
  form: VacanciaFormState
  onChange: VacanciaFormChangeHandler
  isPending: boolean
  onDelete?: () => void
  showNotificationToggle?: boolean
}

function VacanciaFormFields({ form, onChange, isPending, onDelete, showNotificationToggle = true }: VacanciaFormFieldsProps) {
  const classeOptions = form.tipo ? VACANCIA_CLASSE_OPTIONS[form.tipo] : []
  const preenchidaGroupName = `preenchida-${form.id ?? "nova"}`

  return (
    <div className="space-y-4 text-sm">
      {onDelete ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 disabled:border-zinc-200 disabled:text-zinc-400"
          >
            Excluir esta vacância
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Data</label>
          <Input type="date" value={form.data} onChange={(event) => onChange("data", event.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Tribunal</label>
          <Input
            value={form.tribunal}
            readOnly
            className="bg-zinc-100 text-zinc-500"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Cargo</label>
          <Input value={form.cargo} readOnly className="bg-zinc-100 text-zinc-500" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Tipo</label>
          <select
            value={form.tipo}
            onChange={(event) => onChange("tipo", event.target.value as VacanciaTipo | "")}
            className="h-[2.25rem] w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
          >
            <option value="">Selecione...</option>
            {VACANCIA_TIPO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Classe</label>
          <select
            value={form.classe}
            onChange={(event) => onChange("classe", event.target.value as VacanciaClasse | "")}
            disabled={!form.tipo}
            className="h-[2.25rem] w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 focus:border-red-400 focus:outline-none"
          >
            <option value="">{form.tipo ? "Selecione a classe" : "Selecione o tipo primeiro"}</option>
            {classeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Servidor</label>
          <Input value={form.nomeServidor} onChange={(event) => onChange("nomeServidor", event.target.value)} placeholder="Nome do servidor" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Link DOU</label>
        <Input value={form.douLink} onChange={(event) => onChange("douLink", event.target.value)} placeholder="https://..." />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Observação</label>
        <textarea
          value={form.observacao}
          onChange={(event) => onChange("observacao", event.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
          placeholder="Detalhes adicionais"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">A vacância já foi preenchida?</p>
        <div className="flex gap-3">
          <label className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700">
            <input
              type="radio"
              name={preenchidaGroupName}
              value="SIM"
              checked={form.preenchida}
              onChange={() => onChange("preenchida", true)}
            />
            Sim
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700">
            <input
              type="radio"
              name={preenchidaGroupName}
              value="NAO"
              checked={!form.preenchida}
              onChange={() => onChange("preenchida", false)}
            />
            Não
          </label>
        </div>
      </div>

      {showNotificationToggle ? (
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
            checked={form.shouldNotify}
            onChange={(event) => onChange("shouldNotify", event.target.checked)}
          />
          Notificar aprovados sobre a atualização
        </label>
      ) : null}
    </div>
  )
}

type NovaVacanciaModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpsertVacancia: ComissaoDashboardActions["upsertVacancia"]
}

export function NovaVacanciaModal({ open, onOpenChange, onUpsertVacancia }: NovaVacanciaModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<VacanciaFormState>(createVacanciaForm)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateForm: VacanciaFormChangeHandler = (field, value) => {
    setForm((prev) => {
      if (field === "tipo") {
        return { ...prev, tipo: value as VacanciaTipo | "", classe: "" }
      }
      return { ...prev, [field]: value }
    })
  }

  const resetForm = () => setForm(createVacanciaForm())

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)

    if (!form.data) {
      setMessage({ type: "error", text: "Informe a data da vacância." })
      return
    }

    if (!form.cargo.trim()) {
      setMessage({ type: "error", text: "Informe o cargo." })
      return
    }

    if (!form.tipo) {
      setMessage({ type: "error", text: "Selecione o tipo da vacância." })
      return
    }

    if (!form.classe) {
      setMessage({ type: "error", text: "Selecione a classe da vacância." })
      return
    }

    startTransition(async () => {
      try {
        const result = await onUpsertVacancia({
          data: form.data,
          tribunal: form.tribunal.trim() || "TRT-2",
          cargo: form.cargo.trim(),
          tipo: form.tipo,
          classe: form.classe,
          nomeServidor: form.nomeServidor.trim() || null,
          douLink: form.douLink.trim() || null,
          observacao: form.observacao.trim() || null,
          shouldNotify: form.shouldNotify,
          preenchida: form.preenchida,
        })
        setMessage({
          type: "success",
          text: `Vacância registrada (ID ${result.id}).`,
        })
        resetForm()
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao salvar vacância."
        setMessage({ type: "error", text })
      }
    })
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setMessage(null)
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="xl">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Registrar vacância"
            description="Cadastre saídas de servidores e mantenha o impacto atualizado para o painel."
          />

          <KanbanDialogBody>
            <VacanciaFormFields form={form} onChange={updateForm} isPending={isPending} showNotificationToggle />
            <div className="pt-4">
              <MessageBanner state={message} />
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
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:bg-red-300"
            >
              {isPending ? "Salvando..." : "Salvar vacância"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}

type VacanciasHistoryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vacancias: VacanciaRecord[]
  onUpsertVacancia: ComissaoDashboardActions["upsertVacancia"]
  onDeleteVacancia: ComissaoDashboardActions["deleteVacancia"]
}

export function VacanciasHistoryModal({ open, onOpenChange, vacancias, onUpsertVacancia, onDeleteVacancia }: VacanciasHistoryModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<VacanciaFormState>(() => ({ ...createVacanciaForm(), shouldNotify: false }))
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")

  const sorted = useMemo(() => {
    return vacancias
      .slice()
      .sort((a, b) => {
        if (a.data && b.data) return b.data.localeCompare(a.data)
        if (a.data) return -1
        if (b.data) return 1
        return 0
      })
  }, [vacancias])

  const updateForm: VacanciaFormChangeHandler = (field, value) => {
    setForm((prev) => {
      if (field === "tipo") {
        return { ...prev, tipo: value as VacanciaTipo | "", classe: "" }
      }
      return { ...prev, [field]: value }
    })
  }

  const filteredRecords = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return sorted
    return sorted.filter((record) => {
      const name = record.nomeServidor?.toLowerCase() ?? ""
      return name.includes(normalized)
    })
  }, [sorted, searchTerm])

  const selectVacancia = (record: VacanciaRecord) => {
    setForm({
      id: record.id,
      data: record.data ? record.data.slice(0, 10) : todayInputDate(),
      tribunal: record.metadata?.tribunal ?? record.tribunal ?? "TRT-2",
      cargo: record.metadata?.cargo ?? record.cargo ?? "TJAA",
      tipo:
        (record.metadata?.tipo as VacanciaTipo | null) ||
        inferTipoFromLabel(record.tipo) ||
        inferTipoFromLabel(record.motivo) ||
        (record.tipo === "ONEROSA" || record.tipo === "NAO_ONEROSA" ? (record.tipo as VacanciaTipo) : ""),
      classe:
        record.metadata?.classeKey ?? inferClasseFromLabel(record.motivo),
      nomeServidor: record.metadata?.nomeServidor ?? record.nomeServidor ?? "",
      douLink: record.metadata?.douLink ?? record.douLink ?? "",
      observacao: record.metadata?.observacao ?? record.observacao ?? "",
      shouldNotify: false,
      preenchida: record.metadata?.preenchida ?? record.preenchida ?? false,
    })
    setMessage(null)
  }

  const handleSelectChange = (value: string) => {
    if (!value) {
      setForm({ ...createVacanciaForm(), shouldNotify: false })
      return
    }
    const record = sorted.find((item) => item.id === value)
    if (record) {
      selectVacancia(record)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const recordId = form.id
    if (!recordId) {
      setMessage({ type: "error", text: "Selecione um registro para editar." })
      return
    }
    if (!form.data) {
      setMessage({ type: "error", text: "Informe a data da vacância." })
      return
    }

    if (!form.tipo) {
      setMessage({ type: "error", text: "Selecione o tipo da vacância." })
      return
    }

    if (!form.classe) {
      setMessage({ type: "error", text: "Selecione a classe da vacância." })
      return
    }

    startTransition(async () => {
      try {
        const result = await onUpsertVacancia({
          id: recordId,
          data: form.data,
          tribunal: form.tribunal,
          cargo: form.cargo,
          tipo: form.tipo,
          classe: form.classe,
          nomeServidor: form.nomeServidor.trim() || null,
          douLink: form.douLink.trim() || null,
          observacao: form.observacao.trim() || null,
          shouldNotify: false,
          preenchida: form.preenchida,
        })
        if (process.env.NODE_ENV !== "production") {
          console.log("[vacancias] upsert result", result)
          if (result.metadata) {
            console.log("[vacancias] metadata", result.metadata)
          }
        }
        const resolvedObservacao = result.metadata?.observacao ?? result.observacao ?? ""
        const resolvedPreenchida =
          result.metadata?.preenchida ?? result.preenchida ?? null
        setForm((prev) => ({
          ...prev,
          data: result.data ? result.data.slice(0, 10) : prev.data,
          tribunal: result.metadata?.tribunal ?? result.tribunal ?? prev.tribunal,
          cargo: result.metadata?.cargo ?? result.cargo ?? prev.cargo,
          tipo:
            inferTipoFromLabel(result.tipo) || inferTipoFromLabel(result.classe) || prev.tipo,
          classe: inferClasseFromLabel(result.classe) || prev.classe,
          nomeServidor: result.metadata?.nomeServidor ?? result.nomeServidor ?? "",
          douLink: result.metadata?.douLink ?? result.douLink ?? "",
          observacao: resolvedObservacao,
          shouldNotify: false,
          preenchida: resolvedPreenchida ?? prev.preenchida,
        }))
        setMessage({
          type: "success",
          text: `Registro atualizado em ${new Date().toLocaleString("pt-BR")}. Observação atual: ${resolvedObservacao || "—"}. Preenchida: ${resolvedPreenchida === null ? "—" : resolvedPreenchida ? "Sim" : "Não"}.`,
        })
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao atualizar vacância."
        setMessage({ type: "error", text })
      }
    })
  }

  const handleDelete = () => {
    const recordId = form.id
    if (!recordId) return
    startTransition(async () => {
      try {
        await onDeleteVacancia({ id: recordId })
        setMessage({ type: "success", text: "Registro removido." })
        setForm({ ...createVacanciaForm(), shouldNotify: false })
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Não foi possível remover."
        setMessage({ type: "error", text })
      }
    })
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setMessage(null)
      setSearchTerm("")
      setForm({ ...createVacanciaForm(), shouldNotify: false })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="xl">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Histórico de vacâncias"
            description="Consulte os registros existentes, selecione um item para editar ou remover."
          />

          <KanbanDialogBody>
            {sorted.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma vacância registrada.</p>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Vacâncias cadastradas</label>
                    <select
                      value={form.id ?? ""}
                      onChange={(event) => handleSelectChange(event.target.value)}
                      className="h-[2.4rem] w-full rounded-2xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
                    >
                      <option value="">Selecione uma vacância</option>
                      {filteredRecords.map((record) => {
                        const title = record.nomeServidor?.trim() || "Sem servidor vinculado"
                        const subtitle = resolveClasseLabel(record.motivo)
                        const date = record.data ? formatDateBrMedium(record.data) : "Sem data"
                        return (
                          <option key={record.id} value={record.id}>
                            {`${title} • ${date} • ${subtitle}`}
                          </option>
                        )
                      })}
                    </select>
                    {filteredRecords.length === 0 ? (
                      <p className="text-xs text-zinc-500">Nenhuma vacância encontrada com esse nome.</p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Buscar servidor</label>
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Digite o nome do servidor"
                    />
                  </div>
                </div>

                <VacanciaFormFields
                  form={form}
                  onChange={updateForm}
                  isPending={isPending}
                  onDelete={form.id ? handleDelete : undefined}
                  showNotificationToggle={false}
                />
                <div className="pt-4">
                  <MessageBanner state={message} />
                </div>
              </div>
            )}
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
              disabled={isPending || !form.id}
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:bg-red-300"
            >
              {isPending ? "Salvando..." : form.id ? "Salvar alterações" : "Selecione um registro"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}
