import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[url('/patterns/calcada-red-black.png')] bg-cover bg-center bg-fixed text-zinc-50">
      <div className="min-h-screen bg-black/70 px-4 py-12 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
