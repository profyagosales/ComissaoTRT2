'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

type Candidate = {
  id: string
  nome: string
  sistema_concorrencia: string
  classificacao_lista: number
  id_unico: string
}

export default function SignupPage() {
  const router = useRouter()

  // passo 1 – auth
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // passo 2 – quem é você?
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Candidate[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  )

  // passo 3 – dados pessoais
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [otherSocial, setOtherSocial] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleSearchCandidates() {
    setErrorMsg(null)
    setSearching(true)

    const { data, error } = await supabaseBrowser
      .from('candidates')
      .select('id, nome, sistema_concorrencia, classificacao_lista, id_unico')
      .ilike('nome', `%${search}%`)
      .order('nome', { ascending: true })
      .limit(10)

    setSearching(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setSearchResults(data ?? [])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!selectedCandidate) {
      setErrorMsg('Selecione seu nome na lista de aprovados para continuar.')
      return
    }

    setSubmitting(true)

    // 1) cria usuário no Supabase Auth
    const { data: signUpData, error: signUpError } =
      await supabaseBrowser.auth.signUp({
        email,
        password,
      })

    if (signUpError) {
      setSubmitting(false)
      setErrorMsg(signUpError.message)
      return
    }

    const user = signUpData.user
    if (!user) {
      setSubmitting(false)
      setErrorMsg(
        'Não foi possível obter o usuário recém-criado. Tente novamente.',
      )
      return
    }

    // 2) cria perfil vinculado ao candidato
    const { error: profileError } = await supabaseBrowser
      .from('user_profiles')
      .insert({
        user_id: user.id,
        candidate_id: selectedCandidate.id,
        role: 'PUBLICO',
        telefone: phone || null,
        instagram: instagram || null,
        facebook: null,
        outras_redes: otherSocial || null,
        avatar_url: null,
      })

    if (profileError) {
      setSubmitting(false)
      setErrorMsg(
        `Perfil criado, mas houve erro ao vincular ao candidato: ${profileError.message}`,
      )
      return
    }

    setSubmitting(false)
    setSuccessMsg(
      'Perfil criado com sucesso! Você já pode acessar o painel dos aprovados.',
    )

    // pequena pausa só pra mostrar a mensagem
    setTimeout(() => {
      router.push('/resumo')
    }, 800)
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Criar perfil de aprovado</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* PASSO 1 – LOGIN */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-[0.2em]">
            1 · Acesso
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              E-mail para login
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
              placeholder="Defina uma senha segura"
            />
          </div>
        </section>

        {/* PASSO 2 – QUEM É VOCÊ */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-[0.2em]">
            2 · Quem é você?
          </h3>

          <p className="text-[11px] text-zinc-400">
            Digite seu nome como aparece na lista oficial de aprovados. Escolha
            o registro correspondente para vincular seu perfil.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="Comece digitando seu nome…"
            />
            <button
              type="button"
              onClick={handleSearchCandidates}
              disabled={!search || searching}
              className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/80 text-xs divide-y divide-zinc-800">
              {searchResults.map(c => {
                const selected = selectedCandidate?.id === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCandidate(c)}
                    className={`w-full text-left px-3 py-2 hover:bg-zinc-800/80 ${
                      selected ? 'bg-red-900/40' : ''
                    }`}
                  >
                    <div className="font-medium text-zinc-100">{c.nome}</div>
                    <div className="text-[10px] text-zinc-400 flex gap-2 mt-0.5">
                      <span>Lista: {c.sistema_concorrencia}</span>
                      <span>Classificação: {c.classificacao_lista}</span>
                      <span>ID: {c.id_unico}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedCandidate && (
            <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-100">
              <div className="font-semibold">
                Você selecionou: {selectedCandidate.nome}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>
                  Lista: {selectedCandidate.sistema_concorrencia} · Classificação:{' '}
                  {selectedCandidate.classificacao_lista}
                </span>
                <span>ID: {selectedCandidate.id_unico}</span>
              </div>
            </div>
          )}
        </section>

        {/* PASSO 3 – DADOS PESSOAIS */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-[0.2em]">
            3 · Contato (visível só para a Comissão)
          </h3>

          <p className="text-[11px] text-zinc-400">
            Esses dados ficam restritos aos membros da Comissão. Servem para que
            possamos entrar em contato em caso de dúvidas sobre TD, nomeações
            etc.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Telefone / WhatsApp (opcional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="(11) 99999-0000"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Instagram (opcional)
            </label>
            <input
              type="text"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="@seuusuario"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Outras redes / contato (opcional)
            </label>
            <input
              type="text"
              value={otherSocial}
              onChange={e => setOtherSocial(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder="LinkedIn, Facebook etc."
            />
          </div>
        </section>

        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        {successMsg && (
          <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
            {successMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 inline-flex items-center justify-center rounded-full bg-red-700 px-4 py-2 text-sm font-semibold tracking-wide text-white shadow-lg shadow-red-900/40 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Criando perfil…' : 'Criar meu perfil de aprovado'}
        </button>
      </form>

      <p className="mt-4 text-xs text-zinc-400 text-center">
        Já tem perfil?{' '}
        <Link
          href="/login"
          className="font-medium text-red-300 hover:text-red-200 underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </>
  )
}
