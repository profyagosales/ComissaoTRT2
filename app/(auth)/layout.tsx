import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f0eb] text-slate-900">
      <div className="min-h-screen bg-white/90 px-4 py-12 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
