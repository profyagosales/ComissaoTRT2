'use client'

import { useState } from 'react'

type ComissaoFabProps = {
  isComissao: boolean
}

export function ComissaoFab({ isComissao }: ComissaoFabProps) {
  const [open, setOpen] = useState(false)

  if (!isComissao) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-2xl font-bold text-white shadow-xl hover:bg-neutral-800"
      >
        {open ? '×' : '+'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-30 w-72 rounded-3xl bg-neutral-900/95 p-4 text-sm text-neutral-100 shadow-2xl backdrop-blur-md">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Ações da Comissão
          </p>
          <div className="space-y-2">
            <button className="w-full rounded-2xl bg-neutral-100 px-3 py-2 text-left text-xs font-medium text-neutral-900 hover:bg-neutral-200">
              Confirmar TDs preenchidos
            </button>
            <button className="w-full rounded-2xl bg-neutral-100 px-3 py-2 text-left text-xs font-medium text-neutral-900 hover:bg-neutral-200">
              Confirmar Outras Aprovações
            </button>
            <button className="w-full rounded-2xl bg-red-700 px-3 py-2 text-left text-xs font-semibold text-white hover:bg-red-800">
              Cadastrar novo TD
            </button>
            <button className="w-full rounded-2xl bg-red-700 px-3 py-2 text-left text-xs font-semibold text-white hover:bg-red-800">
              Cadastrar nova aprovação
            </button>
            <button className="w-full rounded-2xl bg-red-700 px-3 py-2 text-left text-xs font-semibold text-white hover:bg-red-800">
              Cadastrar nova vacância
            </button>
            <button className="w-full rounded-2xl bg-red-700 px-3 py-2 text-left text-xs font-semibold text-white hover:bg-red-800">
              Cadastrar nova nomeação
            </button>
            <button className="w-full rounded-2xl bg-neutral-100 px-3 py-2 text-left text-xs font-medium text-neutral-900 hover:bg-neutral-200">
              Candidatos nomeados em outros concursos
            </button>
            <button className="w-full rounded-2xl bg-neutral-100 px-3 py-2 text-left text-xs font-medium text-neutral-900 hover:bg-neutral-200">
              Nova atualização do painel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
