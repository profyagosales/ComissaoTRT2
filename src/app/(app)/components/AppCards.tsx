import type { ReactNode } from 'react'
import clsx from 'clsx'

export function HeroCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={clsx(
        'relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-red-800/80 via-neutral-900/85 to-neutral-950/85 text-neutral-50 shadow-2xl shadow-black/50 backdrop-blur-xl',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-red-500 shadow-[0_0_22px_rgba(248,113,113,0.9)]" />
      <div className="relative px-6 py-6 md:px-10 md:py-8">{children}</div>
    </section>
  )
}

export function TitledCard({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string
  eyebrow?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={clsx(
        'overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/65 text-neutral-50 shadow-xl shadow-black/40 backdrop-blur-xl',
        className,
      )}
    >
      <div className="bg-red-600 px-6 py-3">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-100/90">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-sm font-semibold md:text-base">{title}</h2>
      </div>

      <div className="px-6 py-5 text-sm text-neutral-100">{children}</div>
    </section>
  )
}

export function StatCard({
  title,
  eyebrow,
  value,
  description,
  className,
}: {
  title: string
  eyebrow?: string
  value: number | string
  description?: string
  className?: string
}) {
  return (
    <TitledCard title={title} eyebrow={eyebrow} className={className}>
      <p className="text-4xl font-semibold tabular-nums text-white">{value}</p>
      {description ? (
        <p className="mt-2 text-xs leading-relaxed text-neutral-300">{description}</p>
      ) : null}
    </TitledCard>
  )
}
