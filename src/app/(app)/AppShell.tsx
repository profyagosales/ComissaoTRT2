'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV_ITEMS = [
  { href: '/resumo', label: 'Resumo' },
  { href: '/listas', label: 'Listas' },
  { href: '/tds', label: 'TDs' },
  { href: '/vacancias', label: 'Vagâncias' },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen text-neutral-900">
      <div className="pointer-events-none fixed inset-0 -z-20">
        <Image
          src="/calcada-red-white.png.png"
          alt="Calçadão TJAA TRT-2"
          fill
          priority
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-white/78" />
      </div>

      <header className="sticky top-0 z-30">
        <div className="border-b border-black/5 bg-white/65 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-700 shadow-md shadow-red-700/30">
                <span className="text-xs font-semibold text-white">TJAA</span>
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
                  Comissão TJAA · TRT-2
                </div>
                <div className="text-sm font-medium text-neutral-900">Painel do aprovado</div>
              </div>
            </div>

            <nav className="flex items-center gap-1 rounded-full border border-black/5 bg-white/80 px-1 py-1 shadow-sm shadow-black/5">
              {NAV_ITEMS.map(item => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'relative rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                      'outline-none ring-red-300/60 focus-visible:ring-2',
                      active
                        ? 'bg-neutral-900 text-white shadow-sm shadow-black/20'
                        : 'text-neutral-700 hover:bg-neutral-100',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="hidden text-xs font-medium text-neutral-600 md:inline-flex">
              <Link
                href="mailto:comissao@example.com"
                className="rounded-full border border-black/5 bg-white/70 px-3 py-1 shadow-sm shadow-black/5 hover:bg-neutral-50"
              >
                Entre em contato com a Comissão
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-8">{children}</main>
    </div>
  )
}
