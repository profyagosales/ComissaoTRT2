"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function updateUserProfileContact(input: {
  userId: string;
  telefone?: string;
  instagram?: string;
  facebook?: string;
  outras_redes?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("user_profiles")
    .update({
      telefone: input.telefone ?? null,
      instagram: input.instagram ?? null,
      facebook: input.facebook ?? null,
      outras_redes: input.outras_redes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId);

  if (error) {
    console.error("Erro ao atualizar user_profiles:", error);
    throw new Error("Não foi possível salvar seus dados de contato.");
  }
}

export async function createTdRequest(input: {
  candidateId: string;
  tipoTd: "ENVIADO" | "QUERO_ENVIAR";
  observacao?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("td_requests").insert({
    candidate_id: input.candidateId,
    tipo_td: input.tipoTd,
    observacao: input.observacao ?? null,
  });

  if (error) {
    console.error("Erro ao criar td_requests:", error);
    throw new Error("Não foi possível registrar sua solicitação de TD.");
  }
}

export async function createOutraAprovacao(input: {
  candidateId: string;
  orgao: string;
  cargo: string;
  sistemaConcorrencia: "AC" | "PCD" | "PPP" | "INDIGENA";
  classificacao?: number;
  pretendeAssumir?: "SIM" | "NAO" | "INDEFINIDO";
  jaNomeado?: "SIM" | "NAO" | "EM_ANDAMENTO";
  observacao?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("outras_aprovacoes").insert({
    candidate_id: input.candidateId,
    orgao: input.orgao,
    cargo: input.cargo,
    sistema_concorrencia: input.sistemaConcorrencia,
    classificacao: input.classificacao ?? null,
    pretende_assumir: input.pretendeAssumir ?? "INDEFINIDO",
    ja_nomeado: input.jaNomeado ?? "NAO",
    observacao: input.observacao ?? null,
  });

  if (error) {
    console.error("Erro ao criar outras_aprovacoes:", error);
    throw new Error(
      "Não foi possível registrar essa aprovação em outro concurso.",
    );
  }
}
