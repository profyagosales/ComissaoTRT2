"use client"

import { useMemo, useState, useTransition } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { KanbanDialogBody, KanbanDialogContent, KanbanDialogFooter, KanbanDialogHeader } from "./KanbanDialog"
import type { PendingOutraAprovacao, CandidateSummary } from "./loadComissaoData"
import type { ComissaoDashboardActions } from "./comissao-action-types"
import type {
  JaNomeadoChoice,
  PretendeAssumirChoice,
  SistemaConcorrencia,
} from "@/src/features/listas/listas-actions"


function MessageBanner({ state }: { state: { type: "success" | "error"; text: string } | null }) {
  if (!state) return null
  const colorClasses =
    state.type === "error"
      ? "bg-red-50 text-red-700 border-red-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100"

  return <p className={cn("rounded-2xl border px-3 py-2 text-sm", colorClasses)}>{state.text}</p>
}

type PendenciasModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: PendingOutraAprovacao[]
  onModerateOutraAprovacao: ComissaoDashboardActions["moderateOutraAprovacao"]
}

export function PendenciasModal({ open, onOpenChange, pending, onModerateOutraAprovacao }: PendenciasModalProps) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleDecision = (approvalId: string, decision: "APROVAR" | "REJEITAR") => {
    startTransition(async () => {
      setActiveId(approvalId)
      setFeedback(null)
      try {
        await onModerateOutraAprovacao({ approvalId, decision })
        setFeedback({ type: "success", text: decision === "APROVAR" ? "Aprovação concluída." : "Registro recusado." })
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível atualizar o registro."
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
      <KanbanDialogContent size="medium">
        <div className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Pendências de aprovação"
            description="Aprove ou recuse as solicitações enviadas pelos aprovados. As decisões se refletem imediatamente nas listas."
          />

          <KanbanDialogBody>
            {pending.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma pendência no momento.</p>
            ) : (
              <div className="space-y-3">
                {pending.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-zinc-900">{item.candidatoNome}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{item.orgao}</p>
                        <p className="text-xs text-zinc-500">{item.cargoPretendido}</p>
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
                          className="rounded-full bg-red-600 px-4 py-1 text-xs font-semibold text-white shadow hover:bg-red-500 disabled:bg-red-300"
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

type NovoCandidatoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCandidate: ComissaoDashboardActions["createCandidate"]
}

type NovoCandidatoFormState = { nome: string; sistema: SistemaConcorrencia; classificacao: string }

const buildNovoCandidatoFormState = (defaults?: Partial<NovoCandidatoFormState>): NovoCandidatoFormState => ({
  nome: "",
  sistema: "AC" as SistemaConcorrencia,
  classificacao: "",
  ...defaults,
})

export function NovoCandidatoModal({ open, onOpenChange, onCreateCandidate }: NovoCandidatoModalProps) {
  const router = useRouter()
  const [form, setForm] = useState(() => buildNovoCandidatoFormState())
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    if (!form.nome.trim()) {
      setFeedback({ type: "error", text: "Informe o nome do aprovado." })
      return
    }

    const classificacao = form.classificacao ? Number(form.classificacao) : NaN
    if (Number.isNaN(classificacao)) {
      setFeedback({ type: "error", text: "Classificação inválida." })
      return
    }

    startTransition(async () => {
      try {
        await onCreateCandidate({
          nome: form.nome.trim(),
          sistema_concorrencia: form.sistema,
          classificacao_lista: classificacao,
        })
        setFeedback({ type: "success", text: "Aprovado cadastrado com sucesso." })
        setForm(buildNovoCandidatoFormState({ sistema: form.sistema }))
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível salvar o aprovado."
        setFeedback({ type: "error", text: message })
      }
    })
  }

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setFeedback(null)
      setForm(buildNovoCandidatoFormState())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <KanbanDialogContent size="large">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Adicionar aprovado"
            description="Registre rapidamente um aprovado para que ele apareça nas listas do sistema."
          />

          <KanbanDialogBody>
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Nome completo</label>
                <Input
                  value={form.nome}
                  onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
                  placeholder="Nome do aprovado"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Sistema</label>
                  <Select value={form.sistema} onValueChange={(value) => setForm((prev) => ({ ...prev, sistema: value as SistemaConcorrencia }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Ampla concorrência</SelectItem>
                      <SelectItem value="PCD">PCD</SelectItem>
                      <SelectItem value="PPP">PPP</SelectItem>
                      <SelectItem value="IND">Indígena</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Classificação</label>
                  <Input
                    type="number"
                    value={form.classificacao}
                    onChange={(event) => setForm((prev) => ({ ...prev, classificacao: event.target.value }))}
                    placeholder="Ex: 120"
                    min="1"
                  />
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
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:bg-red-300"
            >
              {isPending ? "Salvando..." : "Cadastrar aprovado"}
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

function CandidateSelect({ value, onChange, candidates, placeholder = "Selecione o aprovado" }: CandidateSelectProps) {
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
        <SelectValue placeholder={placeholder} />
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

type NomeacaoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: CandidateSummary[]
  onRegistrarNomeacao: ComissaoDashboardActions["registrarNomeacao"]
}

export function NomeacaoModal({ open, onOpenChange, candidates, onRegistrarNomeacao }: NomeacaoModalProps) {
  const router = useRouter()
  const buildForm = () => ({
    candidateId: "",
    dataNomeacao: "",
    numeroAto: "",
    fonteUrl: "",
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
      setFeedback({ type: "error", text: "Selecione o aprovado nomeado." })
      return
    }

    if (!form.dataNomeacao) {
      setFeedback({ type: "error", text: "Informe a data da nomeação." })
      return
    }

    startTransition(async () => {
      try {
        await onRegistrarNomeacao({
          candidateId: form.candidateId,
          dataNomeacao: form.dataNomeacao,
          numeroAto: form.numeroAto || null,
          fonteUrl: form.fonteUrl || null,
          observacao: form.observacao || null,
          shouldNotify: form.shouldNotify,
        })
        setFeedback({ type: "success", text: "Nomeação registrada." })
        setForm(buildForm())
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao registrar nomeação."
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
      <KanbanDialogContent size="wide">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Registrar nomeação"
            description="Crie o registro oficial da nomeação e atualize automaticamente o status do aprovado."
          />

          <KanbanDialogBody>
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Aprovado</label>
                <CandidateSelect
                  value={form.candidateId}
                  onChange={(value) => setForm((prev) => ({ ...prev, candidateId: value }))}
                  candidates={candidates}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Data da nomeação</label>
                  <Input
                    type="date"
                    value={form.dataNomeacao}
                    onChange={(event) => setForm((prev) => ({ ...prev, dataNomeacao: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Número do ato (opcional)</label>
                  <Input
                    value={form.numeroAto}
                    onChange={(event) => setForm((prev) => ({ ...prev, numeroAto: event.target.value }))}
                    placeholder="Portaria nº ..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Link / fonte (opcional)</label>
                <Input
                  value={form.fonteUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, fonteUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Observação</label>
                <textarea
                  value={form.observacao}
                  onChange={(event) => setForm((prev) => ({ ...prev, observacao: event.target.value }))}
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
                  placeholder="Detalhes adicionais (ex.: publicação no DOU)"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                  checked={form.shouldNotify}
                  onChange={(event) => setForm((prev) => ({ ...prev, shouldNotify: event.target.checked }))}
                />
                Notificar aprovados sobre esta atualização
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
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:bg-red-300"
            >
              {isPending ? "Registrando..." : "Registrar nomeação"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}

type NovaAprovacaoModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidates: CandidateSummary[]
  onSaveOutraAprovacao: ComissaoDashboardActions["saveOutraAprovacao"]
}

export function NovaAprovacaoModal({ open, onOpenChange, candidates, onSaveOutraAprovacao }: NovaAprovacaoModalProps) {
  const router = useRouter()
  const buildForm = () => ({
    candidateId: "",
    orgao: "",
    cargo: "TJAA",
    sistema: "AC" as SistemaConcorrencia,
    classificacao: "",
    pretende: "SIM" as PretendeAssumirChoice,
    jaNomeado: "NAO" as JaNomeadoChoice,
    observacao: "",
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

    if (!form.orgao.trim()) {
      setFeedback({ type: "error", text: "Informe o órgão." })
      return
    }

    const classificacao = form.classificacao ? Number(form.classificacao) : null
    if (form.classificacao && Number.isNaN(classificacao as number)) {
      setFeedback({ type: "error", text: "Classificação inválida." })
      return
    }

    startTransition(async () => {
      try {
        await onSaveOutraAprovacao({
          candidateId: form.candidateId,
          orgao: form.orgao.trim(),
          cargo: form.cargo.trim(),
          sistemaConcorrencia: form.sistema,
          classificacao,
          pretendeAssumir: form.pretende,
          jaNomeado: form.jaNomeado,
          observacao: form.observacao.trim() || null,
        })
        setFeedback({ type: "success", text: "Aprovação registrada." })
        setForm(buildForm())
        router.refresh()
        onOpenChange(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao salvar aprovação."
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
      <KanbanDialogContent size="wide">
        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <KanbanDialogHeader
            title="Cadastrar aprovação manual"
            description="Registre aprovações comunicadas diretamente à comissão para manter o histórico atualizado."
          />

          <KanbanDialogBody>
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Aprovado</label>
                <CandidateSelect
                  value={form.candidateId}
                  onChange={(value) => setForm((prev) => ({ ...prev, candidateId: value }))}
                  candidates={candidates}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Órgão</label>
                  <Input value={form.orgao} onChange={(event) => setForm((prev) => ({ ...prev, orgao: event.target.value }))} placeholder="TRT-2" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Cargo</label>
                  <Input value={form.cargo} onChange={(event) => setForm((prev) => ({ ...prev, cargo: event.target.value }))} placeholder="TJAA" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Sistema</label>
                  <Select value={form.sistema} onValueChange={(value) => setForm((prev) => ({ ...prev, sistema: value as SistemaConcorrencia }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Ampla</SelectItem>
                      <SelectItem value="PCD">PCD</SelectItem>
                      <SelectItem value="PPP">PPP</SelectItem>
                      <SelectItem value="IND">Indígena</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Classificação</label>
                  <Input
                    type="number"
                    value={form.classificacao}
                    onChange={(event) => setForm((prev) => ({ ...prev, classificacao: event.target.value }))}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Pretende assumir?</label>
                  <Select value={form.pretende} onValueChange={(value) => setForm((prev) => ({ ...prev, pretende: value as PretendeAssumirChoice }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIM">Sim</SelectItem>
                      <SelectItem value="TALVEZ">Talvez</SelectItem>
                      <SelectItem value="NAO">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Já nomeado?</label>
                  <Select value={form.jaNomeado} onValueChange={(value) => setForm((prev) => ({ ...prev, jaNomeado: value as JaNomeadoChoice }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIM">Sim</SelectItem>
                      <SelectItem value="NAO">Não</SelectItem>
                      <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Observação</label>
                  <Input
                    value={form.observacao}
                    onChange={(event) => setForm((prev) => ({ ...prev, observacao: event.target.value }))}
                    placeholder="Detalhes adicionais"
                  />
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
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:bg-red-300"
            >
              {isPending ? "Salvando..." : "Salvar aprovação"}
            </button>
          </KanbanDialogFooter>
        </form>
      </KanbanDialogContent>
    </Dialog>
  )
}
