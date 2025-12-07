export type VacanciaTipo = "ONEROSA" | "NAO_ONEROSA"
export type VacanciaClasse =
  | "APOSENTADORIA"
  | "FALECIMENTO"
  | "DEMISSAO"
  | "EXONERACAO"
  | "PCI"
  | "PERDA_POSSE"
  | "NOMEACAO_SEM_EFEITO"

export type VacanciaMetadata = {
  version: number
  classeKey: VacanciaClasse | null
  classeLabel: string | null
  observacao: string | null
  preenchida: boolean | null
  cargo: string | null
  tribunal: string | null
  tipo: string | null
  douLink: string | null
  nomeServidor: string | null
}

export const VACANCIA_TIPO_LABEL: Record<VacanciaTipo, string> = {
  ONEROSA: "Onerosa",
  NAO_ONEROSA: "Não Onerosa",
}

export const VACANCIA_TIPO_FILTER_LABEL: Record<VacanciaTipo, string> = {
  ONEROSA: "Onerosas",
  NAO_ONEROSA: "Não Onerosas",
}

export const VACANCIA_CLASSES_BY_TIPO: Record<VacanciaTipo, readonly VacanciaClasse[]> = {
  ONEROSA: ["APOSENTADORIA", "FALECIMENTO", "DEMISSAO"],
  NAO_ONEROSA: ["EXONERACAO", "PCI", "PERDA_POSSE", "NOMEACAO_SEM_EFEITO"],
}

export const VACANCIA_CLASSE_LABEL: Record<VacanciaClasse, string> = {
  APOSENTADORIA: "Aposentadoria",
  FALECIMENTO: "Falecimento",
  DEMISSAO: "Demissão",
  EXONERACAO: "Exoneração",
  PCI: "PCI",
  PERDA_POSSE: "Perda prazo posse",
  NOMEACAO_SEM_EFEITO: "Nomeação sem efeito",
}

export const VACANCIA_CLASSE_HELPER_TEXT: Record<VacanciaClasse, string | null> = {
  APOSENTADORIA: null,
  FALECIMENTO: null,
  DEMISSAO: null,
  EXONERACAO: null,
  PCI: "Posse em Cargo Inacumulável",
  PERDA_POSSE: null,
  NOMEACAO_SEM_EFEITO: null,
}

export const VACANCIA_TIPO_COLORS: Record<VacanciaTipo, string> = {
  ONEROSA: "#FF8A1F",
  NAO_ONEROSA: "#0F67D3",
}

export const VACANCIA_TIPO_CHIP_CLASSES: Record<VacanciaTipo, string> = {
  ONEROSA: "text-white",
  NAO_ONEROSA: "text-white",
}

export const VACANCIA_CLASS_CHIP_CLASSES: Record<VacanciaClasse, string> = {
  APOSENTADORIA: "text-white",
  FALECIMENTO: "text-white",
  DEMISSAO: "text-white",
  EXONERACAO: "text-white",
  PCI: "text-white",
  PERDA_POSSE: "text-white",
  NOMEACAO_SEM_EFEITO: "text-white",
}

export const VACANCIA_CLASSE_CHIP_CLASSES = VACANCIA_CLASS_CHIP_CLASSES

export const VACANCIA_CLASSE_COLORS: Record<VacanciaClasse, string> = {
  APOSENTADORIA: "#6A4C7D",
  FALECIMENTO: "#7B2D4A",
  DEMISSAO: "#8A5635",
  EXONERACAO: "#434B4D",
  PCI: "#3C6A5D",
  PERDA_POSSE: "#5E5A2F",
  NOMEACAO_SEM_EFEITO: "#8A2736",
}

export type VacanciaRow = {
  id: string
  data: string | null
  tribunal: string | null
  cargo: string | null
  tipo: VacanciaTipo
  classe: VacanciaClasse | null
  servidor: string | null
  douLink: string | null
  observacao: string | null
  preenchida: boolean | null
  metadata: VacanciaMetadata | null
}

export type VacanciasData = {
  rows: VacanciaRow[]
}
