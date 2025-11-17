import type { ReactNode } from 'react'

import { AppNavbar } from '@/components/AppNavbar'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#f7f4ef] text-neutral-900">
      <AppNavbar />

      <main className="flex w-full flex-col gap-6 px-3 pb-12 pt-4 sm:px-4 lg:px-6 xl:px-8">
        {children}
      </main>
    </div>
  )
}
