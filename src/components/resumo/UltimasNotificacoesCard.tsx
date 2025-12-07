"use client"

import { useState } from "react"

export type Notificacao = {
  id: string
  titulo: string
  resumo?: string | null
  corpo?: string | null
  created_at?: string
}

type Props = {
  notificacoes: Notificacao[]
}

export function UltimasNotificacoesCard({ notificacoes }: Props) {
  const [aberta, setAberta] = useState<Notificacao | null>(null)

  return (
    <>
      <div className="w-full h-[420px] rounded-[28px] bg-white/90 ring-1 ring-black/5 shadow-md shadow-black/10 flex flex-col overflow-hidden">
        <div className="bg-[#C62828] px-6 py-4 flex flex-col items-center justify-center text-center gap-1">
          <p className="font-display text-xs tracking-[0.18em] uppercase text-white">Últimas notificações</p>
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto">
          {notificacoes.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-sm text-slate-500 text-center">Ainda não há notificações cadastradas.</p>
            </div>
          ) : (
            <ul className="space-y-3 pr-1">
              {notificacoes.map(n => {
                const resumoCurto = n.resumo ?? n.corpo ?? 'Sem detalhes disponíveis.'

                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setAberta(n)}
                      className="w-full rounded-2xl px-3 py-3 hover:bg-slate-50 transition flex flex-col gap-2 border border-transparent hover:border-slate-200 text-center"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <p className="font-display text-sm uppercase tracking-[0.12em] text-slate-900 line-clamp-2">{n.titulo}</p>
                        {n.created_at && (
                          <span className="text-[11px] text-slate-400">
                            {new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{resumoCurto}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {aberta && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-lg w-full rounded-3xl bg-white shadow-xl shadow-black/30 p-6 relative">
            <button
              type="button"
              onClick={() => setAberta(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-sm"
            >
              Fechar
            </button>

            <p className="font-display text-xs tracking-[0.18em] uppercase text-[#C62828] mb-2">Notificação</p>
            <h2 className="font-display text-lg uppercase tracking-[0.16em] text-slate-900 mb-2">{aberta.titulo}</h2>
            {aberta.created_at && (
              <p className="text-xs text-slate-400 mb-4">{new Date(aberta.created_at).toLocaleString("pt-BR")}</p>
            )}
            <p className="text-sm text-slate-700 whitespace-pre-line text-center">{aberta.resumo || aberta.corpo || 'Sem detalhes.'}</p>
          </div>
        </div>
      )}
    </>
  )
}
