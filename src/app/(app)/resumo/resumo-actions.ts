"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { TdRequestTipo } from "@/features/tds/td-types";

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

export async function createTdRequest(input: { tipoTd: TdRequestTipo; observacao?: string }) {
  const supabase = await createSupabaseServerClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("É necessário estar autenticado para enviar TD.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("candidate_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao consultar user_profiles para TD:", profileError);
      throw new Error("Não foi possível validar seu perfil de candidato.");
    }

    if (!profile?.candidate_id) {
      throw new Error("Associe-se a um candidato antes de enviar o TD.");
    }

    const now = new Date().toISOString();
    const observacao = input.observacao?.trim() ? input.observacao.trim() : null;

    const { error } = await supabase.from("td_requests").insert({
      candidate_id: profile.candidate_id,
      user_id: user.id,
      tipo_td: input.tipoTd,
      observacao,
      status: "PENDENTE",
      approved_at: null,
      approved_by: null,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.error("Erro ao criar td_requests:", error);
      throw new Error("Não foi possível registrar sua solicitação de TD.");
    }

    revalidatePath("/resumo");
    revalidatePath("/listas");
    revalidatePath("/tds");
    revalidatePath("/comissao");

    return { success: true };
  } catch (error) {
    console.error("[createTdRequest] erro ao processar TD:", error);
    if (error instanceof Error) {
      throw error;
    }
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
    ja_foi_nomeado: input.jaNomeado ?? "NAO",
    observacao: input.observacao ?? null,
  });

  if (error) {
    console.error("Erro ao criar outras_aprovacoes:", error);
    throw new Error(
      "Não foi possível registrar essa aprovação em outro concurso.",
    );
  }
}
