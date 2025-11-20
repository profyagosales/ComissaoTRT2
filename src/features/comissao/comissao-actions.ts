"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { TD_REQUEST_TIPOS, mapTipoTdToCandidateStatus } from "@/features/tds/td-types"
import type { CandidateTdStatus, TdRequestTipo } from "@/features/tds/td-types"

type Decision = "APROVAR" | "REJEITAR"

type SupabaseUser = {
  id: string
}

type NotificationPayload = {
  titulo: string
  corpo: string
  tipo?: string
  visivelPara?: string
  metadata?: Record<string, unknown>
}

type CsjtDestinoInput = {
  tribunal: string
  cargo?: string
  quantidade: number
}

type OutraAprovacaoModerationRow = {
  id: string
  candidate_id: string
  orgao: string | null
  cargo: string | null
  ja_foi_nomeado: string | null
  pretende_assumir: string | null
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function applyCandidateStatusFromOutraAprovacao(
  supabase: SupabaseServerClient,
  approval: OutraAprovacaoModerationRow,
  referenceDate: string,
) {
  if (!approval?.candidate_id) return

  const jaFoiNomeado = approval.ja_foi_nomeado ?? "NAO"
  const pretendeAssumir = approval.pretende_assumir ?? "INDEFINIDO"

  let tdStatus: Exclude<CandidateTdStatus, null> | null = null
  if (jaFoiNomeado === "SIM") {
    tdStatus = "SIM"
  } else if (pretendeAssumir === "SIM") {
    tdStatus = "TALVEZ"
  }

  if (!tdStatus) {
    return
  }

  const cargoLabel = approval.cargo ?? "Cargo não informado"
  const orgaoLabel = approval.orgao ?? "Outro órgão"
  const obsBase = tdStatus === "SIM" ? `Nomeado no ${orgaoLabel}.` : `Pretende assumir ${orgaoLabel}.`
  const obs = `${obsBase} Cargo: ${cargoLabel}. Atualizado em ${formatPtBr(referenceDate)}.`

  const { error } = await supabase
    .from("candidates")
    .update({ td_status: tdStatus, td_observacao: obs })
    .eq("id", approval.candidate_id)

  if (error) {
    console.error("[applyCandidateStatusFromOutraAprovacao] erro ao atualizar candidato", error)
  }
}

async function resetCandidateTdStatusIfMatches(
  supabase: SupabaseServerClient,
  candidateId: string,
  expectedStatus: Exclude<CandidateTdStatus, null>,
) {
  const { data, error } = await supabase
    .from("candidates")
    .select("td_status")
    .eq("id", candidateId)
    .maybeSingle<{ td_status: CandidateTdStatus }>()

  if (error) {
    console.error("[resetCandidateTdStatusIfMatches] erro ao buscar candidato", error)
    return
  }

  if (data?.td_status !== expectedStatus) {
    return
  }

  const { error: resetError } = await supabase
    .from("candidates")
    .update({ td_status: null, td_observacao: null })
    .eq("id", candidateId)

  if (resetError) {
    console.error("[resetCandidateTdStatusIfMatches] erro ao redefinir TD do candidato", resetError)
  }
}

async function assertComissaoUser(): Promise<SupabaseUser> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Você precisa estar autenticado para aprovar registros.")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "COMISSAO") {
    throw new Error("Acesso permitido apenas para membros da comissão.")
  }

  return { id: user.id }
}

async function enqueueResumoNotification(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: NotificationPayload
) {
  try {
    const { error } = await supabase.from("notifications_queue").insert({
      titulo: payload.titulo,
      corpo: payload.corpo,
      tipo: payload.tipo ?? "RESUMO",
      visivel_para: payload.visivelPara ?? "APROVADOS",
      metadata: payload.metadata ?? null,
      status: "PENDENTE",
    })

    if (error) {
      console.error("[enqueueResumoNotification] erro ao enfileirar", error)
    }
  } catch (error) {
    console.error("[enqueueResumoNotification] falha inesperada", error)
  }
}

function formatPtBr(date: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date))
  } catch {
    return date
  }
}

export async function moderateOutraAprovacaoAction(params: { approvalId: string; decision: Decision }) {
  const supabase = await createSupabaseServerClient()
  const user = await assertComissaoUser()

  const { data: approvalRow, error: approvalFetchError } = await supabase
    .from("outras_aprovacoes")
    .select("id, candidate_id, orgao, cargo, ja_foi_nomeado, pretende_assumir")
    .eq("id", params.approvalId)
    .maybeSingle<OutraAprovacaoModerationRow>()

  if (approvalFetchError || !approvalRow) {
    console.error("[moderateOutraAprovacaoAction] erro ao buscar aprovação", approvalFetchError)
    throw new Error("Registro de aprovação não encontrado.")
  }

  const status = params.decision === "APROVAR" ? "APROVADO" : "RECUSADO"
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("outras_aprovacoes")
    .update({
      status,
      approved_at: now,
      approved_by: user.id,
      updated_at: now,
    })
    .eq("id", params.approvalId)

  if (error) {
    console.error("[moderateOutraAprovacaoAction] erro ao atualizar aprovação", error)
    throw new Error("Não foi possível atualizar essa aprovação agora.")
  }

  if (params.decision === "APROVAR") {
    await applyCandidateStatusFromOutraAprovacao(supabase, approvalRow, now)
  }

  revalidatePath("/comissao")
  revalidatePath("/listas")
  revalidatePath("/resumo")
}

export async function moderateTdRequestAction(params: { requestId: string; decision: Decision }) {
  const supabase = await createSupabaseServerClient()
  const user = await assertComissaoUser()

  const { data: request, error: fetchError } = await supabase
    .from("td_requests")
    .select("id, candidate_id, tipo_td, observacao")
    .eq("id", params.requestId)
    .maybeSingle<{ id: string; candidate_id: string; tipo_td: TdRequestTipo; observacao: string | null }>()

  if (fetchError || !request) {
    console.error("[moderateTdRequestAction] erro ao buscar td_request", fetchError)
    throw new Error("Não foi possível localizar essa solicitação de TD.")
  }

  if (!request.tipo_td) {
    console.error("[moderateTdRequestAction] solicitação sem tipo_td definido", request)
    throw new Error("Registro de TD inválido: tipo não informado.")
  }

  const status = params.decision === "APROVAR" ? "APROVADO" : "REJEITADO"
  const now = new Date().toISOString()
  const requestedTdStatus = mapTipoTdToCandidateStatus(request.tipo_td)

  const { error } = await supabase
    .from("td_requests")
    .update({
      status,
      approved_at: now,
      approved_by: user.id,
      updated_at: now,
    })
    .eq("id", params.requestId)

  if (error) {
    console.error("[moderateTdRequestAction] erro ao atualizar td_request", error)
    throw new Error("Não foi possível atualizar essa solicitação agora.")
  }

  if (params.decision === "APROVAR") {
    const tdStatus = requestedTdStatus
    const defaultObs = `TD ${request.tipo_td === "ENVIADO" ? "confirmado" : "em preparação"} (${new Intl.DateTimeFormat("pt-BR").format(new Date())})`
    const { error: candidateError } = await supabase
      .from("candidates")
      .update({
        td_status: tdStatus,
        td_observacao: request.observacao ?? defaultObs,
      })
      .eq("id", request.candidate_id)

    if (candidateError) {
      console.error("[moderateTdRequestAction] erro ao atualizar candidato", candidateError)
    }
  } else if (requestedTdStatus) {
    await resetCandidateTdStatusIfMatches(supabase, request.candidate_id, requestedTdStatus)
  }

  revalidatePath("/comissao")
  revalidatePath("/listas")
  revalidatePath("/resumo")
  revalidatePath("/tds")
}

export async function upsertLoaAction(input: {
  id?: string
  ano: number
  totalPrevisto: number
  status: string
  descricao?: string | null
  shouldNotify?: boolean
}) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  const ano = Number(input.ano)
  if (!Number.isFinite(ano) || ano < 2000) {
    throw new Error("Informe um ano válido para a LOA.")
  }

  const totalPrevisto = Number(input.totalPrevisto)
  if (!Number.isFinite(totalPrevisto) || totalPrevisto <= 0) {
    throw new Error("Total previsto precisa ser maior que zero.")
  }

  const status = input.status?.trim()
  if (!status) {
    throw new Error("Informe o status da LOA.")
  }

  const descricao = input.descricao?.trim() || null
  const now = new Date().toISOString()
  const payload = {
    ano,
    total_previsto: totalPrevisto,
    status,
    descricao,
    updated_at: now,
  }

  let targetId = input.id ?? null

  if (targetId) {
    const { error } = await supabase.from("loas").update(payload).eq("id", targetId)
    if (error) {
      console.error("[upsertLoaAction] erro ao atualizar", error)
      throw new Error("Não foi possível atualizar a LOA informada.")
    }
  } else {
    const { data, error } = await supabase
      .from("loas")
      .insert({ ...payload, created_at: now })
      .select("id")
      .single<{ id: string }>()

    if (error || !data) {
      console.error("[upsertLoaAction] erro ao criar", error)
      throw new Error("Não foi possível criar a nova LOA.")
    }

    targetId = data.id
  }

  if (input.shouldNotify && targetId) {
    await enqueueResumoNotification(supabase, {
      titulo: `LOA ${ano} atualizada`,
      corpo: `Status ${status} com ${totalPrevisto} provimentos previstos.`,
      tipo: "LOA",
      metadata: { loaId: targetId },
    })
  }

  revalidatePath("/comissao")
  revalidatePath("/resumo")
}

export async function upsertCsjtAuthorizationAction(input: {
  id?: string
  dataAutorizacao: string
  totalProvimentos: number
  observacao?: string | null
  loaId?: string | null
  destinos: CsjtDestinoInput[]
  shouldNotify?: boolean
}) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  const totalProvimentos = Number(input.totalProvimentos)
  if (!Number.isFinite(totalProvimentos) || totalProvimentos <= 0) {
    throw new Error("Informe o total de provimentos autorizados.")
  }

  const dataAutorizacao = new Date(input.dataAutorizacao)
  if (Number.isNaN(dataAutorizacao.getTime())) {
    throw new Error("Informe uma data de autorização válida.")
  }

  const destinosValidos = (input.destinos ?? [])
    .map((dest) => ({
      tribunal: dest.tribunal?.trim() ?? "",
      cargo: dest.cargo?.trim() || "—",
      quantidade: Number(dest.quantidade) || 0,
    }))
    .filter((dest) => dest.tribunal && dest.quantidade > 0)

  if (!destinosValidos.length) {
    throw new Error("Cadastre ao menos um destino para a autorização do CSJT.")
  }

  const somaDestinos = destinosValidos.reduce((acc, dest) => acc + dest.quantidade, 0)
  if (somaDestinos !== totalProvimentos) {
    throw new Error("A soma dos destinos precisa ser igual ao total de provimentos.")
  }

  const now = new Date().toISOString()
  const payload = {
    data_autorizacao: dataAutorizacao.toISOString(),
    total_provimentos: totalProvimentos,
    observacao: input.observacao?.trim() || null,
    loa_id: input.loaId || null,
    updated_at: now,
  }

  let authorizationId = input.id ?? null

  if (authorizationId) {
    const { error } = await supabase.from("csjt_autorizacoes").update(payload).eq("id", authorizationId)
    if (error) {
      console.error("[upsertCsjtAuthorizationAction] erro ao atualizar", error)
      throw new Error("Não foi possível atualizar essa autorização.")
    }

    const { error: deleteError } = await supabase
      .from("csjt_autorizacoes_destinos")
      .delete()
      .eq("csjt_autorizacao_id", authorizationId)

    if (deleteError) {
      console.error("[upsertCsjtAuthorizationAction] erro ao limpar destinos", deleteError)
      throw new Error("Não foi possível atualizar os destinos dessa autorização.")
    }
  } else {
    const { data, error } = await supabase
      .from("csjt_autorizacoes")
      .insert({ ...payload, created_at: now })
      .select("id")
      .single<{ id: string }>()

    if (error || !data) {
      console.error("[upsertCsjtAuthorizationAction] erro ao criar", error)
      throw new Error("Não foi possível criar a autorização do CSJT.")
    }

    authorizationId = data.id
  }

  if (authorizationId && destinosValidos.length) {
    const destinosPayload = destinosValidos.map((dest) => ({
      csjt_autorizacao_id: authorizationId,
      tribunal: dest.tribunal,
      cargo: dest.cargo,
      quantidade: dest.quantidade,
    }))

    const { error: destinosError } = await supabase
      .from("csjt_autorizacoes_destinos")
      .insert(destinosPayload)

    if (destinosError) {
      console.error("[upsertCsjtAuthorizationAction] erro ao salvar destinos", destinosError)
      throw new Error("Não foi possível salvar os destinos dessa autorização.")
    }
  }

  if (input.shouldNotify && authorizationId) {
    await enqueueResumoNotification(supabase, {
      titulo: `CSJT autorizou ${totalProvimentos} provimentos`,
      corpo: `Distribuição confirmada em ${formatPtBr(payload.data_autorizacao)}.`,
      tipo: "CSJT",
      metadata: { csjtAuthorizationId: authorizationId },
    })
  }

  revalidatePath("/comissao")
  revalidatePath("/resumo")
}

export async function upsertCargosVagosAction(input: {
  id?: string
  dataReferencia: string
  analistaVagos: number
  tecnicoVagos: number
  observacao?: string | null
  fonteUrl?: string | null
  shouldNotify?: boolean
}) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  const dataReferencia = new Date(input.dataReferencia)
  if (Number.isNaN(dataReferencia.getTime())) {
    throw new Error("Informe uma data de referência válida.")
  }

  const analistaVagos = Number(input.analistaVagos)
  const tecnicoVagos = Number(input.tecnicoVagos)

  if (!Number.isFinite(analistaVagos) || analistaVagos < 0 || !Number.isFinite(tecnicoVagos) || tecnicoVagos < 0) {
    throw new Error("Informe números válidos para cargos vagos.")
  }

  const now = new Date().toISOString()
  const payload = {
    data_referencia: dataReferencia.toISOString(),
    analista_vagos: analistaVagos,
    tecnico_vagos: tecnicoVagos,
    observacao: input.observacao?.trim() || null,
    fonte_url: input.fonteUrl?.trim() || null,
    updated_at: now,
  }

  let targetId = input.id ?? null

  if (targetId) {
    const { error } = await supabase.from("cargos_vagos_trt2").update(payload).eq("id", targetId)
    if (error) {
      console.error("[upsertCargosVagosAction] erro ao atualizar", error)
      throw new Error("Não foi possível atualizar o registro de cargos vagos.")
    }
  } else {
    const { data, error } = await supabase
      .from("cargos_vagos_trt2")
      .insert({ ...payload, created_at: now })
      .select("id")
      .single<{ id: string }>()

    if (error || !data) {
      console.error("[upsertCargosVagosAction] erro ao criar", error)
      throw new Error("Não foi possível criar o registro de cargos vagos.")
    }

    targetId = data.id
  }

  if (input.shouldNotify && targetId) {
    await enqueueResumoNotification(supabase, {
      titulo: "Cargos vagos atualizados",
      corpo: `${analistaVagos} AJ / ${tecnicoVagos} TJ na data ${formatPtBr(payload.data_referencia)}.`,
      tipo: "CARGOS_VAGOS",
      metadata: { cargosVagosId: targetId },
    })
  }

  revalidatePath("/comissao")
  revalidatePath("/resumo")
}

export async function registrarNomeacaoAction(input: {
  candidateId: string
  dataNomeacao: string
  numeroAto?: string | null
  fonteUrl?: string | null
  observacao?: string | null
  nomeacaoId?: string | null
  shouldNotify?: boolean
}) {
  if (!input.candidateId) {
    throw new Error("Selecione o aprovado que foi nomeado.")
  }

  const supabase = await createSupabaseServerClient()
  const user = await assertComissaoUser()

  const dataNomeacao = new Date(input.dataNomeacao)
  if (Number.isNaN(dataNomeacao.getTime())) {
    throw new Error("Informe uma data de nomeação válida.")
  }

  const now = new Date().toISOString()
  const nomeacaoPayload = {
    data_nomeacao: dataNomeacao.toISOString(),
    numero_ato: input.numeroAto?.trim() || null,
    fonte_url: input.fonteUrl?.trim() || null,
    observacao: input.observacao?.trim() || null,
    tipo: "NOMEACAO",
    updated_at: now,
    created_by: user.id,
  }

  let nomeacaoId = input.nomeacaoId ?? null

  if (nomeacaoId) {
    const { error } = await supabase
      .from("nomeacoes")
      .update(nomeacaoPayload)
      .eq("id", nomeacaoId)

    if (error) {
      console.error("[registrarNomeacaoAction] erro ao atualizar nomeação", error)
      throw new Error("Não foi possível atualizar a nomeação informada.")
    }
  } else {
    const { data, error } = await supabase
      .from("nomeacoes")
      .insert({ ...nomeacaoPayload, created_at: now })
      .select("id")
      .single<{ id: string }>()

    if (error || !data) {
      console.error("[registrarNomeacaoAction] erro ao criar nomeação", error)
      throw new Error("Não foi possível criar o registro de nomeação.")
    }

    nomeacaoId = data.id
  }

  const { error: linkError } = await supabase.from("nomeacoes_candidatos").insert({
    nomeacao_id: nomeacaoId,
    candidate_id: input.candidateId,
    status: "PUBLICADA",
    observacao: nomeacaoPayload.observacao,
    created_at: now,
    updated_at: now,
  })

  if (linkError) {
    console.error("[registrarNomeacaoAction] erro ao vincular candidato", linkError)
    throw new Error("Não foi possível vincular o aprovado à nomeação.")
  }

  const { error: candidateError } = await supabase
    .from("candidates")
    .update({ status_nomeacao: "NOMEADO", updated_at: now })
    .eq("id", input.candidateId)

  if (candidateError) {
    console.error("[registrarNomeacaoAction] erro ao atualizar candidato", candidateError)
    throw new Error("Nomeação registrada, mas não conseguimos atualizar o candidato.")
  }

  if (input.shouldNotify && nomeacaoId) {
    await enqueueResumoNotification(supabase, {
      titulo: "Nova nomeação publicada",
      corpo: "Atualizamos a lista de nomeados no TRT-2.",
      tipo: "NOMEACAO",
      metadata: { nomeacaoId, candidateId: input.candidateId },
    })
  }

  revalidatePath("/comissao")
  revalidatePath("/listas")
  revalidatePath("/resumo")
}

export async function createManualTdAction(input: {
  candidateId: string
  tipoTd: TdRequestTipo
  dataReferencia?: string | null
  observacao?: string | null
  shouldNotify?: boolean
}) {
  if (!input.candidateId) {
    throw new Error("Selecione o aprovado para registrar o TD.")
  }

  const supabase = await createSupabaseServerClient()
  const user = await assertComissaoUser()

  const tipoNormalizado = input.tipoTd?.toUpperCase() as TdRequestTipo
  if (!TD_REQUEST_TIPOS.includes(tipoNormalizado)) {
    throw new Error("Tipo de TD inválido.")
  }

  const { data: candidateRow, error: candidateError } = await supabase
    .from("candidates")
    .select("nome")
    .eq("id", input.candidateId)
    .maybeSingle<{ nome: string | null }>()

  if (candidateError || !candidateRow) {
    console.error("[createManualTdAction] erro ao buscar candidato", candidateError)
    throw new Error("Não encontramos o aprovado informado.")
  }

  const referenceDate = input.dataReferencia ? new Date(input.dataReferencia) : new Date()
  if (Number.isNaN(referenceDate.getTime())) {
    throw new Error("Informe uma data válida para o TD.")
  }

  const nowIso = new Date().toISOString()
  const referenceIso = referenceDate.toISOString()
  const observacao = input.observacao?.trim() || null

  const { error: insertError } = await supabase.from("td_requests").insert({
    candidate_id: input.candidateId,
    user_id: user.id,
    tipo_td: tipoNormalizado,
    observacao,
    status: "APROVADO",
    created_at: nowIso,
    updated_at: nowIso,
    approved_at: nowIso,
    approved_by: user.id,
    data_aprovacao: referenceIso,
  })

  if (insertError) {
    console.error("[createManualTdAction] erro ao registrar TD manual", insertError)
    throw new Error("Não foi possível registrar o TD manual agora.")
  }

  const tdStatus = mapTipoTdToCandidateStatus(tipoNormalizado)
  if (tdStatus) {
    const defaultObs = observacao ?? `TD ${tipoNormalizado === "ENVIADO" ? "confirmado" : "em preparação"} (${formatPtBr(referenceIso)})`
    const { error: candidateUpdateError } = await supabase
      .from("candidates")
      .update({ td_status: tdStatus, td_observacao: defaultObs })
      .eq("id", input.candidateId)

    if (candidateUpdateError) {
      console.error("[createManualTdAction] erro ao atualizar candidato", candidateUpdateError)
      throw new Error("TD registrado, mas não foi possível atualizar o candidato.")
    }
  }

  if (input.shouldNotify) {
    await enqueueResumoNotification(supabase, {
      titulo: tipoNormalizado === "ENVIADO" ? "TD confirmado" : "Atualização de interesse em TD",
      corpo: `Registro realizado para ${candidateRow.nome ?? "aprovado"}.`,
      tipo: "TD_MANUAL",
      metadata: { candidateId: input.candidateId, tipoTd: tipoNormalizado },
    })
  }

  revalidatePath("/comissao")
  revalidatePath("/tds")
  revalidatePath("/listas")
  revalidatePath("/resumo")
}

export async function upsertTdContentAction(input: {
  overview: string
  instructions: string
  models: { label: string; url: string }[]
}) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  const overview = input.overview?.trim()
  const instructions = input.instructions?.trim()
  if (!overview || !instructions) {
    throw new Error("Informe os textos principais para salvar o conteúdo do TD.")
  }

  const models = (input.models ?? [])
    .map((model) => ({ label: model.label?.trim() ?? "", url: model.url?.trim() ?? "" }))
    .filter((model) => model.label && model.url)

  const payload = { overview, instructions, models }
  const nowIso = new Date().toISOString()

  const { error } = await supabase
    .from("td_content_settings")
    .upsert(
      {
        key: "td_guides",
        content: payload,
        updated_at: nowIso,
      },
      { onConflict: "key" }
    )

  if (error) {
    console.error("[upsertTdContentAction] erro ao salvar conteúdo", error)
    throw new Error("Não foi possível salvar o conteúdo do TD agora.")
  }

  revalidatePath("/tds")
  revalidatePath("/comissao")
}

export async function upsertVacanciaAction(input: {
  id?: string
  data: string
  tribunal: string
  cargo: string
  motivo?: string | null
  tipo?: string | null
  nomeServidor?: string | null
  douLink?: string | null
  observacao?: string | null
  shouldNotify?: boolean
}) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  const dataValue = new Date(input.data)
  if (Number.isNaN(dataValue.getTime())) {
    throw new Error("Informe uma data válida para a vacância.")
  }

  const tribunal = input.tribunal?.trim()
  const cargo = input.cargo?.trim()
  if (!tribunal || !cargo) {
    throw new Error("Tribunal e cargo são obrigatórios.")
  }

  const now = new Date().toISOString()
  const payload = {
    data: dataValue.toISOString(),
    tribunal,
    cargo,
    motivo: input.motivo?.trim() || null,
    tipo: input.tipo?.trim() || null,
    nome_servidor: input.nomeServidor?.trim() || null,
    dou_link: input.douLink?.trim() || null,
    observacao: input.observacao?.trim() || null,
    updated_at: now,
  }

  let vacanciaId = input.id ?? null

  if (vacanciaId) {
    const { error } = await supabase.from("vacancias").update(payload).eq("id", vacanciaId)
    if (error) {
      console.error("[upsertVacanciaAction] erro ao atualizar vacância", error)
      throw new Error("Não foi possível atualizar a vacância informada.")
    }
  } else {
    const { data, error } = await supabase
      .from("vacancias")
      .insert({ ...payload, created_at: now })
      .select("id")
      .single<{ id: string }>()

    if (error || !data) {
      console.error("[upsertVacanciaAction] erro ao criar vacância", error)
      throw new Error("Não foi possível cadastrar a vacância.")
    }

    vacanciaId = data.id
  }

  if (input.shouldNotify && vacanciaId) {
    const titulo = `Nova vacância (${cargo})`
    const corpo = `${tribunal} registrou vacância em ${formatPtBr(payload.data)}.`
    await enqueueResumoNotification(supabase, {
      titulo,
      corpo,
      tipo: "VACANCIA",
      metadata: { vacanciaId },
    })
  }

  revalidatePath("/comissao")
  revalidatePath("/resumo")
  revalidatePath("/vacancias")
}

export async function deleteVacanciaAction(params: { id: string }) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  if (!params.id) {
    throw new Error("Informe o registro que deseja remover.")
  }

  const { error } = await supabase.from("vacancias").delete().eq("id", params.id)

  if (error) {
    console.error("[deleteVacanciaAction] erro ao remover vacância", error)
    throw new Error("Não foi possível remover essa vacância agora.")
  }

  revalidatePath("/comissao")
  revalidatePath("/resumo")
  revalidatePath("/vacancias")
}

export async function enqueueCustomNotificationAction(input: {
  titulo: string
  corpo: string
  tipo?: string
  visivelPara?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  const titulo = input.titulo?.trim()
  const corpo = input.corpo?.trim()
  if (!titulo || !corpo) {
    throw new Error("Informe título e corpo da notificação.")
  }

  await enqueueResumoNotification(supabase, {
    titulo,
    corpo,
    tipo: input.tipo ?? "CUSTOM",
    visivelPara: input.visivelPara ?? "APROVADOS",
    metadata: input.metadata ?? null,
  })

  revalidatePath("/comissao")
}

export async function retryNotificationAction(input: { notificationId: string }) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  if (!input.notificationId) {
    throw new Error("Selecione a notificação para reenfileirar.")
  }

  const { error } = await supabase
    .from("notifications_queue")
    .update({ status: "PENDENTE", error_message: null, sent_at: null })
    .eq("id", input.notificationId)

  if (error) {
    console.error("[retryNotificationAction] erro ao reenfileirar", error)
    throw new Error("Não foi possível reenfileirar essa notificação.")
  }

  revalidatePath("/comissao")
}

export async function cancelNotificationAction(input: { notificationId: string }) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  if (!input.notificationId) {
    throw new Error("Selecione a notificação para cancelar.")
  }

  const { error } = await supabase
    .from("notifications_queue")
    .update({ status: "CANCELADO", error_message: null })
    .eq("id", input.notificationId)

  if (error) {
    console.error("[cancelNotificationAction] erro ao cancelar notificação", error)
    throw new Error("Não foi possível cancelar essa notificação.")
  }

  revalidatePath("/comissao")
}

type ExportManifest = "candidates" | "vacancias"

export async function generateExportAction(input: { type: ExportManifest }) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  let rows: Record<string, string | number | null>[] = []
  let columns: { key: string; label: string }[] = []
  const filename = `${input.type}-${new Date().toISOString().slice(0, 10)}.csv`

  if (input.type === "candidates") {
    const { data, error } = await supabase
      .from("candidates")
      .select("nome, sistema_concorrencia, classificacao_lista, status_nomeacao, td_status, td_observacao")
      .order("classificacao_lista", { ascending: true })

    if (error || !data) {
      console.error("[generateExportAction] erro ao gerar CSV de candidatos", error)
      throw new Error("Não foi possível gerar o CSV de candidatos.")
    }

    rows = data.map((row) => ({
      nome: row.nome,
      sistema: row.sistema_concorrencia,
      classificacao: row.classificacao_lista,
      status_nomeacao: row.status_nomeacao,
      td_status: row.td_status,
      td_observacao: row.td_observacao,
    }))

    columns = [
      { key: "nome", label: "Nome" },
      { key: "sistema", label: "Sistema" },
      { key: "classificacao", label: "Classificação" },
      { key: "status_nomeacao", label: "Status nomeação" },
      { key: "td_status", label: "Status TD" },
      { key: "td_observacao", label: "Obs. TD" },
    ]
  } else if (input.type === "vacancias") {
    const { data, error } = await supabase
      .from("vacancias")
      .select("data, tribunal, cargo, motivo, tipo, nome_servidor, dou_link")
      .order("data", { ascending: false })

    if (error || !data) {
      console.error("[generateExportAction] erro ao gerar CSV de vacâncias", error)
      throw new Error("Não foi possível gerar o CSV de vacâncias.")
    }

    rows = data.map((row) => ({
      data: row.data,
      tribunal: row.tribunal,
      cargo: row.cargo,
      motivo: row.motivo,
      tipo: row.tipo,
      nome_servidor: row.nome_servidor,
      dou_link: row.dou_link,
    }))

    columns = [
      { key: "data", label: "Data" },
      { key: "tribunal", label: "Tribunal" },
      { key: "cargo", label: "Cargo" },
      { key: "motivo", label: "Motivo" },
      { key: "tipo", label: "Tipo" },
      { key: "nome_servidor", label: "Servidor" },
      { key: "dou_link", label: "Link DOU" },
    ]
  } else {
    throw new Error("Tipo de exportação não suportado.")
  }

  const csvContent = buildCsv(rows, columns)
  return { filename, content: csvContent }
}

function buildCsv(rows: Record<string, string | number | null>[], columns: { key: string; label: string }[]) {
  const header = columns.map((col) => `"${col.label}"`).join(",")
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const value = row[col.key]
          if (value === null || value === undefined) return ""
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(","),
    )
    .join("\n")

  return [header, body].filter(Boolean).join("\n")
}
