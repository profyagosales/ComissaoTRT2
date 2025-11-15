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
    <div className="w-full max-w-md">
      <div className="mx-auto w-full rounded-3xl border border-black/5 bg-neutral-200/95 p-8 shadow-2xl backdrop-blur-md text-neutral-900">
        <h2 className="mb-4 text-lg font-semibold">Entrar</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">
              E-mail cadastrado
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-neutral-400 bg-neutral-300/95 px-3 text-sm text-neutral-900 placeholder:text-neutral-600 shadow-sm focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-800">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-neutral-400 bg-neutral-300/95 px-3 text-sm text-neutral-900 placeholder:text-neutral-600 shadow-sm focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              placeholder="••••••••"
            />
          </div>

          {errorMsg && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
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

        <p className="mt-4 text-center text-xs text-neutral-600">
          Ainda não tem perfil?{' '}
          <Link
            href="/signup"
            className="font-medium text-red-600 underline-offset-4 hover:underline"
          >
            Criar meu perfil de aprovado
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-[11px] text-neutral-300">
        Este acesso é exclusivo para aprovados e membros da comissão do
        concurso TJAA TRT-2.
      </p>
    </div>
  )
}
