'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

type SlideItem = {
  label: string
  value: string | number
}

export type ResumoSlide = {
  id: string
  badge: string
  highlight: string
  subtitle?: string
  items?: SlideItem[]
}

type ResumoStatsSliderProps = {
  slides: ResumoSlide[]
  autoPlayMs?: number
}

export function ResumoStatsSlider({
  slides,
  autoPlayMs = 5000,
}: ResumoStatsSliderProps) {
  const [index, setIndex] = React.useState(0)
  const [isHovered, setIsHovered] = React.useState(false)

  React.useEffect(() => {
    if (!slides.length || isHovered) return

    const id = window.setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length)
    }, autoPlayMs)

    return () => window.clearInterval(id)
  }, [slides.length, autoPlayMs, isHovered])

  if (!slides.length) return null
  const slide = slides[index]

  return (
    <div
      className="relative flex-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex w-full items-center justify-between gap-6 rounded-2xl bg-white/95 px-5 py-4 shadow-sm ring-1 ring-slate-200/70 backdrop-blur-sm">
        <div className="min-w-[180px] flex-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {slide.badge}
          </p>
          <p className="text-2xl font-semibold leading-tight text-slate-900">
            {slide.highlight}
          </p>
          {slide.subtitle ? (
            <p className="mt-1 text-xs leading-snug text-slate-600">{slide.subtitle}</p>
          ) : null}
        </div>

        {slide.items && slide.items.length > 0 ? (
          <div className="grid max-w-[260px] flex-1 grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {slide.items.map(item => (
              <div key={item.label} className="space-y-0.5">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              'h-1.5 w-3 rounded-full bg-slate-300/70 transition-all',
              i === index && 'w-6 bg-slate-700',
            )}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
