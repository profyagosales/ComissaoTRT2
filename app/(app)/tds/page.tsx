import { redirect } from "next/navigation"

import { TdsDashboard, type CandidateTdSnapshot, type CurrentCandidateSummary } from "@/features/tds/TdsDashboard"
import { loadTdsData } from "@/features/tds/loadTdsData"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export default async function TdsPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, candidate_id, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle()

  const isComissao = profile?.role === "COMISSAO"

  const tdsData = await loadTdsData()

  let currentCandidate: CurrentCandidateSummary | undefined
  let currentCandidateTd: CandidateTdSnapshot | null = null

  if (profile?.candidate_id) {
    const { data: candidateRow, error: candidateError } = await supabase
      .from("candidates")
      .select("id, nome")
      .eq("id", profile.candidate_id)
      .maybeSingle<{ id: string; nome: string | null }>()

    if (candidateError) {
      console.error("[tds/page] erro ao carregar candidato vinculado", candidateError)
    }

    if (candidateRow?.id && candidateRow?.nome) {
      currentCandidate = {
        id: candidateRow.id,
        nome: candidateRow.nome,
        avatarUrl: profile?.avatar_url ?? null,
      }
    }

    const { data: tdRow, error: tdError } = await supabase
      .from("ultimos_tds_view")
      .select("tipo_td, data_aprovacao")
      .eq("candidate_id", profile.candidate_id)
      .maybeSingle<{ tipo_td: string | null; data_aprovacao: string | null }>()

    if (tdError && tdError.code !== "PGRST116") {
      console.error("[tds/page] erro ao buscar TD do candidato", tdError)
    }

    if (tdRow) {
      currentCandidateTd = {
        tipo: (tdRow.tipo_td as CandidateTdSnapshot["tipo"]) ?? null,
        dataReferencia: tdRow.data_aprovacao ?? null,
      }
    }
  }

  return <TdsDashboard data={tdsData} isComissao={isComissao} currentCandidate={currentCandidate} currentCandidateTd={currentCandidateTd} />
}
