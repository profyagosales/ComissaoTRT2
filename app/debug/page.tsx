'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

type Candidate = {
  id: string
  nome: string
  sistema_concorrencia: string
  classificacao_lista: number
  id_unico: string
}

export default function DebugPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabaseBrowser
        .from('candidates')
        .select('id, nome, sistema_concorrencia, classificacao_lista, id_unico')
        .limit(5)

      if (error) {
        setError(error.message)
      } else {
        setCandidates(data ?? [])
      }
      setLoading(false)
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-50 p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Supabase</h1>

      {loading && <p>Carregando...</p>}
      {error && (
        <p className="text-sm text-red-400">
          Erro ao consultar candidates: {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="mb-2 text-sm text-zinc-300">
            {candidates.length === 0
              ? 'Nenhum candidato cadastrado ainda.'
              : 'Primeiros candidatos encontrados:'}
          </p>
          <pre className="bg-zinc-800 rounded-lg p-4 text-xs overflow-auto">
            {JSON.stringify(candidates, null, 2)}
          </pre>
        </>
      )}
    </main>
  )
}
