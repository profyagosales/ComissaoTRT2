export type TdContentSettings = {
  overview: string
  instructions: string
  models: { label: string; url: string }[]
}

export const DEFAULT_TD_CONTENT: TdContentSettings = {
  overview:
    "O Termo de Desistência (TD) permite antecipar convocações e manter o histórico de interesse de cada aprovado. Atualize esse texto conforme as orientações oficiais do TRT-2.",
  instructions:
    "Inclua passos objetivos para preenchimento, assinatura e envio. Use este espaço para reforçar prazos, canais oficiais e observações sobre documentos complementares.",
  models: [
    { label: "Modelo TD - Ampla / PPP (PDF)", url: "#" },
    { label: "Modelo TD - PCD / Indígena (Word)", url: "#" },
  ],
}
