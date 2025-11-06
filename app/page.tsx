import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Navigation } from "@/components/navigation"
import { OrdersKanban } from "@/components/orders-kanban"

export default async function DashboardPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <Navigation />
      <main className="container py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Pedidos</h2>
          <p className="text-muted-foreground">Gerencie os pedidos em tempo real</p>
        </div>
        <OrdersKanban />
      </main>
    </div>
  )
}
