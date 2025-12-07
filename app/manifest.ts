import type { MetadataRoute } from "next"
import { headers } from "next/headers"

import { fetchComissaoResumoConfig } from "@/src/features/comissao/get-comissao-resumo-config-server"
import {
  getCommissionLogoAbsoluteUrl,
  inferLogoMimeFromPath,
} from "@/src/features/comissao/logo-utils"

const FALLBACK_ICON = "/logo-tjaa-trt2.png"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await fetchComissaoResumoConfig()
  const baseUrl = await getRequestBaseUrl()
  const iconUrl = getCommissionLogoAbsoluteUrl(config, baseUrl)
  const iconType = config?.logo_url
    ? inferLogoMimeFromPath(config.logo_storage_path ?? config.logo_url)
    : "image/png"

  const icons: MetadataRoute.Manifest["icons"] = [
    {
      src: iconUrl,
      sizes: "192x192",
      type: iconType,
      purpose: "any",
    },
    {
      src: iconUrl,
      sizes: "512x512",
      type: iconType,
      purpose: "any",
    },
  ]

  if (config?.logo_url) {
    icons.push({
      src: iconUrl,
      sizes: "512x512",
      type: iconType,
      purpose: "maskable",
    })
  }

  const fallbackBackground = config?.logo_url ? "#FFFFFF" : "#F5F7FA"

  return {
    name: "Aprovados • TRT2",
    short_name: "Aprovados TRT2",
    description: "Painel da comissão TJAA TRT-2",
    start_url: "/",
    display: "standalone",
    background_color: fallbackBackground,
    theme_color: "#0067A0",
    lang: "pt-BR",
    icons,
  }
}

async function getRequestBaseUrl() {
  const headerList = await headers()
  const proto = headerList.get("x-forwarded-proto") ?? "http"
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000"
  return `${proto}://${host}`.replace(/\/$/, "")
}
