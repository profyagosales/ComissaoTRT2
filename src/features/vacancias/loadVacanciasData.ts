import { createSupabaseServerClient } from "@/lib/supabase-server"
import type { VacanciaClasse, VacanciaRow, VacanciaTipo, VacanciasData } from "./vacancia-types"

const VACANCIA_COLUMN_ALIASES = {
  data: ["data", "data_vacancia", "data_evento", "data_publicacao"],
  tribunal: ["tribunal", "local", "unidade"],
  cargo: ["cargo", "cargo_afetado"],
  motivo: ["motivo", "motivo_saida"],
  tipo: ["tipo", "tipo_evento"],
  nomeServidor: ["nome_servidor", "servidor", "nome"],
  douLink: ["dou_link", "link", "fonte_url"],
  observacao: ["observacao", "observacoes", "detalhes"],
}

const CLASS_MATCH_MAP: Record<string, VacanciaClasse> = {
  APOSENTADORIA: "APOSENTADORIA",
  FALECIMENTO: "FALECIMENTO",
  DEMISSAO: "DEMISSAO",
  EXONERACAO: "EXONERACAO",
  PCI: "PCI",
  POSSEEMCARGOINACUMULAVEL: "PCI",
  PERDAPRAZOPOSSE: "PERDA_POSSE",
  PERDAPOSSE: "PERDA_POSSE",
  NOMEACAOSMEFEITO: "NOMEACAO_SEM_EFEITO",
  NOMEACAOSENEFEITO: "NOMEACAO_SEM_EFEITO",
  NOMEACAOSEMEFEITO: "NOMEACAO_SEM_EFEITO",
}

function normalizeKey(value?: string | null) {
  if (!value) return null
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
}

function readString(row: Record<string, unknown>, aliases: string[]): string | null {
  for (const alias of aliases) {
    const value = row[alias]
    if (typeof value === "string" && value.length) {
      return value
    }
  }
  return null
}

function mapTipo(value?: string | null): VacanciaTipo {
  const normalized = normalizeKey(value)
  if (!normalized) return "ONEROSA"
  if (normalized.includes("NAO")) {
    return "NAO_ONEROSA"
  }
  return "ONEROSA"
}

function mapClasse(value: string | null, fallbackTipo: VacanciaTipo): VacanciaClasse | null {
  const normalized = normalizeKey(value)
  if (!normalized) {
    return null
  }
  if (CLASS_MATCH_MAP[normalized]) {
    return CLASS_MATCH_MAP[normalized]
  }
  // handle small variations
  if (normalized.startsWith("PCI")) return "PCI"
  if (normalized.includes("PERDAPRAZO")) return "PERDA_POSSE"
  if (normalized.startsWith("NOMEACAOS")) return "NOMEACAO_SEM_EFEITO"
  if (fallbackTipo === "ONEROSA") {
    if (normalized.includes("APOS")) return "APOSENTADORIA"
    if (normalized.includes("FALEC")) return "FALECIMENTO"
    if (normalized.includes("DEMIS")) return "DEMISSAO"
  } else {
    if (normalized.includes("EXON")) return "EXONERACAO"
  }
  return null
}

function mapRow(row: Record<string, unknown>): VacanciaRow | null {
  const id = typeof row.id === "string" ? row.id : null
  if (!id) return null
  const data = readString(row, VACANCIA_COLUMN_ALIASES.data) ?? (typeof row.created_at === "string" ? row.created_at : null)
  const tribunal = readString(row, VACANCIA_COLUMN_ALIASES.tribunal)
  const cargo = readString(row, VACANCIA_COLUMN_ALIASES.cargo)
  const tipo = mapTipo(readString(row, VACANCIA_COLUMN_ALIASES.tipo))
  const classe = mapClasse(readString(row, VACANCIA_COLUMN_ALIASES.motivo), tipo)
  const servidor = readString(row, VACANCIA_COLUMN_ALIASES.nomeServidor)
  const douLink = readString(row, VACANCIA_COLUMN_ALIASES.douLink)
  const observacao = readString(row, VACANCIA_COLUMN_ALIASES.observacao)

  return {
    id,
    data,
    tribunal,
    cargo,
    tipo,
    classe,
    servidor,
    douLink,
    observacao,
  }
}

export async function loadVacanciasData(): Promise<VacanciasData> {
  const supabase = await createSupabaseServerClient()

  try {
    const { data, error } = await supabase
      .from("vacancias")
      .select("*")
      .order("data", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      console.error("[loadVacanciasData] erro ao buscar vacâncias", error)
      return { rows: [] }
    }

    const rows = (data ?? [])
      .map((row) => mapRow(row as Record<string, unknown>))
      .filter((row): row is VacanciaRow => Boolean(row))

    return { rows }
  } catch (error) {
    console.error("[loadVacanciasData] falha inesperada", error)
    return { rows: [] }
  }
}
