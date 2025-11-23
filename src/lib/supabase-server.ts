import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const canMutateCookies = typeof cookieStore.set === 'function'

  const logCookieWarning = (error: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase cookie mutation skipped:', (error as Error).message)
    }
  }

  const tryMutate = (mutate: () => void) => {
    if (!canMutateCookies) {
      return
    }
    try {
      mutate()
    } catch (error) {
      logCookieWarning(error)
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value
          } catch (error) {
            logCookieWarning(error)
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          tryMutate(() => {
            cookieStore.set({ name, value, ...options })
          })
        },
        remove(name: string, options: CookieOptions) {
          tryMutate(() => {
            cookieStore.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            })
          })
        },
      },
    },
  )
}
