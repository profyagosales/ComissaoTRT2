export type VacanciaTipo = "ONEROSA" | "NAO_ONEROSA"
export type VacanciaClasse =
  | "APOSENTADORIA"
  | "FALECIMENTO"
  | "DEMISSAO"
  | "EXONERACAO"
  | "PCI"
  | "PERDA_POSSE"
  | "NOMEACAO_SEM_EFEITO"

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

export const VACANCIA_TIPO_CHIP_CLASSES: Record<VacanciaTipo, string> = {
  ONEROSA: "bg-[#007B5F] text-white",
  NAO_ONEROSA: "bg-[#4A4F55] text-white",
}

export const VACANCIA_CLASS_CHIP_CLASSES: Record<VacanciaClasse, string> = {
  APOSENTADORIA: "bg-[#0a408c] text-white",
  FALECIMENTO: "bg-[#510a8c] text-white",
  DEMISSAO: "bg-[#8c420a] text-white",
  EXONERACAO: "bg-[#353638] text-white",
  PCI: "bg-[#007B5F] text-white",
  PERDA_POSSE: "bg-[#FF7A00] text-white",
  NOMEACAO_SEM_EFEITO: "bg-[#B42318] text-white",
}

export const VACANCIA_CLASSE_CHIP_CLASSES = VACANCIA_CLASS_CHIP_CLASSES

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
}

export type VacanciasData = {
  rows: VacanciaRow[]
}
