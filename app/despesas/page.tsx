import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { ExpensesManagement } from "@/components/expenses-management"

export default async function ExpensesPage() {
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

  // Get expenses for active session
  const { data: expenses } = activeSession
    ? await supabase
        .from("cash_expenses")
        .select("*")
        .eq("cash_session_id", activeSession.id)
        .order("created_at", { ascending: false })
    : { data: [] }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto">
        <ExpensesManagement activeSession={activeSession} initialExpenses={expenses || []} userId={user.id} />
      </main>
    </div>
  )
}
