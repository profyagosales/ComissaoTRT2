"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { NotificationsMenu, type NavbarNotification } from "@/components/NotificationsMenu"

type NavItem = {
  href: string
  label: string
  requiresComissao?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/resumo", label: "Resumo" },
  { href: "/listas", label: "Listas" },
  { href: "/tds", label: "TDs" },
  { href: "/vacancias", label: "Vacâncias" },
  { href: "/comissao", label: "Comissão", requiresComissao: true },
]

type AppNavbarProps = {
  isComissao?: boolean
  notifications?: NavbarNotification[]
}

export function AppNavbar({ isComissao = false, notifications = [] }: AppNavbarProps) {
  const pathname = usePathname()

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => (item.requiresComissao ? isComissao : true)),
    [isComissao],
  )

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="sticky top-0 z-40 hidden bg-[#01426A] text-white md:block">
      <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex flex-1 items-center">
          <span className="font-display text-lg text-white whitespace-nowrap">Aprovados TJAA · TRT-2</span>
        </div>

        <nav className="flex flex-1 items-center justify-center">
          <div className="flex max-w-full overflow-x-auto px-3">
            <ul className="flex flex-nowrap items-center justify-center gap-2 md:gap-3">
              {navItems.map((item) => {
              const isComissaoTab = item.href === "/comissao"
              const baseClasses = "inline-flex items-center rounded-full px-4 py-2 text-xs font-display transition-colors whitespace-nowrap md:text-sm"
              const linkClasses = isComissaoTab
                ? cn(baseClasses, "bg-[#FFCD00] text-[#01426A] hover:brightness-95")
                : cn(
                    baseClasses,
                    isActive(item.href)
                      ? "bg-white text-[#01426A]"
                      : "bg-[#0067A0] text-white hover:bg-white/10",
                  )

                return (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClasses}>
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <NotificationsMenu notifications={notifications} />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/16 px-4 py-2 text-[12px] font-medium text-white/90 shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition hover:border-white/45 hover:bg-white/24 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>Sair</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
