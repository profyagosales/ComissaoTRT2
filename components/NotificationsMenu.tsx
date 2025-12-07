"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, X } from "lucide-react"

export type NavbarNotification = {
  id: string
  titulo: string
  resumo?: string | null
  corpo?: string | null
  created_at?: string | null
}

type Props = {
  notifications: NavbarNotification[]
}

const iconButtonClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#FBDB65]/70 bg-gradient-to-br from-[#FFCD00] to-[#FBDB65] text-[#01426A] shadow-[0_12px_30px_rgba(255,205,0,0.28)] transition hover:shadow-[0_14px_34px_rgba(255,205,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCD00]"

export function NotificationsMenu({ notifications }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<NavbarNotification | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  const items = useMemo(() => notifications ?? [], [notifications])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const handleSelect = (notification: NavbarNotification) => {
    setSelected(notification)
    setOpen(false)
  }

  const handleButtonClick = () => {
    const isDesktop =
      typeof window !== "undefined" && window.matchMedia('(min-width: 768px)').matches

    if (!isDesktop) {
      router.push('/notificacoes')
      return
    }

    setOpen(prev => !prev)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Abrir notificações"
        className={iconButtonClass}
        onClick={handleButtonClick}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-black/5 bg-white/95 p-4 text-left text-[#0f2f47] shadow-2xl backdrop-blur-sm">
          <header className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C62828]">
                Últimas notificações
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-[#0f2f47]/60 transition hover:text-[#0f2f47]"
              onClick={() => setOpen(false)}
            >
              Fechar
            </button>
          </header>

          {items.length === 0 ? (
            <p className="text-sm text-[#0f2f47]/60">Nenhuma notificação disponível.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {items.map(notification => {
                const resumo = notification.resumo || notification.corpo || "Sem detalhes disponíveis."
                const createdAt = notification.created_at
                  ? new Date(notification.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })
                  : null

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(notification)}
                      className="w-full rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-[#0f2f47]/10 hover:bg-[#f5f9ff]"
                    >
                      <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-[#0f2f47] line-clamp-2">
                        {notification.titulo}
                      </p>
                      {createdAt && (
                        <span className="text-[11px] text-[#0f2f47]/50">{createdAt}</span>
                      )}
                      <p className="mt-1 text-xs text-[#0f2f47]/70 line-clamp-2">{resumo}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 text-[#0f2f47] shadow-2xl">
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#0f2f47]/10 text-[#0f2f47]/50 transition hover:text-[#0f2f47]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C62828]">
              Notificação
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold uppercase tracking-[0.16em] text-[#0f2f47]">
              {selected.titulo}
            </h2>
            {selected.created_at && (
              <p className="mt-1 text-xs text-[#0f2f47]/60">
                {new Date(selected.created_at).toLocaleString("pt-BR")}
              </p>
            )}
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#0f2f47]/80">
              {selected.resumo || selected.corpo || "Sem detalhes disponíveis."}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
