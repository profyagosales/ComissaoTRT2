import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let serviceClient: SupabaseClient | null = null

export function createSupabaseServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não está configurada.')
  }

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada.')
  }

  if (!serviceClient) {
    serviceClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  return serviceClient
}
