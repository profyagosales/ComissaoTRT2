"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { TD_REQUEST_TIPOS, type TdRequestTipo } from "@/features/tds/td-types";

export async function updateUserProfileContact(input: {
  userId: string;
  telefone?: string;
  instagram?: string;
  facebook?: string;
  outras_redes?: string;
  avatarUrl?: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  const updateData: Record<string, unknown> = {
    telefone: input.telefone ?? null,
    instagram: input.instagram ?? null,
    facebook: input.facebook ?? null,
    outras_redes: input.outras_redes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.avatarUrl !== undefined) {
    updateData.avatar_url = input.avatarUrl ?? null;
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(updateData)
    .eq("user_id", input.userId);

  if (error) {
    console.error("Erro ao atualizar user_profiles:", error);
    throw new Error("Não foi possível salvar seus dados de contato.");
  }
}

export async function createTdRequest(input: { tipoTd: TdRequestTipo; observacao?: string }) {
  const supabase = await createSupabaseServerClient();

  try {
    const tipoNormalizado = input.tipoTd?.toUpperCase() as TdRequestTipo;
    if (!TD_REQUEST_TIPOS.includes(tipoNormalizado)) {
      throw new Error("Tipo de TD inválido.");
    }

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

    const { data: pendingRequest, error: fetchPendingError } = await supabase
      .from("td_requests")
      .select("id")
      .eq("candidate_id", profile.candidate_id)
      .eq("status", "PENDENTE")
      .maybeSingle<{ id: string }>();

    if (fetchPendingError && fetchPendingError.code !== "PGRST116") {
      console.error("[createTdRequest] erro ao buscar TD pendente:", fetchPendingError);
      throw new Error("Não foi possível verificar solicitações anteriores.");
    }

    let mutationError = null;

    if (pendingRequest?.id) {
      const { error } = await supabase
        .from("td_requests")
        .update({
          tipo_td: tipoNormalizado,
          observacao,
          status: "PENDENTE",
          updated_at: now,
        })
        .eq("id", pendingRequest.id);
      mutationError = error;
    } else {
      const { error } = await supabase.from("td_requests").insert({
        candidate_id: profile.candidate_id,
        user_id: user.id,
        tipo_td: tipoNormalizado,
        observacao,
        status: "PENDENTE",
        created_at: now,
        updated_at: now,
      });
      mutationError = error;
    }

    if (mutationError) {
      console.error("Erro ao salvar td_requests:", mutationError);
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
