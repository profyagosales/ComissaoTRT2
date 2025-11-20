import type { ReactNode } from 'react'

import { AppNavbar } from '@/components/AppNavbar'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isComissao = false

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    isComissao = profile?.role === 'COMISSAO'
  }

  return (
    <div className="relative min-h-screen bg-[#f7f4ef] text-neutral-900">
      <AppNavbar isComissao={isComissao} />

      <main className="flex w-full flex-col gap-6 px-3 pb-12 pt-4 sm:px-4 lg:px-6 xl:px-8">
        {children}
      </main>
    </div>
  )
}
