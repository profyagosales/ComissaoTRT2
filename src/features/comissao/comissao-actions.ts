"use server"

import { revalidatePath } from "next/cache"

import { createSupabaseServerClient } from "@/lib/supabase-server"
import { TD_REQUEST_TIPOS, mapTipoTdToCandidateStatus } from "@/features/tds/td-types"
import type { CandidateTdStatus, TdRequestTipo } from "@/features/tds/td-types"
import { VACANCIA_CLASSE_LABEL, type VacanciaClasse, type VacanciaTipo } from "@/features/vacancias/vacancia-types"

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

type ColumnSet = Set<string> | null

const tableColumnCache = new Map<string, ColumnSet>()

const TABLE_COLUMN_FALLBACKS: Record<string, string[]> = {
  "public.csjt_autorizacoes": [
    "id",
    "loa_id",
    "data_autorizacao",
    "total_provimentos",
    "observacao",
    "created_at",
  ],
  "csjt_autorizacoes": [
    "id",
    "loa_id",
    "data_autorizacao",
    "total_provimentos",
    "observacao",
    "created_at",
  ],
  "public.cargos_vagos_trt2": [
    "id",
    "data_referencia",
    "analista_vagos",
    "tecnico_vagos",
    "observacao",
    "fonte_url",
    "created_at",
  ],
  "cargos_vagos_trt2": [
    "id",
    "data_referencia",
    "analista_vagos",
    "tecnico_vagos",
    "observacao",
    "fonte_url",
    "created_at",
  ],
}

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

function resolveFallbackColumns(cacheKey: string, tableName: string): ColumnSet {
  const fallbackColumns = TABLE_COLUMN_FALLBACKS[cacheKey] ?? TABLE_COLUMN_FALLBACKS[tableName]
  if (!fallbackColumns?.length) {
    return null
  }

  return new Set(fallbackColumns)
}

async function getTableColumns(supabase: SupabaseServerClient, table: string): Promise<ColumnSet> {
  const [schema = "public", tableName] = table.includes(".") ? table.split(".") : ["public", table]
  const cacheKey = `${schema}.${tableName}`
  if (tableColumnCache.has(cacheKey)) {
    return tableColumnCache.get(cacheKey) ?? null
  }

  try {
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", schema)
      .eq("table_name", tableName)

    if (!error && data && data.length) {
      const columns = new Set(data.map((row) => row.column_name as string))
      tableColumnCache.set(cacheKey, columns)
      return columns
    }
  } catch (error) {
    console.error(`[comissao-actions] falha ao ler information_schema para ${cacheKey}`, error)
  }

  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(1)
    if (error) {
      console.error(`[comissao-actions] erro ao inspecionar colunas de ${tableName}`, error)
      const fallback = resolveFallbackColumns(cacheKey, tableName)
      tableColumnCache.set(cacheKey, fallback)
      return fallback
    }
    if (!data || !data.length) {
      const fallback = resolveFallbackColumns(cacheKey, tableName)
      tableColumnCache.set(cacheKey, fallback)
      return fallback
    }
    const columns = new Set(Object.keys(data[0] as Record<string, unknown>))
    tableColumnCache.set(cacheKey, columns)
    return columns
  } catch (error) {
    console.error(`[comissao-actions] falha inesperada ao inspecionar ${tableName}`, error)
    const fallback = resolveFallbackColumns(cacheKey, tableName)
    tableColumnCache.set(cacheKey, fallback)
    return fallback
  }
}

function assignColumnIfExists(
  columns: ColumnSet,
  target: Record<string, unknown>,
  column: string,
  value: unknown,
) {
  if (columns && !columns.has(column)) return
  target[column] = value
}

function assignFromAliases(
  columns: ColumnSet,
  target: Record<string, unknown>,
  aliases: string[],
  value: unknown,
) {
  const column = columns ? aliases.find((alias) => columns.has(alias)) ?? null : aliases[0] ?? null
  if (!column) return
  if (columns && !columns.has(column)) return
  target[column] = value
}

function readValueFromAliases(row: Record<string, unknown>, aliases: string[]): string | null {
  for (const alias of aliases) {
    const value = row[alias]
    if (typeof value === "string" && value.length) {
      return value
    }
  }
  return null
}

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
  const csjtColumns = await getTableColumns(supabase, "csjt_autorizacoes")
  const dataAutorizacaoIso = dataAutorizacao.toISOString()
  const payload: Record<string, unknown> = {}
  assignColumnIfExists(csjtColumns, payload, "data_autorizacao", dataAutorizacaoIso)
  assignColumnIfExists(csjtColumns, payload, "total_provimentos", totalProvimentos)
  assignColumnIfExists(csjtColumns, payload, "observacao", input.observacao?.trim() || null)
  assignColumnIfExists(csjtColumns, payload, "loa_id", input.loaId || null)
  assignColumnIfExists(csjtColumns, payload, "updated_at", now)

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
    const insertPayload = { ...payload }
    assignColumnIfExists(csjtColumns, insertPayload, "created_at", now)
    const { data, error } = await supabase
      .from("csjt_autorizacoes")
      .insert(insertPayload)
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
      corpo: `Distribuição confirmada em ${formatPtBr(dataAutorizacaoIso)}.`,
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
  const cargosVagosColumns = await getTableColumns(supabase, "cargos_vagos_trt2")
  const dataReferenciaIso = dataReferencia.toISOString()
  const payload: Record<string, unknown> = {}
  assignColumnIfExists(cargosVagosColumns, payload, "data_referencia", dataReferenciaIso)
  assignColumnIfExists(cargosVagosColumns, payload, "analista_vagos", analistaVagos)
  assignColumnIfExists(cargosVagosColumns, payload, "tecnico_vagos", tecnicoVagos)
  assignColumnIfExists(cargosVagosColumns, payload, "observacao", input.observacao?.trim() || null)
  assignColumnIfExists(cargosVagosColumns, payload, "fonte_url", input.fonteUrl?.trim() || null)
  assignColumnIfExists(cargosVagosColumns, payload, "updated_at", now)

  let targetId = input.id ?? null

  if (targetId) {
    const { error } = await supabase.from("cargos_vagos_trt2").update(payload).eq("id", targetId)
    if (error) {
      console.error("[upsertCargosVagosAction] erro ao atualizar", error)
      throw new Error("Não foi possível atualizar o registro de cargos vagos.")
    }
  } else {
    const insertPayload = { ...payload }
    assignColumnIfExists(cargosVagosColumns, insertPayload, "created_at", now)
    const { data, error } = await supabase
      .from("cargos_vagos_trt2")
      .insert(insertPayload)
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
      corpo: `${analistaVagos} AJ / ${tecnicoVagos} TJ na data ${formatPtBr(dataReferenciaIso)}.`,
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
  const nomeacoesColumns = await getTableColumns(supabase, "nomeacoes")
  const nomeacaoLinkColumns = await getTableColumns(supabase, "nomeacoes_candidatos")
  const candidateColumns = await getTableColumns(supabase, "candidates")

  const dataNomeacao = new Date(input.dataNomeacao)
  if (Number.isNaN(dataNomeacao.getTime())) {
    throw new Error("Informe uma data de nomeação válida.")
  }

  const now = new Date().toISOString()
  const dataNomeacaoIso = dataNomeacao.toISOString()
  const numeroAto = input.numeroAto?.trim() || null
  const fonteUrl = input.fonteUrl?.trim() || null
  const observacao = input.observacao?.trim() || null

  const nomeacaoPayload: Record<string, unknown> = {}
  assignColumnIfExists(nomeacoesColumns, nomeacaoPayload, "data_nomeacao", dataNomeacaoIso)
  assignColumnIfExists(nomeacoesColumns, nomeacaoPayload, "numero_ato", numeroAto)
  assignColumnIfExists(nomeacoesColumns, nomeacaoPayload, "fonte_url", fonteUrl)
  assignColumnIfExists(nomeacoesColumns, nomeacaoPayload, "observacao", observacao)
  assignColumnIfExists(nomeacoesColumns, nomeacaoPayload, "tipo", "NOMEACAO")
  assignColumnIfExists(nomeacoesColumns, nomeacaoPayload, "updated_at", now)
  assignColumnIfExists(nomeacoesColumns, nomeacaoPayload, "created_by", user.id)

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
    const insertPayload = { ...nomeacaoPayload }
    assignColumnIfExists(nomeacoesColumns, insertPayload, "created_at", now)
    const { data, error } = await supabase
      .from("nomeacoes")
      .insert(insertPayload)
      .select("id")
      .single<{ id: string }>()

    if (error || !data) {
      console.error("[registrarNomeacaoAction] erro ao criar nomeação", error)
      throw new Error("Não foi possível criar o registro de nomeação.")
    }

    nomeacaoId = data.id
  }

  const linkPayload: Record<string, unknown> = {
    nomeacao_id: nomeacaoId,
    candidate_id: input.candidateId,
  }
  assignColumnIfExists(nomeacaoLinkColumns, linkPayload, "status", "PUBLICADA")
  assignColumnIfExists(nomeacaoLinkColumns, linkPayload, "observacao", observacao)
  assignColumnIfExists(nomeacaoLinkColumns, linkPayload, "created_at", now)
  assignColumnIfExists(nomeacaoLinkColumns, linkPayload, "updated_at", now)

  const { error: linkError } = await supabase.from("nomeacoes_candidatos").insert(linkPayload)

  if (linkError) {
    console.error("[registrarNomeacaoAction] erro ao vincular candidato", linkError)
    throw new Error("Não foi possível vincular o aprovado à nomeação.")
  }

  const candidateUpdate: Record<string, unknown> = {}
  assignColumnIfExists(candidateColumns, candidateUpdate, "status_nomeacao", "NOMEADO")
  assignColumnIfExists(candidateColumns, candidateUpdate, "updated_at", now)

  if (Object.keys(candidateUpdate).length) {
    const { error: candidateError } = await supabase
      .from("candidates")
      .update(candidateUpdate)
      .eq("id", input.candidateId)

    if (candidateError) {
      console.error("[registrarNomeacaoAction] erro ao atualizar candidato", candidateError)
      throw new Error("Nomeação registrada, mas não conseguimos atualizar o candidato.")
    }
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
  const tdRequestColumns = await getTableColumns(supabase, "td_requests")
  const candidateColumns = await getTableColumns(supabase, "candidates")

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

  const tdPayload: Record<string, unknown> = {}
  assignColumnIfExists(tdRequestColumns, tdPayload, "candidate_id", input.candidateId)
  assignColumnIfExists(tdRequestColumns, tdPayload, "user_id", user.id)
  assignColumnIfExists(tdRequestColumns, tdPayload, "tipo_td", tipoNormalizado)
  assignColumnIfExists(tdRequestColumns, tdPayload, "observacao", observacao)
  assignColumnIfExists(tdRequestColumns, tdPayload, "status", "APROVADO")
  assignColumnIfExists(tdRequestColumns, tdPayload, "created_at", nowIso)
  assignColumnIfExists(tdRequestColumns, tdPayload, "updated_at", nowIso)
  assignColumnIfExists(tdRequestColumns, tdPayload, "approved_at", nowIso)
  assignColumnIfExists(tdRequestColumns, tdPayload, "approved_by", user.id)
  assignColumnIfExists(tdRequestColumns, tdPayload, "data_aprovacao", referenceIso)

  const { error: insertError } = await supabase.from("td_requests").insert(tdPayload)

  if (insertError) {
    console.error("[createManualTdAction] erro ao registrar TD manual", insertError)
    throw new Error("Não foi possível registrar o TD manual agora.")
  }

  const tdStatus = mapTipoTdToCandidateStatus(tipoNormalizado)
  if (tdStatus) {
    const defaultObs = observacao ?? `TD ${tipoNormalizado === "ENVIADO" ? "confirmado" : "em preparação"} (${formatPtBr(referenceIso)})`
    const candidateUpdate: Record<string, unknown> = {}
    assignColumnIfExists(candidateColumns, candidateUpdate, "td_status", tdStatus)
    assignColumnIfExists(candidateColumns, candidateUpdate, "td_observacao", defaultObs)

    if (Object.keys(candidateUpdate).length) {
      const { error: candidateUpdateError } = await supabase
        .from("candidates")
        .update(candidateUpdate)
        .eq("id", input.candidateId)

      if (candidateUpdateError) {
        console.error("[createManualTdAction] erro ao atualizar candidato", candidateUpdateError)
        throw new Error("TD registrado, mas não foi possível atualizar o candidato.")
      }
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
  howItWorksHtml: string
  guidelinesHtml: string
  models: { label: string; url: string }[]
}) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()

  const howItWorksHtml = (input.howItWorksHtml ?? "").trim()
  const guidelinesHtml = (input.guidelinesHtml ?? "").trim()

  const hasContent = (html: string) => html.replace(/<[^>]+>/g, "").trim().length > 0

  if (!hasContent(howItWorksHtml) || !hasContent(guidelinesHtml)) {
    throw new Error("As seções de texto precisam ter conteúdo antes de salvar.")
  }

  const models = (input.models ?? [])
    .map((model) => ({ label: model.label?.trim() ?? "", url: model.url?.trim() ?? "" }))
    .filter((model) => model.label && model.url)

  const payload = {
    howItWorksHtml,
    guidelinesHtml,
    models,
  }
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
  classe?: VacanciaClasse | null
  motivo?: string | null
  tipo?: VacanciaTipo | string | null
  nomeServidor?: string | null
  douLink?: string | null
  observacao?: string | null
  shouldNotify?: boolean
}) {
  const supabase = await createSupabaseServerClient()
  await assertComissaoUser()
  const vacanciaColumns = await getTableColumns(supabase, "vacancias")

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
  const dataIso = dataValue.toISOString()
  const payload: Record<string, unknown> = {}
  assignFromAliases(vacanciaColumns, payload, VACANCIA_COLUMN_ALIASES.data, dataIso)
  assignFromAliases(vacanciaColumns, payload, VACANCIA_COLUMN_ALIASES.tribunal, tribunal)
  assignFromAliases(vacanciaColumns, payload, VACANCIA_COLUMN_ALIASES.cargo, cargo)
  const classeLabel = input.classe ? VACANCIA_CLASSE_LABEL[input.classe] : input.motivo?.trim() || null
  assignFromAliases(vacanciaColumns, payload, VACANCIA_COLUMN_ALIASES.motivo, classeLabel)
  const tipoValue = typeof input.tipo === "string" ? input.tipo.trim() : null
  assignFromAliases(vacanciaColumns, payload, VACANCIA_COLUMN_ALIASES.tipo, tipoValue || null)
  assignFromAliases(
    vacanciaColumns,
    payload,
    VACANCIA_COLUMN_ALIASES.nomeServidor,
    input.nomeServidor?.trim() || null,
  )
  assignFromAliases(vacanciaColumns, payload, VACANCIA_COLUMN_ALIASES.douLink, input.douLink?.trim() || null)
  assignFromAliases(
    vacanciaColumns,
    payload,
    VACANCIA_COLUMN_ALIASES.observacao,
    input.observacao?.trim() || null,
  )
  assignColumnIfExists(vacanciaColumns, payload, "updated_at", now)

  let vacanciaId = input.id ?? null

  if (vacanciaId) {
    const { error } = await supabase.from("vacancias").update(payload).eq("id", vacanciaId)
    if (error) {
      console.error("[upsertVacanciaAction] erro ao atualizar vacância", error)
      throw new Error("Não foi possível atualizar a vacância informada.")
    }
  } else {
    const insertPayload = { ...payload }
    assignColumnIfExists(vacanciaColumns, insertPayload, "created_at", now)
    const { data, error } = await supabase
      .from("vacancias")
      .insert(insertPayload)
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
    const dataValueForNotification =
      readValueFromAliases(payload as Record<string, unknown>, VACANCIA_COLUMN_ALIASES.data) ??
      dataIso
    const corpo = `${tribunal} registrou vacância em ${formatPtBr(dataValueForNotification)}.`
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
    const vacanciaColumns = await getTableColumns(supabase, "vacancias")
    const orderColumn = vacanciaColumns
      ? VACANCIA_COLUMN_ALIASES.data.find((alias) => vacanciaColumns.has(alias)) ?? undefined
      : undefined

    let query = supabase.from("vacancias").select("*")
    if (orderColumn) {
      query = query.order(orderColumn, { ascending: false })
    }

    const { data, error } = await query

    if (error || !data) {
      console.error("[generateExportAction] erro ao gerar CSV de vacâncias", error)
      throw new Error("Não foi possível gerar o CSV de vacâncias.")
    }

    rows = data.map((row) => ({
      data: readValueFromAliases(row as Record<string, unknown>, VACANCIA_COLUMN_ALIASES.data),
      tribunal: readValueFromAliases(row as Record<string, unknown>, VACANCIA_COLUMN_ALIASES.tribunal),
      cargo: readValueFromAliases(row as Record<string, unknown>, VACANCIA_COLUMN_ALIASES.cargo),
      motivo: readValueFromAliases(row as Record<string, unknown>, VACANCIA_COLUMN_ALIASES.motivo),
      tipo: readValueFromAliases(row as Record<string, unknown>, VACANCIA_COLUMN_ALIASES.tipo),
      nome_servidor: readValueFromAliases(
        row as Record<string, unknown>,
        VACANCIA_COLUMN_ALIASES.nomeServidor,
      ),
      dou_link: readValueFromAliases(row as Record<string, unknown>, VACANCIA_COLUMN_ALIASES.douLink),
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
