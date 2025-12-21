"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Bell, Building2, FileText, Layers, ListChecks, UserCircle2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { LIST_MENU_ITEMS } from "@/components/navigation/list-menu-items"

type LinkTab = {
  key: string
  label: string
  href: string
  icon: LucideIcon
  type?: "link"
}

type MenuTab = {
  key: string
  label: string
  icon: LucideIcon
  type: "menu"
}

type TabConfig = LinkTab | MenuTab

const TABS: TabConfig[] = [
  { key: "perfil", href: "/perfil", label: "Perfil", icon: UserCircle2 },
  { key: "resumo", href: "/resumo", label: "Resumo", icon: Layers },
  { key: "listas", label: "Listas", icon: ListChecks, type: "menu" },
  { key: "tds", href: "/tds", label: "TDs", icon: FileText },
  { key: "vacancias", href: "/vacancias", label: "Vacâncias", icon: Building2 },
  { key: "notificacoes", href: "/notificacoes", label: "Notificações", icon: Bell },
]

export function AppMobileTabs() {
  const pathname = usePathname()
  const [listMenuOpen, setListMenuOpen] = useState(false)

  const isListasPath = useMemo(
    () => LIST_MENU_ITEMS.some(item => pathname === item.href || pathname.startsWith(`${item.href}/`)),
    [pathname],
  )

  useEffect(() => {
    setListMenuOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-[#01426A] text-white shadow-[0_-6px_24px_rgba(1,42,66,0.35)] md:hidden"
        aria-label="Navegação principal móvel"
      >
        <ul className="flex items-stretch justify-between gap-1 px-2 py-2">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active =
              tab.type === "menu"
                ? listMenuOpen || isListasPath
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`)

            if (tab.type === "menu") {
              return (
                <li key={tab.key} className="flex min-w-0 flex-1">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 text-xs font-medium transition",
                      active ? "bg-white/15 text-[#FBDB65]" : "text-white/80 hover:bg-white/10",
                    )}
                    aria-expanded={listMenuOpen}
                    aria-haspopup="dialog"
                    onClick={() => setListMenuOpen(true)}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[11px] leading-none">{tab.label}</span>
                  </button>
                </li>
              )
            }

            return (
              <li key={tab.key} className="flex min-w-0 flex-1">
                <Link
                  href={tab.href}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1 text-xs font-medium transition",
                    active ? "bg-white/15 text-[#FBDB65]" : "text-white/80 hover:bg-white/10",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[11px] leading-none">{tab.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {listMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#0a2745]/70 backdrop-blur-sm md:hidden">
          <button
            type="button"
            aria-label="Fechar menu de listas"
            className="absolute inset-0 h-full w-full"
            tabIndex={-1}
            onClick={() => setListMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Listas disponíveis"
            className="relative max-h-[70vh] w-full rounded-t-3xl bg-white px-4 py-5 text-[#01426A] shadow-[0_-18px_44px_rgba(1,42,66,0.35)]"
          >
            <header className="mb-4 flex items-center justify-between">
              <div className="text-left">
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C62828]">
                  Listas
                </p>
                <h2 className="text-lg font-semibold">Escolha uma lista</h2>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setListMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#01426A]/15 text-[#01426A]/60 transition hover:text-[#01426A]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <ul className="space-y-2">
              {LIST_MENU_ITEMS.map(item => {
                const childActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                        childActive
                          ? "bg-[#01426A] text-white"
                          : "bg-[#eef5fb] text-[#01426A] hover:bg-[#dce8f3]",
                      )}
                      onClick={() => setListMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
