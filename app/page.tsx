// app/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function RootRouterPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  // não logado → login
  if (authError || !authUser) {
    redirect("/auth/login")
  }

  // pega o perfil na public.users
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single()

  if (profileError || !profile) {
    redirect("/auth/login")
  }

  const role = String(profile.role || "").toLowerCase()

  if (role === "admin") {
    redirect("/admin")
  }

  // qualquer outro papel vai para o fluxo do colaborador
  redirect("/caixa")
}