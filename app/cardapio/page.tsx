import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
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
      <main className="container mx-auto">
        <MenuManagement initialItems={menuItems || []} />
      </main>
    </div>
  )
}
