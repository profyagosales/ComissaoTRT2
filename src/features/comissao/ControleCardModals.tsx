"use client"

import { useMemo, useState, useTransition } from "react"
import type { FormEvent, ReactNode } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { NotificationQueueItem } from "./loadComissaoData"
import {
  cancelNotificationAction,
  enqueueCustomNotificationAction,
  generateExportAction,
  retryNotificationAction,
} from "./comissao-actions"

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

const statusColors: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-700",
  ENVIADO: "bg-emerald-100 text-emerald-700",
  ERRO: "bg-red-100 text-red-700",
  CANCELADO: "bg-zinc-100 text-zinc-500",
}

type NotificationQueueModalProps = {
  queue: NotificationQueueItem[]
}

function NotificationQueueModal({ queue }: NotificationQueueModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [customForm, setCustomForm] = useState({ titulo: "", corpo: "", tipo: "INFORMATIVO", visivelPara: "APROVADOS" })

  const resume = useMemo(() => {
    return queue.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }, [queue])

  const handleRetry = (id: string) => {
    startTransition(async () => {
      setMessage(null)
      try {
        await retryNotificationAction({ notificationId: id })
        setMessage({ type: "success", text: "Notificação reenfileirada." })
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao reenfileirar."
        setMessage({ type: "error", text })
      }
    })
  }

  const handleCancel = (id: string) => {
    startTransition(async () => {
      setMessage(null)
      try {
        await cancelNotificationAction({ notificationId: id })
        setMessage({ type: "success", text: "Notificação cancelada." })
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao cancelar."
        setMessage({ type: "error", text })
      }
    })
  }

  const handleCreate = (event: FormEvent) => {
    event.preventDefault()
    if (!customForm.titulo.trim() || !customForm.corpo.trim()) {
      setMessage({ type: "error", text: "Informe título e corpo." })
      return
    }
    startTransition(async () => {
      try {
        await enqueueCustomNotificationAction({
          titulo: customForm.titulo.trim(),
          corpo: customForm.corpo.trim(),
          tipo: customForm.tipo.trim() || "CUSTOM",
          visivelPara: customForm.visivelPara,
        })
        setMessage({ type: "success", text: "Notificação adicionada à fila." })
        setCustomForm((prev) => ({ ...prev, titulo: "", corpo: "" }))
        router.refresh()
      } catch (error) {
        const text = error instanceof Error ? error.message : "Erro ao criar notificação."
        setMessage({ type: "error", text })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton>Fila de notificações</ActionButton>
      </DialogTrigger>
      <DialogContent className={cn(dialogContentClasses, "space-y-6")}> 
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-zinc-900">Fila de notificações</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Acompanhe o envio de avisos para os aprovados e ajuste mensagens conforme necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(resume).map(([status, value]) => (
                <span key={status} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                  {status}: {value}
                </span>
              ))}
              {!queue.length && <span className="text-xs text-zinc-400">Fila vazia</span>}
            </div>

            <div className="max-h-[48vh] space-y-3 overflow-y-auto pr-2">
              {queue.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma notificação cadastrada.</p>
              ) : (
                queue.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-zinc-100 bg-white/80 p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{item.tipo ?? "Custom"}</p>
                        <p className="text-base font-semibold text-zinc-900">{item.titulo}</p>
                        <p className="text-xs text-zinc-500 line-clamp-2">{item.corpo}</p>
                      </div>
                      <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", statusColors[item.status] ?? "bg-zinc-100 text-zinc-500")}>{item.status}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>
                        Criada em {new Date(item.createdAt).toLocaleString("pt-BR")}
                      </span>
                      <div className="space-x-2">
                        {item.status === "ERRO" || item.status === "PENDENTE" ? (
                          <button
                            type="button"
                            onClick={() => handleRetry(item.id)}
                            disabled={isPending}
                            className="text-xs font-semibold text-red-600 hover:text-red-500"
                          >
                            Reenfileirar
                          </button>
                        ) : null}
                        {item.status !== "ENVIADO" ? (
                          <button
                            type="button"
                            onClick={() => handleCancel(item.id)}
                            disabled={isPending}
                            className="text-xs font-semibold text-zinc-600 hover:text-zinc-500"
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {item.errorMessage ? (
                      <p className="mt-2 rounded-xl bg-red-50 px-2 py-1 text-[11px] text-red-700">Último erro: {item.errorMessage}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Título</label>
              <Input value={customForm.titulo} onChange={(event) => setCustomForm((prev) => ({ ...prev, titulo: event.target.value }))} placeholder="Atualização semanal" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Corpo</label>
              <textarea
                value={customForm.corpo}
                onChange={(event) => setCustomForm((prev) => ({ ...prev, corpo: event.target.value }))}
                rows={4}
                className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
                placeholder="Mensagem a ser enviada"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Tipo</label>
                <Input value={customForm.tipo} onChange={(event) => setCustomForm((prev) => ({ ...prev, tipo: event.target.value }))} placeholder="INFORMATIVO" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Visível para</label>
                <select
                  value={customForm.visivelPara}
                  onChange={(event) => setCustomForm((prev) => ({ ...prev, visivelPara: event.target.value }))}
                  className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm text-zinc-900 focus:border-red-400 focus:outline-none"
                >
                  <option value="APROVADOS">Aprovados</option>
                  <option value="SERVIDORES">Servidores</option>
                </select>
              </div>
            </div>

            <MessageBanner state={message} />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-red-500 disabled:bg-red-300"
              >
                {isPending ? "Salvando..." : "Adicionar à fila"}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ReportsModal() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleExport = (type: "candidates" | "vacancias") => {
    startTransition(async () => {
      setMessage(null)
      try {
        const result = await generateExportAction({ type })
        const blob = new Blob([result.content], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = result.filename
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
        URL.revokeObjectURL(url)
        setMessage({ type: "success", text: "Exportação gerada." })
      } catch (error) {
        const text = error instanceof Error ? error.message : "Não foi possível gerar o arquivo."
        setMessage({ type: "error", text })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton>Relatórios</ActionButton>
      </DialogTrigger>
      <DialogContent className={cn(dialogContentClasses, "space-y-6")}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-zinc-900">Relatórios rápidos</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Gere CSVs atualizados para compartilhar com a administração ou com os aprovados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleExport("candidates")}
              disabled={isPending}
              className="rounded-2xl border border-zinc-100 bg-white/70 px-4 py-3 text-left shadow-sm transition hover:border-red-200 disabled:opacity-60"
            >
              <p className="text-base font-semibold text-zinc-900">CSV de aprovados</p>
              <p className="text-xs text-zinc-500">Nomeações, TDs e situação atual.</p>
            </button>
            <button
              type="button"
              onClick={() => handleExport("vacancias")}
              disabled={isPending}
              className="rounded-2xl border border-zinc-100 bg-white/70 px-4 py-3 text-left shadow-sm transition hover:border-red-200 disabled:opacity-60"
            >
              <p className="text-base font-semibold text-zinc-900">CSV de vacâncias</p>
              <p className="text-xs text-zinc-500">Saídas registradas e metadados.</p>
            </button>
          </div>

          <MessageBanner state={message} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ControleCardActions({ queue }: { queue: NotificationQueueItem[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <NotificationQueueModal queue={queue} />
      <ReportsModal />
    </div>
  )
}
