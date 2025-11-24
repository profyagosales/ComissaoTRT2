export type TdContentSettings = {
  howItWorksHtml: string
  guidelinesHtml: string
  models: { label: string; url: string }[]
}

const HOW_IT_WORKS_DEFAULT =
  "<p>O Termo de Desistência (TD) permite antecipar convocações e manter o histórico de interesse de cada aprovado.</p>"
const GUIDELINES_DEFAULT =
  "<p>Os Termos de Desistência, acompanhados da cópia do RG do candidato, poderão ser enviados para <a href=\"mailto:concurso.servidores@trtsp.jus.br\">concurso.servidores@trtsp.jus.br</a>, utilizando-se o mesmo endereço de email cadastrado na Fundação Carlos Chagas no ato da inscrição.</p>"

export const DEFAULT_TD_CONTENT: TdContentSettings = {
  howItWorksHtml: HOW_IT_WORKS_DEFAULT,
  guidelinesHtml: GUIDELINES_DEFAULT,
  models: [],
}

export const TD_CONTENT_DEFAULTS = {
  howItWorksHtml: HOW_IT_WORKS_DEFAULT,
  guidelinesHtml: GUIDELINES_DEFAULT,
}
