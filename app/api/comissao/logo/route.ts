import { NextRequest, NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { createSupabaseServiceRoleClient } from "@/lib/supabase-service-role"
import type { ComissaoResumoConfig } from "@/features/comissao/comissao-resumo-types"
import { inferLogoMimeFromPath } from "@/features/comissao/logo-utils"

const COMISSAO_RESUMO_ID = 1
const COMISSAO_ASSETS_BUCKET = "comissao_assets"
const FALLBACK_FILE_PATH = path.join(process.cwd(), "public", "logo-tjaa-trt2.png")

let cachedFallback: ArrayBuffer | null = null

export async function GET(request: NextRequest) {
  try {
    const logoResponse = await fetchCommissionLogo()
    if (logoResponse) {
      return logoResponse
    }
  } catch (error) {
    console.error("[api/comissao/logo] erro ao buscar logo da comissão", error)
  }

  const fallbackBuffer = await loadFallbackBuffer()
  return new NextResponse(fallbackBuffer, {
    status: 200,
    headers: buildHeaders({
      contentType: "image/png",
      contentLength: fallbackBuffer.byteLength,
      etag: "fallback-logo",
    }),
  })
}

async function fetchCommissionLogo() {
  const serviceClient = createSupabaseServiceRoleClient()

  const { data: config, error } = await serviceClient
    .from("comissao_resumo")
    .select("logo_storage_path, updated_at")
    .eq("id", COMISSAO_RESUMO_ID)
    .maybeSingle<Pick<ComissaoResumoConfig, "logo_storage_path" | "updated_at">>()

  if (error) {
    throw error
  }

  if (!config?.logo_storage_path) {
    return null
  }

  const { data: file, error: downloadError } = await serviceClient.storage
    .from(COMISSAO_ASSETS_BUCKET)
    .download(config.logo_storage_path)

  if (downloadError || !file) {
    return null
  }

  const arrayBuffer = await file.arrayBuffer()
  const contentType = inferLogoMimeFromPath(config.logo_storage_path)

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: buildHeaders({
      contentType,
      contentLength: arrayBuffer.byteLength,
      etag: config.updated_at ?? undefined,
    }),
  })
}

async function loadFallbackBuffer(): Promise<ArrayBuffer> {
  if (cachedFallback) {
    return cachedFallback
  }

  const fileBuffer = await readFile(FALLBACK_FILE_PATH)
  cachedFallback = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength,
  )
  return cachedFallback
}

function buildHeaders({
  contentType,
  contentLength,
  etag,
}: {
  contentType: string
  contentLength: number
  etag?: string
}) {
  const headers = new Headers()
  headers.set("Content-Type", contentType)
  headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
  headers.set("Content-Length", String(contentLength))
  if (etag) {
    headers.set("ETag", JSON.stringify(etag))
  }
  return headers
}
