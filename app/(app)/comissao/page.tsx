import { redirect } from "next/navigation"

import { ComissaoDashboard } from "@/src/features/comissao/ComissaoDashboard"
import { loadComissaoData } from "@/src/features/comissao/loadComissaoData"
import { createSupabaseServerClient } from "@/src/lib/supabase-server"

export default async function ComissaoPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/comissao")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "COMISSAO") {
    redirect("/resumo")
  }

  const data = await loadComissaoData()

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-red-900/70">Painel da comissão</p>
        <h1 className="text-3xl font-semibold text-red-950">Aprovações pendentes</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Revise solicitações enviadas pelos aprovados. Ao aprovar, os dados são refletidos automaticamente nas listas e no resumo.
        </p>
        <div className="flex gap-4 text-sm">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Outras aprovações</p>
            <p className="text-2xl font-semibold text-red-900">{data.outrasAprovacoes.length}</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">TDs</p>
            <p className="text-2xl font-semibold text-red-900">{data.tdRequests.length}</p>
          </div>
        </div>
      </header>

      <ComissaoDashboard data={data} />
    </div>
  )
}
