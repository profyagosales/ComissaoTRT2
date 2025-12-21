import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import { CalendarDays, Instagram, Mail, MessageCircle, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { ComissaoResumoConfig } from '@/features/comissao/comissao-resumo-types'
import { formatDateBrMedium } from '@/lib/date-format'
import { getCommissionLogoRelativeUrl } from '@/features/comissao/logo-utils'

export type OutraAprovacaoItem = {
  id: string
  orgao: string | null
  cargo: string | null
  sistema_concorrencia: string | null
  classificacao: number | null
  pretende_assumir: string | null
  ja_foi_nomeado: string | null
  observacao: string | null
}

type SistemaTotals = {
  total: number
  ampla: number
  pcd: number
  ppp: number
  indigena: number
}

type ConcursoResumoStats = {
  totalAprovados: number
  totalAprovadosAmpla: number
  totalAprovadosPcd: number
  totalAprovadosPpp: number
  totalAprovadosIndigena: number
  totalNomeados: number
  totalNomeadosAmpla: number
  totalNomeadosPcd: number
  totalNomeadosPpp: number
  totalNomeadosIndigena: number
}

export type ResumoHeroProps = {
  nome: string
  avatarUrl?: string | null
  email?: string | null
  telefone?: string | null
  instagram?: string | null
  concorrenciaLabel: string
  frenteLista: number
  ordemNomeacaoDisplay?: number | null
  classificacaoDisplay?: number | null
  tdStatus?: string | null
  tdObservacao?: string | null
  outrasAprovacoes: OutraAprovacaoItem[]
  editContactAction: ReactNode
  enviarTdAction: ReactNode
  novaAprovacaoAction: ReactNode
  renderOutraAprovacaoEditor: (approval: OutraAprovacaoItem) => ReactNode
  concursoResumo: ConcursoResumoStats
  totaisTDs: SistemaTotals
  resumoConfig?: ComissaoResumoConfig | null
}

const SISTEMA_LABELS: Record<string, string> = {
  AC: 'Ampla concorrência',
  PCD: 'Pessoa com deficiência',
  PPP: 'Pessoas pretas e pardas',
  INDIGENA: 'Indígena',
}

export function ResumoHero({
  nome,
  avatarUrl,
  email,
  telefone,
  instagram,
  concorrenciaLabel,
  frenteLista,
  ordemNomeacaoDisplay,
  classificacaoDisplay,
  tdStatus,
  tdObservacao,
  outrasAprovacoes,
  editContactAction,
  enviarTdAction,
  novaAprovacaoAction,
  renderOutraAprovacaoEditor,
  concursoResumo,
  totaisTDs,
  resumoConfig,
}: ResumoHeroProps) {
  const greetingName = getGreetingName(nome)
  const concorrenciaDisplay = formatConcorrencia(concorrenciaLabel)
  const classificacaoChip = formatOrdinalDisplay(classificacaoDisplay)
  const ordemChip = formatOrdinalDisplay(ordemNomeacaoDisplay)
  const tdDetails = buildTdDetails(tdStatus, tdObservacao)
  const frenteListaDisplay = formatFrenteDisplay(frenteLista)
  const metrics = [
    { label: 'Concorrência', value: concorrenciaDisplay },
    { label: 'Classificação', value: classificacaoChip },
    { label: 'Ordem de nomeação', value: ordemChip },
    { label: 'Frente na lista', value: frenteListaDisplay },
  ]
  const outrasAprovacoesContainerClass =
    outrasAprovacoes.length > 1
      ? 'space-y-3 max-h-[260px] overflow-y-auto pr-1'
      : 'space-y-3'

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
      <section className="relative flex w-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#0067A0] text-white shadow-[0_32px_60px_rgba(0,48,84,0.45)] lg:w-[70%]">
        <DecorativeBackdrop />

        <div className="relative flex h-full flex-col gap-4 p-3 sm:p-4">
          <header className="rounded-[20px] border border-white/15 bg-white/10 p-3 sm:p-4 shadow-[0_18px_32px_rgba(0,0,0,0.28)]">
            <div className="flex flex-wrap items-start gap-4">
              <ProfileAvatar name={nome} avatarUrl={avatarUrl} />

              <div className="min-w-[200px] flex-1 space-y-3">
                <div className="space-y-1">
                  <p className="font-display text-sm leading-none text-white/90">Olá,</p>
                  <p className="font-display text-xl leading-snug text-white sm:text-[1.7rem]">
                    {greetingName}
                  </p>
                </div>

                <dl className="grid gap-2 text-xs text-white/85 sm:grid-cols-2">
                  {metrics.map(metric => (
                    <div key={metric.label} className="flex flex-col gap-1">
                      <dt className="text-[11px] font-semibold text-white/70">{metric.label}</dt>
                      <dd className="text-base font-semibold text-white">
                        {metric.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </header>

          <div className="grid gap-3 md:grid-cols-2">
            <MiniCard title="Meus dados" action={editContactAction}>
              <DadosLinha
                icon={<Mail className="h-4 w-4 text-white/70" aria-hidden="true" />}
                label="E-mail"
                value={email || 'Não informado'}
              />
              <DadosLinha
                icon={<Phone className="h-4 w-4 text-white/70" aria-hidden="true" />}
                label="WhatsApp"
                value={telefone || 'Não informado'}
              />
              <DadosLinha
                icon={<Instagram className="h-4 w-4 text-white/70" aria-hidden="true" />}
                label="Instagram"
                value={instagram || 'Não informado'}
              />
            </MiniCard>

            <MiniCard title="Meu TD" action={enviarTdAction}>
              <DadosTexto label="Enviei TD?" value={tdDetails.enviei} />
              <DadosTexto label="Tenho interesse?" value={tdDetails.interesse} />
              <DadosTexto
                label="Observações"
                value={tdDetails.observacao}
                multiline
                clampLines={2}
              />
            </MiniCard>

            <MiniCard title="Minhas outras aprovações" action={novaAprovacaoAction} fullWidth>
              <div className={outrasAprovacoesContainerClass}>
                {outrasAprovacoes.length === 0 ? (
                  <p className="text-sm text-white/80">
                    Nenhuma aprovação cadastrada. Use o botão para adicionar.
                  </p>
                ) : (
                  outrasAprovacoes.map(approval => (
                    <div
                      key={approval.id}
                      className="rounded-xl border border-white/15 bg-white/12 p-4 shadow-[0_14px_28px_rgba(0,0,0,0.22)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2 text-sm text-white/85">
                          <DadosTexto label="Órgão" value={approval.orgao || '—'} />
                          <DadosTexto label="Cargo" value={approval.cargo || '—'} />
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/75">
                            <span className="font-display text-sm text-white/85">
                              Sistema: <InfoChip small>{formatSistema(approval.sistema_concorrencia)}</InfoChip>
                            </span>
                            <span className="font-display text-sm text-white/85">
                              Classificação:{' '}
                              <InfoChip small>{formatOrdinalDisplay(approval.classificacao)}</InfoChip>
                            </span>
                          </div>
                          <DadosTexto
                            label="Pretende assumir?"
                            value={formatPretendeAssumir(approval.pretende_assumir)}
                          />
                          <DadosTexto
                            label="Já foi nomeado?"
                            value={formatJaNomeado(approval.ja_foi_nomeado)}
                          />
                          <DadosTexto
                            label="Observações"
                            value={approval.observacao?.trim() || 'Sem observações.'}
                            multiline
                          />
                        </div>
                        <div className="flex shrink-0 items-start justify-end">
                          {renderOutraAprovacaoEditor(approval)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </MiniCard>
          </div>
        </div>
      </section>

      <div className="flex flex-1 basis-full items-stretch lg:w-[30%]">
        <ResumoConcursoCard
          resumoConfig={resumoConfig}
          concursoResumo={concursoResumo}
          totaisTDs={totaisTDs}
        />
      </div>
    </div>
  )
}

function ResumoConcursoCard({
  resumoConfig,
  concursoResumo,
  totaisTDs,
}: {
  resumoConfig?: ComissaoResumoConfig | null
  concursoResumo: ConcursoResumoStats
  totaisTDs: SistemaTotals
}) {
  const logoUrl = getCommissionLogoRelativeUrl(resumoConfig)
  const homologadoEm = formatDateBrMedium(resumoConfig?.homologado_em)
  const validoAte = formatDateBrMedium(resumoConfig?.valido_ate)
  const houveProrrogacao = Boolean(
    resumoConfig?.foi_prorrogado && resumoConfig.prorrogado_em && resumoConfig.valido_ate_prorrogado,
  )
  const prorrogadoEm = houveProrrogacao ? formatDateBrMedium(resumoConfig?.prorrogado_em) : null
  const validoAteProrrogado = houveProrrogacao
    ? formatDateBrMedium(resumoConfig?.valido_ate_prorrogado)
    : null

  const toNumber = (value: number | null | undefined) => {
    const numeric = Number(value ?? 0)
    return Number.isFinite(numeric) ? numeric : 0
  }

  const aprovadosTotals: SistemaTotals = {
    total: toNumber(concursoResumo.totalAprovados),
    ampla: toNumber(concursoResumo.totalAprovadosAmpla),
    pcd: toNumber(concursoResumo.totalAprovadosPcd),
    ppp: toNumber(concursoResumo.totalAprovadosPpp),
    indigena: toNumber(concursoResumo.totalAprovadosIndigena),
  }

  const nomeadosTotals: SistemaTotals = {
    total: toNumber(concursoResumo.totalNomeados),
    ampla: toNumber(concursoResumo.totalNomeadosAmpla),
    pcd: toNumber(concursoResumo.totalNomeadosPcd),
    ppp: toNumber(concursoResumo.totalNomeadosPpp),
    indigena: toNumber(concursoResumo.totalNomeadosIndigena),
  }

  const aguardandoTotals = computeAguardandoTotals(aprovadosTotals, nomeadosTotals, totaisTDs)

  const totalsCards = [
    { id: 'aprovados', label: 'Total aprovados', totals: aprovadosTotals },
    { id: 'nomeados', label: 'Total nomeados', totals: nomeadosTotals },
    { id: 'aguardando', label: 'Aguardando nomeação', totals: aguardandoTotals },
    { id: 'tds', label: 'TDs enviados', totals: totaisTDs },
  ]

  const emailValue = resumoConfig?.email_comissao?.trim() ?? ''
  const instagramValue = resumoConfig?.instagram_url?.trim() ?? ''
  const instagramHref = instagramValue ? ensureHttps(instagramValue) : null
  const instagramDisplay = instagramValue ? formatInstagramHandle(instagramValue) : 'Não informado'

  const grupoValue = resumoConfig?.grupo_aprovados_url?.trim() ?? ''
  const grupoHref = grupoValue ? ensureHttps(grupoValue) : null
  const grupoDisplay = grupoValue ? formatShortUrl(grupoValue) : 'Não informado'

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-[#0d2f50]/10 bg-[#f9fbfe] text-[#0d2f50] shadow-[0_26px_52px_rgba(9,45,82,0.12)]">
      <div className="relative flex h-full flex-col gap-7 px-6 py-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <LogoBubble logoUrl={logoUrl} />
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <h3 className="font-display text-[1.65rem] leading-tight text-[#0d2f50]">Aprovados TRT da 2ª Região</h3>
              <p className="text-sm leading-relaxed text-[#30507a]">
                Comissão de aprovados do Tribunal Regional do Trabalho da 2ª Região para o cargo de Técnico
                Judiciário – Área Administrativa (TJAA), concurso de 2025.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#3c5b84]">Canais oficiais</p>
              <div className="flex flex-wrap items-center gap-2">
                {buildContactItems({
                  emailValue,
                  instagramHref,
                  instagramDisplay,
                  grupoHref,
                  grupoDisplay,
                }).map(item => (
                  <ContactPill key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto pb-2">
          <div className="rounded-2xl border border-[#0d2f50]/12 bg-white p-5 shadow-[0_18px_36px_rgba(16,47,82,0.08)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[#3c5b84]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Validade
            </div>
            <div className="mt-3 space-y-2 text-sm text-[#24436b]">
              <p>
                <span className="font-semibold text-[#0d2f50]">Homologado em:</span> {homologadoEm}
              </p>
              <p>
                <span className="font-semibold text-[#0d2f50]">Válido até:</span> {validoAte}
              </p>
              {houveProrrogacao ? (
                <p>
                  <span className="font-semibold text-[#0d2f50]">Prorrogado em:</span> {prorrogadoEm}{' '}
                  <span className="font-semibold text-[#0d2f50]">até:</span> {validoAteProrrogado}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {totalsCards.map(card => (
              <div
                key={card.id}
                className="rounded-2xl border border-[#0d2f50]/12 bg-white p-4 text-center shadow-[0_16px_30px_rgba(12,46,82,0.08)]"
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#3c5b84]">
                  {card.label}
                </p>
                <p className="mt-3 font-display text-[1.9rem] leading-none text-[#0d2f50]">
                  {card.totals.total}
                </p>
                <p className="mt-2 text-xs text-[#466188]">
                  {formatTotalsBreakdown(card.totals)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LogoBubble({ logoUrl }: { logoUrl: string | null }) {
  const baseClass =
    'flex h-32 w-32 items-center justify-center rounded-[36px] border border-[#0d2f50]/12 shadow-[0_22px_40px_rgba(8,46,88,0.18)]'

  if (!logoUrl) {
    return (
      <div className={`${baseClass} bg-[#e7f0fc] text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0d2f50]/65`}>
        Comissão
      </div>
    )
  }

  return (
    <div className={`${baseClass} overflow-hidden bg-white p-5`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt="Logo da comissão"
        className="h-full w-full object-contain"
        loading="lazy"
        onError={event => {
          event.currentTarget.onerror = null
          event.currentTarget.src = '/logo-tjaa-trt2.png'
        }}
      />
    </div>
  )
}

type ContactItemDescriptor = {
  id: 'email' | 'instagram' | 'grupo'
  label: string
  href: string | null
  icon: LucideIcon
  title: string
  external: boolean
}

function buildContactItems({
  emailValue,
  instagramHref,
  instagramDisplay,
  grupoHref,
  grupoDisplay,
}: {
  emailValue: string
  instagramHref: string | null
  instagramDisplay: string
  grupoHref: string | null
  grupoDisplay: string
}): ContactItemDescriptor[] {
  return [
    {
      id: 'email',
      label: 'E-mail',
      href: emailValue ? `mailto:${emailValue}` : null,
      icon: Mail,
      title: emailValue || 'Sem e-mail cadastrado',
      external: false,
    },
    {
      id: 'instagram',
      label: 'Instagram',
      href: instagramHref,
      icon: Instagram,
      title: instagramHref ? instagramDisplay : 'Instagram não informado',
      external: true,
    },
    {
      id: 'grupo',
      label: 'Grupo Whatsapp',
      href: grupoHref,
      icon: MessageCircle,
      title: grupoHref ? grupoDisplay : 'Grupo de aprovados não informado',
      external: true,
    },
  ]
}

function ContactPill({ item }: { item: ContactItemDescriptor }) {
  const { icon: Icon } = item
  const baseClass =
    'inline-flex items-center gap-1.5 rounded-full border border-[#0d2f50]/20 bg-[#0d2f50]/10 px-3 py-1 text-[12px] font-medium text-[#0d2f50] shadow-[0_12px_22px_rgba(13,47,80,0.14)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d2f50]/30'

  if (item.href) {
    return (
      <a
        href={item.href}
        target={item.external ? '_blank' : '_self'}
        rel={item.external ? 'noreferrer' : undefined}
        className={`${baseClass} hover:border-[#0d2f50]/35 hover:bg-[#0d2f50]/16`}
        title={item.title}
      >
        <Icon className="h-3.5 w-3.5 text-current" aria-hidden="true" />
        <span className="leading-none">{item.label}</span>
      </a>
    )
  }

  return (
    <span
      className={`${baseClass} cursor-not-allowed opacity-60`}
      aria-disabled="true"
      title={item.title}
    >
      <Icon className="h-3.5 w-3.5 text-current" aria-hidden="true" />
      <span className="leading-none">{item.label}</span>
    </span>
  )
}

function DecorativeBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-16 top-[-24px] h-36 w-44 rotate-[11deg] rounded-[22px] bg-[#FBDB65]/35 shadow-[0_24px_45px_rgba(0,0,0,0.28)]" />
      <div className="absolute right-[-28px] bottom-[-36px] h-48 w-40 rotate-[-9deg] rounded-[22px] bg-[#00B388]/28 shadow-[0_26px_55px_rgba(0,0,0,0.32)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-[#003f66]/80" />
    </div>
  )
}

function MiniCard({
  title,
  action,
  children,
  fullWidth,
}: {
  title: string
  action: ReactNode
  children: ReactNode
  fullWidth?: boolean
}) {
  return (
    <div
      className={`rounded-[20px] border border-white/18 bg-white/12 p-3 sm:p-4 shadow-[0_18px_32px_rgba(0,0,0,0.22)] ${fullWidth ? 'md:col-span-2' : ''}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-[15px] font-normal leading-none text-white">
          {title}
        </h3>
        <div className="flex shrink-0 items-center justify-end text-white/85">{action}</div>
      </div>
      <div className="mt-3 space-y-1.5 text-[13px] text-white/85">{children}</div>
    </div>
  )
}

function DadosLinha({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 flex h-4 w-4 items-center justify-center text-white/70">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-white/70">{label}</p>
        <p className="mt-0.5 break-words text-[13px] text-white">{value}</p>
      </div>
    </div>
  )
}

function DadosTexto({
  label,
  value,
  multiline = false,
  clampLines,
}: {
  label: string
  value: string
  multiline?: boolean
  clampLines?: number
}) {
  const textClasses = [
    'text-[13px] text-white break-words',
    multiline ? 'whitespace-pre-line' : '',
    clampLines ? 'overflow-hidden' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const clampStyle: CSSProperties | undefined = clampLines
    ? {
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: clampLines,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }
    : undefined

  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-white/70">{label}</p>
      <p className={textClasses} style={clampStyle}>
        {value}
      </p>
    </div>
  )
}

function InfoChip({
  children,
  small = false,
}: {
  children: ReactNode
  small?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/25 bg-white/18 px-2 ${small ? 'py-0.5 text-[10px]' : 'py-0.5 text-xs'} font-semibold text-white shadow-[0_6px_14px_rgba(0,0,0,0.2)]`}
    >
      {children}
    </span>
  )
}

function ProfileAvatar({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl?: string | null
}) {
  const initials = getInitials(name)

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/30 bg-white/20 shadow-[0_12px_28px_rgba(0,0,0,0.3)]">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/30 to-white/10 text-lg font-semibold text-white">
          {initials}
        </div>
      )}
    </div>
  )
}

function getInitials(nome: string) {
  if (!nome) return '??'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

function getGreetingName(nome: string, maxLength = 20) {
  if (!nome) return 'aprovado(a)'
  const parts = nome.trim().split(/\s+/)
  let accumulator = ''

  for (const part of parts) {
    const candidate = accumulator ? `${accumulator} ${part}` : part
    if (candidate.length > maxLength) {
      break
    }
    accumulator = candidate
  }

  return accumulator || parts[0] || 'aprovado(a)'
}

function formatOrdinalDisplay(value?: number | null) {
  if (value === null || value === undefined) return '—'
  if (Number.isFinite(value)) {
    const numeric = Number(value)
    if (!Number.isNaN(numeric)) {
      return `#${numeric}`
    }
  }
  return '—'
}

function buildTdDetails(status?: string | null, observacao?: string | null) {
  const normalized = status?.toUpperCase() ?? null
  const note = observacao?.trim() || 'Sem observações registradas.'

  if (normalized === 'SIM') {
    return {
      enviei: 'Sim',
      interesse: 'Não (já enviado)',
      observacao: note,
    }
  }

  if (normalized === 'TALVEZ') {
    return {
      enviei: 'Não',
      interesse: 'Sim',
      observacao: note,
    }
  }

  return {
    enviei: 'Não',
    interesse: 'Não',
    observacao: note,
  }
}

function formatFrenteDisplay(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }

  const numeric = Number(value)

  if (numeric <= 0) {
    return 'Você é o próximo'
  }

  if (numeric === 1) {
    return '1 à frente'
  }

  return `${numeric} à frente`
}

function computeAguardandoTotals(
  aprovados: SistemaTotals,
  nomeados: SistemaTotals,
  tds: SistemaTotals,
): SistemaTotals {
  return {
    total: clampNonNegative(aprovados.total - nomeados.total - tds.total),
    ampla: clampNonNegative(aprovados.ampla - nomeados.ampla - tds.ampla),
    pcd: clampNonNegative(aprovados.pcd - nomeados.pcd - tds.pcd),
    ppp: clampNonNegative(aprovados.ppp - nomeados.ppp - tds.ppp),
    indigena: clampNonNegative(aprovados.indigena - nomeados.indigena - tds.indigena),
  }
}

function clampNonNegative(value: number) {
  return value > 0 ? Math.round(value) : 0
}

function formatTotalsBreakdown(totals: SistemaTotals) {
  const parts = [
    `AC ${totals.ampla}`,
    `PCD ${totals.pcd}`,
    `PPP ${totals.ppp}`,
    `Indígena ${totals.indigena}`,
  ]

  return parts.join(' · ')
}

function ensureHttps(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed.replace(/^\/+/, '')}`
}

function formatInstagramHandle(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 'Não informado'

  const fromUrl = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/$/, '')

  const handle = fromUrl || trimmed

  if (handle.startsWith('@')) {
    return handle
  }

  return `@${handle}`
}

function formatShortUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 'Não informado'
  return trimmed.replace(/^https?:\/\//i, '')
}

function formatSistema(value?: string | null) {
  if (!value) return '—'
  const normalized = value.toUpperCase()
  return SISTEMA_LABELS[normalized] ?? normalized
}

function formatPretendeAssumir(value?: string | null) {
  const normalized = value?.toUpperCase()
  if (normalized === 'SIM') return 'Sim'
  if (normalized === 'NAO') return 'Não'
  return 'Talvez'
}

function formatJaNomeado(value?: string | null) {
  const normalized = value?.toUpperCase()
  if (normalized === 'SIM') return 'Sim'
  if (normalized === 'EM_ANDAMENTO') return 'Em andamento'
  return 'Não'
}

function formatConcorrencia(valor: string) {
  const texto = valor?.trim() ?? ''
  if (texto.toLowerCase() === 'ampla concorrência') {
    return 'Ampla'
  }
  return texto || '—'
}
