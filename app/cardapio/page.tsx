import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Navigation } from "@/components/navigation"
import { MenuManagement } from "@/components/menu-management"

export default async function MenuPage() {
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

  const { data: menuItems } = await supabase.from("menu_items").select("*").order("category").order("name")

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <Navigation />
      <main className="container py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Cardápio</h2>
          <p className="text-muted-foreground">Adicione, edite ou remova itens do cardápio</p>
        </div>
        <MenuManagement initialItems={menuItems || []} />
      </main>
    </div>
  )
}
