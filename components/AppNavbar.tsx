"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { Instagram, LogOut, Mail } from "lucide-react"

type NavItem = {
  href: string
  label: string
  emphasis?: boolean
}

const BASE_NAV_ITEMS: NavItem[] = [
  { href: "/resumo", label: "Resumo" },
  { href: "/listas", label: "Listas" },
  { href: "/tds", label: "TDs" },
  { href: "/vacancias", label: "Vacâncias" },
]

const EMAIL = "aprovados.tjaa.trt2.2025@gmail.com"
const INSTAGRAM_URL = "https://www.instagram.com/aprovados_tjaa/"

export function AppNavbar({ isComissao = false }: { isComissao?: boolean }) {
  const pathname = usePathname()

  const navItems = useMemo(() => {
    if (!isComissao) return BASE_NAV_ITEMS
    return [...BASE_NAV_ITEMS, { href: "/comissao", label: "Comissão", emphasis: true }]
  }, [isComissao])

  return (
    <header className="sticky top-0 z-40">
      <div className="w-full rounded-b-3xl bg-gradient-to-r from-red-900 via-red-800 to-red-900 shadow-md shadow-black/40">
        <div className="flex items-center justify-between px-4 pt-1 pb-3 lg:px-6">
          <div className="flex items-center gap-3 pl-1.5">
            <div className="relative h-14 w-14 translate-y-[0.4rem] md:h-16 md:w-16">
              <Image
                src="/logo-tjaa-trt2.png"
                alt="Comissão TJAA TRT-2"
                fill
                priority
                sizes="(max-width: 768px) 3.5rem, 4rem"
                className="object-contain drop-shadow-[0_0_16px_rgba(0,0,0,0.55)]"
              />
            </div>

            <div className="leading-tight text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-red-100/90">
                Comissão TJAA · TRT-2
              </p>
              <p className="text-sm font-semibold md:text-base">Painel do aprovado</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-1 md:gap-3">
            <Link
              href={`mailto:${EMAIL}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-red-50 shadow-sm shadow-black/40 transition-colors hover:bg-black/40"
              aria-label="Contato por e-mail"
            >
              <Mail className="h-4 w-4" aria-hidden />
            </Link>

            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-red-50 shadow-sm shadow-black/40 transition-colors hover:bg-black/40"
              aria-label="Instagram da Comissão"
            >
              <Instagram className="h-4 w-4" aria-hidden />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3.5 py-1.5 text-xs font-semibold text-red-50 shadow-sm shadow-black/40 transition-colors hover:bg-black/45"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              <span>Sair</span>
            </Link>
          </div>
        </div>

        <div className="mt-[-42px] flex justify-center px-4 pb-2 pt-1 lg:mt-[-44px] lg:px-6 lg:pb-2.5 lg:pt-1.5">
          <nav className="flex flex-wrap items-center justify-center gap-2">
            {navItems.map(item => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const isEmphasis = Boolean(item.emphasis)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex items-center rounded-full px-5 py-[0.35rem] text-sm font-medium transition-all",
                    "outline-none ring-2 ring-transparent focus-visible:ring-white/80",
                    isEmphasis
                      ? active
                        ? "bg-black text-white shadow-sm shadow-black/40"
                        : "bg-black/90 text-white hover:bg-black"
                      : active
                        ? "bg-white text-red-900 shadow-sm shadow-black/30"
                        : "bg-white/10 text-red-50 hover:bg-white/18",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
