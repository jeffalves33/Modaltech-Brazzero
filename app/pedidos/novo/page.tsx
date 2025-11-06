import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Navigation } from "@/components/navigation"
import { OrderFlowSteps } from "@/components/order-flow-steps"

export default async function NewOrderPage() {
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

  // Load menu items
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_available", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <Navigation />
      <main className="container py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Novo Pedido</h2>
          <p className="text-muted-foreground">Fluxo passo a passo para criar um novo pedido</p>
        </div>
        <OrderFlowSteps menuItems={menuItems || []} userId={user.id} />
      </main>
    </div>
  )
}
