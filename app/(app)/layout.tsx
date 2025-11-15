import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-200">
      {/* faixa preta com contato, igual landing */}
      <header className="w-full bg-black text-[11px] text-zinc-200 flex justify-end px-4 py-1">
        <a
          href="mailto:aprovadostjaa.trt2@gmail.com"
          className="inline-flex items-center gap-1 hover:text-white"
        >
          <span>📧</span>
          <span>Entre em contato com a Comissão</span>
        </a>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* navbar mínima provisória */}
        <nav className="mb-6 flex items-center justify-between text-xs text-zinc-700">
          <div className="font-semibold tracking-[0.18em] uppercase">
            Comissão TJAA · TRT-2
          </div>
          <div className="flex gap-3">
            <Link href="/app/resumo" className="hover:text-black">
              Resumo
            </Link>
            <Link href="/app/listas" className="hover:text-black">
              Listas
            </Link>
            <Link href="/app/tds" className="hover:text-black">
              TDs
            </Link>
            <Link href="/app/vacancias" className="hover:text-black">
              Vacâncias
            </Link>
          </div>
        </nav>

        {children}
      </main>
    </div>
  )
}
