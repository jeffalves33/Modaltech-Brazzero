// app/admin/produtos/page.tsx
import { ProdutosContent } from "@/components/admin/produtos-content"
import { createClient } from "@/lib/supabase/server"

export default async function ProdutosPage() {
  const supabase = await createClient()

  const { data: menuItems } = await supabase.from("menu_items").select("*").in("is_archived", ["FALSE"]).order("category").order("name")
  const { data: menuAddons } = await supabase.from("menu_addons").select("*").in("is_active", ["TRUE"]).order("name")
  const { data: inventoryItems } = await supabase.from("inventory_items").select("id, name, unit").order("name")

  return <ProdutosContent
    initialItems={menuItems || []}
    initialAddons={menuAddons || []}
    inventoryItems={inventoryItems || []}
  />
}
