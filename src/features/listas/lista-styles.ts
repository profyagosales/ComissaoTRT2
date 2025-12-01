import type { SistemaConcorrencia } from "./listas-actions"

export type ListaSistemaStyle = {
  label: string
  className: string
  numberClassName: string
}

export const listaSistemaStyles: Record<SistemaConcorrencia, ListaSistemaStyle> = {
  AC: {
    label: "Ampla",
    className: "border-[#0a408c] bg-[#0a408c] text-white",
    numberClassName: "border-[#0a408c] bg-[#0a408c] text-white",
  },
  PCD: {
    label: "PCD",
    className: "border-[#510a8c] bg-[#510a8c] text-white",
    numberClassName: "border-[#510a8c] bg-[#510a8c] text-white",
  },
  PPP: {
    label: "PPP",
    className: "border-[#8c420a] bg-[#8c420a] text-white",
    numberClassName: "border-[#8c420a] bg-[#8c420a] text-white",
  },
  IND: {
    label: "Ind",
    className: "border-[#353638] bg-[#353638] text-white",
    numberClassName: "border-[#353638] bg-[#353638] text-white",
  },
}
