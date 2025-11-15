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
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

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

    // 2) envia avatar, se houver
    let avatarUrl: string | null = null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg'
      const filePath = `${user.id}.${ext}`

      const { error: uploadError } = await supabaseBrowser.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          upsert: true,
        })

      if (uploadError) {
        console.error('Erro ao subir avatar:', uploadError.message)
      } else {
        const { data: publicData } = supabaseBrowser.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = publicData?.publicUrl ?? null
      }
    }

    // 3) cria perfil vinculado ao candidato
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
        avatar_url: avatarUrl,
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
    setAvatarFile(null)

    // pequena pausa só pra mostrar a mensagem
    setTimeout(() => {
      router.push('/resumo')
    }, 800)
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mx-auto w-full rounded-3xl border border-black/5 bg-neutral-200/95 p-8 shadow-2xl backdrop-blur-md text-neutral-900">
        <h2 className="mb-4 text-lg font-semibold">Criar perfil de aprovado</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PASSO 1 – LOGIN */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">
              1 · Acesso
            </h3>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-800">
                E-mail para login
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                className="h-11 w-full rounded-xl border border-neutral-400 bg-neutral-300/95 px-3 text-sm text-neutral-900 placeholder:text-neutral-600 shadow-sm focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                placeholder="Defina uma senha segura"
              />
            </div>
          </section>

          {/* PASSO 2 – QUEM É VOCÊ */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">
              2 · Quem é você?
            </h3>

            <p className="text-xs text-neutral-600">
              Digite seu nome como aparece na lista oficial de aprovados. Escolha
              o registro correspondente para vincular seu perfil.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-11 flex-1 rounded-xl border border-neutral-400 bg-neutral-300/95 px-3 text-sm text-neutral-900 placeholder:text-neutral-600 shadow-sm focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                placeholder="Comece digitando seu nome…"
              />
              <button
                type="button"
                onClick={handleSearchCandidates}
                disabled={!search || searching}
                className="rounded-xl bg-neutral-900 px-4 text-xs font-semibold text-neutral-50 shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {searching ? 'Buscando…' : 'Buscar'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-2xl border border-neutral-300 bg-white text-xs text-neutral-900 divide-y divide-neutral-200 shadow-sm">
                {searchResults.map(c => {
                  const selected = selectedCandidate?.id === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCandidate(c)}
                      className={`w-full px-3 py-2 text-left transition ${
                        selected
                          ? 'bg-amber-50 text-neutral-900'
                          : 'hover:bg-neutral-100'
                      }`}
                    >
                      <div className="font-medium">{c.nome}</div>
                      <div className="mt-0.5 flex gap-2 text-[10px] text-neutral-500">
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
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
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
          <section className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-50 via-amber-50 to-white px-6 py-6 shadow-inner">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-red-800">
              3 · Contato (visível somente à Comissão)
            </p>

            <p className="mt-3 text-sm text-neutral-700">
              Estes dados ficam restritos aos membros da Comissão. 
              Servem para que possamos entrar em contato em caso de dúvidas sobre TD, nomeações etc.
            </p>

            <div className="mt-5 space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-400 bg-neutral-300/95 px-3 text-sm text-neutral-900 placeholder:text-neutral-600 shadow-sm focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                placeholder="(11) 99999-0000"
              />
            </div>

            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">
                Instagram (opcional)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-400 bg-neutral-300/95 px-3 text-sm text-neutral-900 placeholder:text-neutral-600 shadow-sm focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                placeholder="@seuusuario"
              />
            </div>

            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">
                Outras redes / contato (opcional)
              </label>
              <input
                type="text"
                value={otherSocial}
                onChange={e => setOtherSocial(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-400 bg-neutral-300/95 px-3 text-sm text-neutral-900 placeholder:text-neutral-600 shadow-sm focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                placeholder="LinkedIn, Facebook etc."
              />
            </div>

            <div className="mt-6 space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">
                Foto de perfil (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={event =>
                  setAvatarFile(event.target.files?.[0] ?? null)
                }
                className="block w-full cursor-pointer rounded-2xl border border-dashed border-neutral-400 bg-white/70 px-3 py-3 text-sm text-neutral-700 file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800"
              />
              <p className="text-xs text-neutral-600">
                Aceitamos PNG ou JPG até 5MB. Caso não envie, usaremos suas iniciais.
              </p>
            </div>
          </section>

          {errorMsg && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
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

        <p className="mt-4 text-center text-xs text-neutral-600">
          Já tem perfil?{' '}
          <Link
            href="/login"
            className="font-medium text-red-600 underline-offset-4 hover:underline"
          >
            Voltar para o login
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
