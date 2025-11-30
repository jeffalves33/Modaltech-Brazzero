// app/caixa/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { CashManagement } from "@/components/cash-management"

export default async function CashPage() {
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

  // Get active cash session
  const { data: activeSessions } = await supabase
    .from("cash_sessions")
    .select("*")
    .is("closed_at", null)
    .order("opened_at", { ascending: false })
    .limit(1)

  const activeSession = activeSessions && activeSessions.length > 0 ? activeSessions[0] : null

  // Get recent closed sessions
  const { data: recentSessions } = await supabase
    .from("cash_sessions")
    .select("*")
    .not("closed_at", "is", null)
    .order("closed_at", { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto">
        <CashManagement
          activeSession={activeSession}
          recentSessions={recentSessions || []}
          userId={user.id}
          userName={user.name}
        />
      </main>
    </div>
  )
}
