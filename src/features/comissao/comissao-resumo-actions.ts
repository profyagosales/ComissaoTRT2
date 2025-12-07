'use server'

import { Buffer } from 'node:buffer'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServiceRoleClient } from '@/lib/supabase-service-role'

import type {
  ComissaoResumoConfig,
  ComissaoResumoUpdateInput,
} from './comissao-resumo-types'

const COMISSAO_RESUMO_ID = 1
const COMISSAO_ASSETS_BUCKET = 'comissao_assets'
const DEFAULT_LOGO_BASENAME = 'comissao-tjaa-trt2'

const SUPPORTED_IMAGE_FALLBACK = 'image/png'

const deriveLogoPath = (fileName: string, contentType?: string) => {
  const normalizedName = fileName.trim() || `${DEFAULT_LOGO_BASENAME}.png`
  const extensionFromName = normalizedName.includes('.')
    ? normalizedName.split('.').pop()!
    : null

  const extensionFromType = contentType?.split('/').pop() ?? null
  const extension = (extensionFromType || extensionFromName || 'png').toLowerCase()
  return `logo/${DEFAULT_LOGO_BASENAME}.${extension}`
}

const fetchExistingLogoPath = async (serviceClient = createSupabaseServiceRoleClient()) => {
  const { data, error } = await serviceClient
    .from('comissao_resumo')
    .select('logo_storage_path')
    .eq('id', COMISSAO_RESUMO_ID)
    .maybeSingle<{ logo_storage_path: string | null }>()

  if (error) {
    throw new Error(`Erro ao buscar logo atual da comissão: ${error.message}`)
  }

  return data?.logo_storage_path ?? null
}

export async function getComissaoResumoConfig(): Promise<ComissaoResumoConfig> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('comissao_resumo')
    .select('*')
    .eq('id', COMISSAO_RESUMO_ID)
    .maybeSingle<ComissaoResumoConfig>()

  if (error) {
    throw new Error(`Não foi possível carregar a configuração da comissão: ${error.message}`)
  }

  if (data) {
    return data
  }

  const serviceClient = createSupabaseServiceRoleClient()
  const { data: inserted, error: upsertError } = await serviceClient
    .from('comissao_resumo')
    .upsert({ id: COMISSAO_RESUMO_ID })
    .select('*')
    .maybeSingle<ComissaoResumoConfig>()

  if (upsertError) {
    throw new Error(`Não foi possível inicializar a configuração da comissão: ${upsertError.message}`)
  }

  if (!inserted) {
    throw new Error('Configuração da comissão não encontrada e não foi possível criar o registro padrão.')
  }

  return inserted
}

export async function updateComissaoResumoConfig(
  patch: ComissaoResumoUpdateInput,
): Promise<ComissaoResumoConfig> {
  const serviceClient = createSupabaseServiceRoleClient()
  const { data, error } = await serviceClient
    .from('comissao_resumo')
    .upsert({ id: COMISSAO_RESUMO_ID, ...patch })
    .select('*')
    .maybeSingle<ComissaoResumoConfig>()

  if (error) {
    throw new Error(`Não foi possível atualizar a configuração da comissão: ${error.message}`)
  }

  if (!data) {
    throw new Error('A atualização da configuração não retornou dados.')
  }

  return data
}

export async function uploadComissaoLogo(file: File): Promise<ComissaoResumoConfig> {
  const serviceClient = createSupabaseServiceRoleClient()
  const logoPath = deriveLogoPath(file.name, file.type)
  const currentPath = await fetchExistingLogoPath(serviceClient)

  if (currentPath && currentPath !== logoPath) {
    await serviceClient.storage.from(COMISSAO_ASSETS_BUCKET).remove([currentPath])
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await serviceClient.storage
    .from(COMISSAO_ASSETS_BUCKET)
    .upload(logoPath, fileBuffer, {
      upsert: true,
      contentType: file.type || SUPPORTED_IMAGE_FALLBACK,
      cacheControl: '3600',
    })

  if (uploadError) {
    throw new Error(`Não foi possível enviar a logo: ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = serviceClient.storage.from(COMISSAO_ASSETS_BUCKET).getPublicUrl(logoPath)

  return updateComissaoResumoConfig({
    logo_url: publicUrl,
    logo_storage_path: logoPath,
  })
}

export async function removeComissaoLogo(): Promise<ComissaoResumoConfig> {
  const serviceClient = createSupabaseServiceRoleClient()
  const currentPath = await fetchExistingLogoPath(serviceClient)

  if (currentPath) {
    await serviceClient.storage.from(COMISSAO_ASSETS_BUCKET).remove([currentPath])
  }

  return updateComissaoResumoConfig({
    logo_url: null,
    logo_storage_path: null,
  })
}
