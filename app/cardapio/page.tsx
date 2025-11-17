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
    console.log("aqui")
    redirect("/auth/login")
  }

  const { data: menuItems } = await supabase.from("menu_items").select("*").in("is_archived",["FALSE"]).order("category").order("name")
  const { data: menuAddons } = await supabase.from("menu_addons").select("*").in("is_active",["TRUE"]).order("name")
  const { data: inventoryItems } = await supabase.from("inventory_items").select("id, name, unit").order("name")

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto">
        <MenuManagement
          initialItems={menuItems || []}
          initialAddons={menuAddons || []}
          inventoryItems={inventoryItems || []}
        />
      </main>
    </div>
  )
}
