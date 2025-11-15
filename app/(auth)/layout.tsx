import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs tracking-[0.2em] text-zinc-400 uppercase">
            Comissão TJAA · TRT-2
          </p>
          <h1 className="mt-2 text-xl font-semibold">
            Acesso ao painel dos aprovados
          </h1>
        </div>
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-6 shadow-xl shadow-black/40">
          {children}
        </div>
        <p className="mt-6 text-[11px] text-center text-zinc-500">
          Este acesso é exclusivo para aprovados e membros da comissão do
          concurso TJAA TRT-2.
        </p>
      </div>
    </main>
  )
}
