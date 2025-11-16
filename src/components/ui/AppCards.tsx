import type { ReactNode } from 'react'

type HeroProps = {
  left: ReactNode
  right?: ReactNode
}

export function HeroCard({ left, right }: HeroProps) {
  return (
    <section className="w-full overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white shadow-xl shadow-red-900/25">
      <div className="h-1 w-full bg-red-800/80" />
      <div className="flex flex-col gap-6 px-8 py-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">{left}</div>
        {right ? (
          <div className="w-full max-w-sm rounded-2xl bg-black/10 px-5 py-4 backdrop-blur-sm">{right}</div>
        ) : null}
      </div>
    </section>
  )
}

type CardProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function TitledCard({ title, subtitle, children }: CardProps) {
  return (
    <section className="w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white/95 shadow-md shadow-black/5">
      <div className="bg-red-700 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-red-50">
        {title}
        {subtitle ? (
          <span className="ml-2 text-xs font-normal normal-case text-red-100/80">{subtitle}</span>
        ) : null}
      </div>
      <div className="px-6 py-5 text-sm text-neutral-800">{children}</div>
    </section>
  )
}
