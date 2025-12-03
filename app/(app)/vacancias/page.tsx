import { redirect } from "next/navigation"

import { VacanciasDashboard } from "@/features/vacancias/VacanciasDashboard"
import { loadVacanciasData } from "@/features/vacancias/loadVacanciasData"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export default async function VacanciasPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const vacanciasData = await loadVacanciasData()

  return <VacanciasDashboard data={vacanciasData} />
}
