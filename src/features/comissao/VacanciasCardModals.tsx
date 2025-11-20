"use client"

import { useMemo, useState, useTransition } from "react"
import type { FormEvent, ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { VacanciaRecord } from "./loadComissaoData"
import { deleteVacanciaAction, upsertVacanciaAction } from "./comissao-actions"

const dialogContentClasses = "max-w-4xl bg-white text-zinc-900"

function ActionButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="w-full rounded-full border border-red-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 shadow-sm transition hover:border-red-300"
    >
      {children}
    </button>
  )
}

function MessageBanner({ state }: { state: { type: "success" | "error"; text: string } | null }) {
  if (!state) return null
  const colorClasses =
    state.type === "error"
      ? "bg-red-50 text-red-700 border-red-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100"

  return <p className={cn("rounded-2xl border px-3 py-2 text-sm", colorClasses)}>{state.text}</p>
}

const emptyForm = {
  id: null as string | null,
  data: "",
  tribunal: "TRT-2",
  cargo: "",
  motivo: "",
  tipo: "",
  nomeServidor: "",
  douLink: "",
  observacao: "",
  shouldNotify: true,
}

type VacanciaFormProps = {
  form: typeof emptyForm
  onChange: (field: keyof typeof emptyForm, value: string | boolean | null) => void
  onSubmit: (event: FormEvent) => void
  isPending: boolean
  submitLabel: string
  message: { type: "success" | "error"; text: string } | null
  onDelete?: () => void
  disableSubmit?: boolean
}

function VacanciaForm({ form, onChange, onSubmit, isPending, submitLabel, message, onDelete, disableSubmit }: VacanciaFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Data</label>
          <Input type="date" value={form.data} onChange={(event) => onChange("data", event.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Tribunal</label>
          <Input value={form.tribunal} onChange={(event) => onChange("tribunal", event.target.value)} placeholder="TRT-2" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Cargo</label>
          <Input value={form.cargo} onChange={(event) => onChange("cargo", event.target.value)} placeholder="TJAA" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Tipo</label>
          <Input value={form.tipo} onChange={(event) => onChange("tipo", event.target.value)} placeholder="Ex.: exoneração" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Motivo</label>
          <Input value={form.motivo} onChange={(event) => onChange("motivo", event.target.value)} placeholder="Opcional" />
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

      <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
          checked={form.shouldNotify}
          onChange={(event) => onChange("shouldNotify", event.target.checked)}
        />
        Notificar aprovados sobre a atualização
      </label>

      <MessageBanner state={message} />

      <div className="flex items-center justify-between">
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 disabled:border-zinc-200 disabled:text-zinc-400"
          >
            Remover registro
          </button>
        ) : <span />}
        <button
          type="submit"
            disabled={isPending || disableSubmit}
          className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:bg-red-300"
        >
          {isPending ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  )
}

type NovaVacanciaModalProps = {
  triggerLabel?: string
}

function NovaVacanciaModal({ triggerLabel = "Nova vacância" }: NovaVacanciaModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const updateForm = (field: keyof typeof emptyForm, value: string | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

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

    startTransition(async () => {
      try {
        await upsertVacanciaAction({
          data: form.data,
          tribunal: form.tribunal.trim() || "TRT-2",
          cargo: form.cargo.trim(),
          motivo: form.motivo.trim() || null,
          tipo: form.tipo.trim() || null,
          nomeServidor: form.nomeServidor.trim() || null,
          douLink: form.douLink.trim() || null,
          observacao: form.observacao.trim() || null,
          shouldNotify: form.shouldNotify,
        })
        setMessage({ type: "success", text: "Vacância registrada." })
        setForm({ ...emptyForm })
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao salvar vacância."
        setMessage({ type: "error", text })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton>{triggerLabel}</ActionButton>
      </DialogTrigger>
      <DialogContent className={cn(dialogContentClasses, "space-y-6")}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-zinc-900">Registrar vacância</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Cadastre saídas de servidores e mantenha o impacto atualizado para o painel.
          </DialogDescription>
        </DialogHeader>

        <VacanciaForm
          form={form}
          onChange={updateForm}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel="Salvar vacância"
          message={message}
        />
      </DialogContent>
    </Dialog>
  )
}

type VacanciasHistoryModalProps = {
  vacancias: VacanciaRecord[]
}

function VacanciasHistoryModal({ vacancias }: VacanciasHistoryModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

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

  const updateForm = (field: keyof typeof emptyForm, value: string | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const selectVacancia = (record: VacanciaRecord) => {
    setForm({
      id: record.id,
      data: record.data ? record.data.slice(0, 10) : "",
      tribunal: record.tribunal ?? "TRT-2",
      cargo: record.cargo ?? "",
      motivo: record.motivo ?? "",
      tipo: record.tipo ?? "",
      nomeServidor: record.nomeServidor ?? "",
      douLink: record.douLink ?? "",
      observacao: record.observacao ?? "",
      shouldNotify: false,
    })
    setMessage(null)
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

    startTransition(async () => {
      try {
        await upsertVacanciaAction({
          id: recordId,
          data: form.data,
          tribunal: form.tribunal,
          cargo: form.cargo,
          motivo: form.motivo || null,
          tipo: form.tipo || null,
          nomeServidor: form.nomeServidor || null,
          douLink: form.douLink || null,
          observacao: form.observacao || null,
          shouldNotify: form.shouldNotify,
        })
        setMessage({ type: "success", text: "Registro atualizado." })
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
        await deleteVacanciaAction({ id: recordId })
        setMessage({ type: "success", text: "Registro removido." })
        setForm({ ...emptyForm })
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Não foi possível remover."
        setMessage({ type: "error", text })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton>Histórico</ActionButton>
      </DialogTrigger>
      <DialogContent className={cn(dialogContentClasses, "space-y-6")}> 
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-zinc-900">Histórico de vacâncias</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Consulte os registros existentes, selecione um item para editar ou remover.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {sorted.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma vacância registrada.</p>
            ) : (
              sorted.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => selectVacancia(record)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-left text-sm transition",
                    form.id === record.id ? "border-red-200 bg-red-50/60" : "border-zinc-100 bg-zinc-50/70 hover:border-zinc-200"
                  )}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{record.tribunal ?? "TRT-2"}</p>
                  <p className="text-base font-semibold text-zinc-900">{record.cargo ?? "Cargo"}</p>
                  <p className="text-xs text-zinc-500">{record.motivo ?? "—"}</p>
                  <p className="text-[11px] text-zinc-400">{record.data ? new Date(record.data).toLocaleDateString("pt-BR") : "Sem data"}</p>
                </button>
              ))
            )}
          </div>

          <VacanciaForm
            form={form}
            onChange={updateForm}
            onSubmit={handleSubmit}
            isPending={isPending}
            submitLabel={form.id ? "Salvar alterações" : "Selecione um registro"}
            message={message}
            onDelete={form.id ? handleDelete : undefined}
            disableSubmit={!form.id}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function VacanciasCardActions({ vacancias }: { vacancias: VacanciaRecord[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <NovaVacanciaModal />
      <VacanciasHistoryModal vacancias={vacancias} />
    </div>
  )
}
