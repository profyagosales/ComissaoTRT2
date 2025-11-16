'use client'

import { useState } from 'react'

import type { CandidateListRow, ListasData } from './loadListasData'

type Props = {
  listas: ListasData
  isComissao: boolean
}

type AbaKey = 'geral' | 'ac' | 'pcd' | 'ppp' | 'indigena'

const ABAS: { key: AbaKey; label: string }[] = [
  { key: 'geral', label: 'Ordem de nomeação (geral)' },
  { key: 'ac', label: 'Ampla concorrência' },
  { key: 'pcd', label: 'Pessoa com deficiência' },
  { key: 'ppp', label: 'Pessoas Pretas e Pardas' },
  { key: 'indigena', label: 'Indígenas' },
]

export function ListasDashboard({ listas, isComissao }: Props) {
  const [abaAtiva, setAbaAtiva] = useState<AbaKey>('geral')

  const rows: CandidateListRow[] = listas[abaAtiva]

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Listas de aprovados · TJAA TRT-2
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-700">
            Visualize a ordem de nomeação geral e por sistema de concorrência. Em versões futuras você
            poderá abrir o perfil detalhado de cada aprovado, com histórico de TD, outras aprovações e
            nomeações em outros órgãos.
          </p>
        </div>

        {isComissao && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-xs font-medium text-red-800 shadow-sm ring-1 ring-red-100">
            <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
            Acesso com perfil de Comissão — ações de cadastro/edição virão neste painel.
          </div>
        )}
      </header>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-slate-200 backdrop-blur">
        {ABAS.map(aba => {
          const ativa = abaAtiva === aba.key
          return (
            <button
              key={aba.key}
              type="button"
              onClick={() => setAbaAtiva(aba.key)}
              className={[
                'inline-flex items-center justify-center rounded-2xl px-3 py-1.5 text-xs font-medium transition',
                ativa
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-transparent text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              {aba.label}
            </button>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-3xl bg-white/90 shadow-lg ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-4 py-3 md:px-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {labelAba(abaAtiva)}
              </span>
              <span className="text-xs text-slate-600">
                {rows.length === 0
                  ? 'Nenhum aprovado cadastrado ainda nesta lista.'
                  : `${rows.length} aprovado${rows.length > 1 ? 's' : ''} listado${rows.length > 1 ? 's' : ''}.`}
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-wide text-slate-500">
              Filtros e download virão aqui
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <Th>Ordem</Th>
                <Th>Nome</Th>
                <Th>Sistema</Th>
                <Th>Classificação na lista</Th>
                <Th>Nomeado?</Th>
                <Th>TD?</Th>
                <Th className="hidden md:table-cell">Observação TD</Th>
                <Th>Outras aprovações</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={[
                    'transition hover:bg-red-50/50',
                    row.status_nomeacao === 'NOMEADO' ? 'bg-emerald-50/70' : '',
                  ].join(' ')}
                >
                  <Td className="font-mono text-xs text-slate-700">
                    {row.ordem_nomeacao_base ?? index + 1}
                  </Td>
                  <Td className="font-medium text-slate-900">{row.nome}</Td>
                  <Td>{labelSistema(row.sistema_concorrencia)}</Td>
                  <Td>{row.classificacao_lista ?? '—'}</Td>
                  <Td>{renderStatusNomeacao(row.status_nomeacao)}</Td>
                  <Td>{renderTdStatus(row.td_status)}</Td>
                  <Td className="hidden max-w-xs truncate text-xs text-slate-500 md:table-cell">
                    {row.td_observacao || '—'}
                  </Td>
                  <Td className="text-xs text-slate-600">
                    {row.outras_aprovacoes_count > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800">
                        {row.outras_aprovacoes_count} aprovação(ões)
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </Td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500 md:px-6">
                    Nenhum registro cadastrado ainda para esta lista. Assim que a Comissão inserir os
                    aprovados, a tabela aparecerá aqui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isComissao && (
        <div className="rounded-3xl border border-dashed border-red-200 bg-red-50/60 px-4 py-3 text-xs text-red-800 md:px-6">
          Em breve: botões para <strong>“Cadastrar aprovado”</strong>, editar dados da lista e
          exportar relatórios em PDF diretamente a partir desta página.
        </div>
      )}
    </section>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={[
        'px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:px-6',
        className,
      ].join(' ')}
    >
      {children}
    </th>
  )
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={['px-4 py-2.5 text-sm text-slate-800 md:px-6', className].join(' ')}>{children}</td>
  )
}

function labelAba(aba: AbaKey): string {
  switch (aba) {
    case 'geral':
      return 'Ordem geral'
    case 'ac':
      return 'Ampla concorrência'
    case 'pcd':
      return 'Pessoa com deficiência'
    case 'ppp':
      return 'PPP'
    case 'indigena':
      return 'Indígenas'
    default:
      return ''
  }
}

function labelSistema(sistema: CandidateListRow['sistema_concorrencia']) {
  switch (sistema) {
    case 'AC':
      return 'Ampla'
    case 'PCD':
      return 'PCD'
    case 'PPP':
      return 'PPP'
    case 'INDIGENA':
      return 'Indígena'
    default:
      return sistema
  }
}

function renderStatusNomeacao(status: string | null) {
  if (!status || status === 'AGUARDANDO') {
    return <span className="text-xs text-slate-500">Aguardando</span>
  }

  if (status === 'NOMEADO' || status === 'POSSE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {status === 'NOMEADO' ? 'Nomeado(a)' : 'Em posse'}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
      {status}
    </span>
  )
}

function renderTdStatus(status: string | null) {
  if (!status || status === 'NAO') {
    return <span className="text-xs text-slate-400">Nenhum TD</span>
  }

  if (status === 'SIM') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        TD enviado
      </span>
    )
  }

  if (status === 'TALVEZ' || status === 'PROVAVEL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        TD possível
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
      {status}
    </span>
  )
}
