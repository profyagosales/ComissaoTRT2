"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Building2, FileText, Layers, ListChecks, UserCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

const TABS = [
  {
    href: "/perfil",
    label: "Perfil",
    icon: UserCircle2,
  },
  {
    href: "/resumo",
    label: "Resumo",
    icon: Layers,
  },
  {
    href: "/listas",
    label: "Listas",
    icon: ListChecks,
  },
  {
    href: "/tds",
    label: "TDs",
    icon: FileText,
  },
  {
    href: "/vacancias",
    label: "Vacâncias",
    icon: Building2,
  },
  {
    href: "/notificacoes",
    label: "Notificações",
    icon: Bell,
  },
] as const

export function AppMobileTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-[#01426A] text-white shadow-[0_-6px_24px_rgba(1,42,66,0.35)] md:hidden"
      aria-label="Navegação principal móvel"
    >
      <ul className="flex items-stretch justify-between gap-1 px-2 py-2">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)

          return (
            <li key={tab.href} className="flex min-w-0 flex-1">
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
  )
}
