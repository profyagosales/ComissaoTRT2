'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function loginAction(payload: { email: string; password: string }) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
