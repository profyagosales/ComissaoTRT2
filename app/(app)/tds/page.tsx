import { redirect } from "next/navigation"

import { TdsDashboard } from "@/features/tds/TdsDashboard"
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
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  const isComissao = profile?.role === "COMISSAO"

  const tdsData = await loadTdsData()

  return <TdsDashboard data={tdsData} isComissao={isComissao} />
}
