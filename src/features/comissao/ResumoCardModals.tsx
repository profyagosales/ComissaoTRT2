"use client"

import { useState, useTransition } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  upsertCargosVagosAction,
  upsertCsjtAuthorizationAction,
  upsertLoaAction,
} from "./comissao-actions"
import type {
  CargosVagosRecord,
  CsjtAuthorizationRecord,
  LoaHistoryRecord,
} from "./loadComissaoData"

const dialogContentClasses = "max-w-5xl bg-white text-zinc-900"
const sectionTitleClasses = "text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400"

function ActionTriggerButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="w-full rounded-full border border-red-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 shadow-sm transition hover:border-red-300"
    >
      {children}
    </button>
  )
}

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
  trigger?: ReactNode
  loas: LoaHistoryRecord[]
}

export function LoaModal({ trigger, loas }: LoaModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(loas[0]?.id ?? null)
  const [message, setMessage] = useState<MessageState>(null)
  const [isPending, startTransition] = useTransition()
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
    setOpen(nextOpen)
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

    startTransition(async () => {
      try {
        await upsertLoaAction({
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
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar LOA."
        setMessage({ type: "error", text: message })
      }
    })
  }

  const triggerElement = trigger ?? <ActionTriggerButton>LOA</ActionTriggerButton>

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      <DialogContent className={cn(dialogContentClasses, "space-y-6")}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-zinc-900">LOA e previsão de provimentos</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Consulte o histórico recente e cadastre novas projeções de LOA.
          </DialogDescription>
        </DialogHeader>

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
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isPending ? "Salvando..." : form.id ? "Atualizar LOA" : "Cadastrar LOA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type CsjtModalProps = {
  trigger?: ReactNode
  autorizacoes: CsjtAuthorizationRecord[]
  loas: LoaHistoryRecord[]
}

export function CsjtModal({ trigger, autorizacoes, loas }: CsjtModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(autorizacoes[0]?.id ?? null)
  const [message, setMessage] = useState<MessageState>(null)
  const [isPending, startTransition] = useTransition()
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
    setOpen(nextOpen)
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

    startTransition(async () => {
      try {
        await upsertCsjtAuthorizationAction({
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
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar autorização."
        setMessage({ type: "error", text: message })
      }
    })
  }

  const triggerElement = trigger ?? <ActionTriggerButton>CSJT</ActionTriggerButton>

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      <DialogContent className={cn(dialogContentClasses, "space-y-6")}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-zinc-900">Autorizações do CSJT</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Controle centralizado das autorizações e destinos.
          </DialogDescription>
        </DialogHeader>

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
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isPending ? "Salvando..." : form.id ? "Atualizar autorização" : "Registrar autorização"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type CargosModalProps = {
  trigger?: ReactNode
  registros: CargosVagosRecord[]
}

export function CargosVagosModal({ trigger, registros }: CargosModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(registros[0]?.id ?? null)
  const [message, setMessage] = useState<MessageState>(null)
  const [isPending, startTransition] = useTransition()
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
    setOpen(nextOpen)
    if (nextOpen) {
      selectRegistro(registros[0]?.id ?? null)
      setMessage(null)
    }
  }

  const triggerElement = trigger ?? <ActionTriggerButton>Cargos vagos</ActionTriggerButton>

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

    startTransition(async () => {
      try {
        await upsertCargosVagosAction({
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
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar registro."
        setMessage({ type: "error", text: message })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      <DialogContent className={cn(dialogContentClasses, "space-y-6")}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-zinc-900">Cargos vagos TRT-2</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Registre as últimas apurações de vagas para analistas e técnicos.
          </DialogDescription>
        </DialogHeader>

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
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isPending ? "Salvando..." : form.id ? "Atualizar registro" : "Registrar dados"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type ResumoActionsProps = {
  loas: LoaHistoryRecord[]
  csjtAuthorizations: CsjtAuthorizationRecord[]
  cargosVagos: CargosVagosRecord[]
}

export function ResumoCardActions({ loas, csjtAuthorizations, cargosVagos }: ResumoActionsProps) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      <LoaModal loas={loas} />
      <CsjtModal autorizacoes={csjtAuthorizations} loas={loas} />
      <CargosVagosModal registros={cargosVagos} />
    </div>
  )
}
