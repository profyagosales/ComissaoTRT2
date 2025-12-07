import type { ReactNode } from 'react'

import { AppNavbar } from '@/components/AppNavbar'
import type { NavbarNotification } from '@/components/NotificationsMenu'
import { AppMobileTabs } from '@/components/AppMobileTabs'
import { AppClientProviders } from '@/components/AppClientProviders'
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

  let notifications: NavbarNotification[] = []

  try {
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('ultimas_notificacoes_view')
      .select('id, titulo, corpo, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (notificationsError) {
      throw notificationsError
    }

    notifications = Array.isArray(notificationsData)
      ? notificationsData.map(notification => ({
          id: notification.id,
          titulo: notification.titulo,
          resumo: deriveResumo(notification.corpo),
          corpo: notification.corpo,
          created_at: notification.created_at,
        }))
      : []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AppShell] não foi possível carregar notificações:', error)
    }
    notifications = []
  }

  return (
    <AppClientProviders>
      <div className="relative min-h-screen bg-[#f7f4ef] text-neutral-900">
        <AppNavbar isComissao={isComissao} notifications={notifications} />

        <main className="flex w-full flex-col gap-6 px-3 pb-28 pt-4 sm:px-4 md:pb-16 lg:px-6 xl:px-8">
          {children}
        </main>

        <AppMobileTabs />
      </div>
    </AppClientProviders>
  )
}

function deriveResumo(text?: string | null) {
  if (!text) {
    return null
  }

  const normalized = text.trim()
  if (normalized.length <= 160) {
    return normalized
  }

  return `${normalized.slice(0, 157).trimEnd()}…`
}
