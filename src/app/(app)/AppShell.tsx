import Image from 'next/image'
import type { ReactNode } from 'react'

import { AppNavbar } from '@/components/AppNavbar'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen text-neutral-900">
      <div className="pointer-events-none fixed inset-0 -z-20">
        <Image
          src="/patterns/calcada-red-black1.png"
          alt="Calçadão TJAA TRT-2"
          fill
          priority
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/60 via-neutral-900/5 to-neutral-900/35" />
      </div>

      <AppNavbar />

      <main className="flex w-full flex-col gap-6 px-3 pb-12 pt-4 sm:px-4 lg:px-6 xl:px-8">
        {children}
      </main>
    </div>
  )
}
