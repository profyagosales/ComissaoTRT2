'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSubmitting(true)

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    })

    setSubmitting(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    // depois essa rota vai existir com o app logado
    router.push('/resumo')
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Entrar</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">
            E-mail cadastrado
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="seuemail@exemplo.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            placeholder="••••••••"
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 inline-flex items-center justify-center rounded-full bg-red-700 px-4 py-2 text-sm font-semibold tracking-wide text-white shadow-lg shadow-red-900/40 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Entrando…' : 'Entrar no ambiente do aprovado'}
        </button>
      </form>

      <p className="mt-4 text-xs text-zinc-400 text-center">
        Ainda não tem perfil?{' '}
        <Link
          href="/signup"
          className="font-medium text-red-300 hover:text-red-200 underline-offset-4 hover:underline"
        >
          Criar meu perfil de aprovado
        </Link>
      </p>
    </>
  )
}
