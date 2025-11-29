// app/admin/layout.tsx
import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/admin/app-layout"

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login")
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, name, role")
    .eq("id", authUser.id)
    .single()

  if (!user) {
    redirect("/auth/login")
  }

  // 🔑 Só ADMIN pode usar /admin
  if (user.role !== "admin") {
    redirect("/") // colaborador vai para a home atual
  }

  // AppLayout é o layout do admin (sidebar, etc)
  return <AppLayout>{children}</AppLayout>
}
