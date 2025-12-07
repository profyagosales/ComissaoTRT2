import type { ComissaoResumoConfig } from "@/features/comissao/comissao-resumo-types"

export function getCommissionLogoRelativeUrl(
  config?: ComissaoResumoConfig | null,
): string | null {
  if (!config?.logo_url) {
    return null
  }

  const version = config.updated_at ? encodeURIComponent(config.updated_at) : null
  return version ? `/api/comissao/logo?v=${version}` : "/api/comissao/logo"
}

export function getCommissionLogoAbsoluteUrl(
  config: ComissaoResumoConfig | null | undefined,
  baseUrl: string,
): string {
  const relative = getCommissionLogoRelativeUrl(config)
  if (relative) {
    return `${baseUrl.replace(/\/$/, "")}${relative}`
  }
  return `${baseUrl.replace(/\/$/, "")}/logo-tjaa-trt2.png`
}

export function inferLogoMimeFromPath(path?: string | null): string {
  if (!path) {
    return "image/png"
  }

  const cleaned = path.split("?")[0] ?? ""
  const extension = cleaned.split(".").pop()?.toLowerCase()

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg"
  }

  if (extension === "svg") {
    return "image/svg+xml"
  }

  if (extension === "webp") {
    return "image/webp"
  }

  if (extension === "ico") {
    return "image/x-icon"
  }

  return "image/png"
}
