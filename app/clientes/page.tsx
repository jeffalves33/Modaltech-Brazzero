import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { ClientsManagement } from "@/components/clients-management"

export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !authUser) {
    redirect("/auth/login")
  }

  const { data: user } = await supabase.from("users").select("*").eq("id", authUser.id).single()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: customers } = await supabase.from("customers").select("*").order("name")

  const { data: activeSessions } = await supabase
    .from("cash_sessions")
    .select("*")
    .is("closed_at", null)
    .order("opened_at", { ascending: false })
    .limit(1)

  const activeSession = activeSessions && activeSessions.length > 0 ? activeSessions[0] : null

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Clientes</h2>
          <p className="text-muted-foreground">Visualize, edite e gerencie seus clientes</p>
        </div>
        <ClientsManagement initialCustomers={customers || []} activeSession={activeSession} />
      </main>
    </div>
  )
}
