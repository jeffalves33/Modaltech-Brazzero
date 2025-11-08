import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
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

  // Load available addons
  const { data: menuAddons } = await supabase
    .from("menu_addons")
    .select("*")
    .eq("is_available", true)
    .order("name", { ascending: true })

  // Load which addons each item allows
  const { data: menuItemAddons } = await supabase
    .from("menu_item_addons")
    .select("menu_item_id, menu_addon_id")

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto">
        <OrderFlowSteps
          menuItems={menuItems || []}
          menuAddons={menuAddons || []}
          menuItemAddons={menuItemAddons || []}
          userId={user.id} />
      </main>
    </div>
  )
}
