import type { VacanciaClasse, VacanciaMetadata } from "./vacancia-types"

const META_SEPARATOR = "::vacmeta::"

function sanitizeLabel(label: string | null | undefined) {
  if (!label) return ""
  return label.replace(META_SEPARATOR, " ")
}

export function encodeVacanciaMetadata(
  label: string | null,
  metadata: Omit<VacanciaMetadata, "classeLabel"> & { classeLabel?: string | null },
): string {
  const payload: VacanciaMetadata = {
    version: metadata.version ?? 1,
    classeKey: metadata.classeKey ?? null,
    classeLabel: metadata.classeLabel ?? label ?? null,
    observacao: metadata.observacao ?? null,
    preenchida: metadata.preenchida ?? null,
    cargo: metadata.cargo ?? null,
    tribunal: metadata.tribunal ?? null,
    tipo: metadata.tipo ?? null,
    douLink: metadata.douLink ?? null,
    nomeServidor: metadata.nomeServidor ?? null,
  }

  const serialized = JSON.stringify({ __vacancia_meta__: true, ...payload })
  const safeLabel = sanitizeLabel(payload.classeLabel ?? label ?? "")
  return `${safeLabel}${META_SEPARATOR}${serialized}`
}

export function decodeVacanciaMetadata(value: unknown): {
  label: string | null
  metadata: VacanciaMetadata | null
} {
  if (typeof value !== "string") {
    return { label: null, metadata: null }
  }

  const trimmed = value.trim()
  if (!trimmed.includes(META_SEPARATOR)) {
    return { label: trimmed.length ? trimmed : null, metadata: null }
  }

  const [labelPart, rawJson] = trimmed.split(META_SEPARATOR)
  if (!rawJson) {
    return { label: labelPart || null, metadata: null }
  }

  try {
    const parsed = JSON.parse(rawJson)
    if (!parsed || typeof parsed !== "object" || parsed.__vacancia_meta__ !== true) {
      return { label: labelPart || null, metadata: null }
    }

    const metadata: VacanciaMetadata = {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      classeKey: (parsed.classeKey ?? null) as VacanciaClasse | null,
      classeLabel: typeof parsed.classeLabel === "string" ? parsed.classeLabel : labelPart || null,
      observacao: typeof parsed.observacao === "string" ? parsed.observacao : parsed.observacao === null ? null : null,
      preenchida:
        typeof parsed.preenchida === "boolean"
          ? parsed.preenchida
          : typeof parsed.preenchida === "string"
            ? ["1", "true", "sim", "s", "t"].includes(parsed.preenchida.trim().toLowerCase())
              ? true
              : ["0", "false", "nao", "não", "n", "f"].includes(parsed.preenchida.trim().toLowerCase())
                ? false
                : null
            : parsed.preenchida === null
              ? null
              : null,
      cargo: typeof parsed.cargo === "string" ? parsed.cargo : null,
      tribunal: typeof parsed.tribunal === "string" ? parsed.tribunal : null,
      tipo: typeof parsed.tipo === "string" ? parsed.tipo : null,
      douLink: typeof parsed.douLink === "string" ? parsed.douLink : null,
      nomeServidor: typeof parsed.nomeServidor === "string" ? parsed.nomeServidor : null,
    }

    return {
      label: metadata.classeLabel ?? (labelPart || null),
      metadata,
    }
  } catch (error) {
    console.error("[vacancia-metadata] falha ao decodificar metadata", error)
    return { label: labelPart || null, metadata: null }
  }
}
