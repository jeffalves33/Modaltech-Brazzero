"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { CashSession, CashExpense } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { Lock, Unlock, ShoppingCart, Trash2, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

interface CashManagementProps {
  activeSession: CashSession | null
  recentSessions: CashSession[]
  userId: string
}

interface DayTransaction {
  type: "order" | "expense" | "initial"
  id: string
  description: string
  amount: number
  createdAt: string
  status?: string
}

export function CashManagement({ activeSession: initialActiveSession, recentSessions, userId }: CashManagementProps) {
  const router = useRouter()
  const [activeSession, setActiveSession] = useState<CashSession | null>(initialActiveSession)
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [initialAmount, setInitialAmount] = useState("0.00")
  const [finalAmount, setFinalAmount] = useState("0.00")
  const [notes, setNotes] = useState("")
  const [dayTransactions, setDayTransactions] = useState<DayTransaction[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (activeSession) {
      loadDayTransactions()
    }
  }, [activeSession])

  const loadDayTransactions = async () => {
    if (!activeSession) return

    const transactions: DayTransaction[] = []

    transactions.push({
      type: "initial",
      id: activeSession.id,
      description: "Saldo inicial do caixa",
      amount: activeSession.initial_amount,
      createdAt: activeSession.opened_at,
    })

    const { data: orders } = await supabase
      .from("orders")
      .select("id, customer_id, total, status, created_at, customers(name)")
      .eq("cash_session_id", activeSession.id)
      .order("created_at", { ascending: false })

    orders?.forEach((order: any) => {
      transactions.push({
        type: "order",
        id: order.id,
        description: `Pedido #${order.id.slice(0, 8)} - ${order.customers?.name}`,
        amount: order.total,
        createdAt: order.created_at,
        status: order.status,
      })
    })

    const { data: expenses } = await supabase
      .from("cash_expenses")
      .select("*")
      .eq("cash_session_id", activeSession.id)
      .order("created_at", { ascending: false })

    expenses?.forEach((expense: CashExpense) => {
      transactions.push({
        type: "expense",
        id: expense.id,
        description: `Despesa: ${expense.description}`,
        amount: -expense.amount,
        createdAt: expense.created_at,
      })
    })

    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setDayTransactions(transactions)
  }

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase
        .from("cash_sessions")
        .insert({
          opened_by: userId,
          initial_amount: Number.parseFloat(initialAmount),
        })
        .select()
        .single()

      if (error) throw error

      setActiveSession(data)
      setIsOpenDialogOpen(false)
      setInitialAmount("0.00")
      router.refresh()
    } catch (error) {
      console.error("Error opening cash:", error)
      alert("Erro ao abrir caixa")
    }
  }

  const handleCloseCash = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSession) return

    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("total")
        .eq("cash_session_id", activeSession.id)
        .in("status", ["em_producao", "em_rota", "entregue"])

      const totalSales = orders?.reduce((sum, order) => sum + order.total, 0) || 0

      const { data: expenses } = await supabase
        .from("cash_expenses")
        .select("amount")
        .eq("cash_session_id", activeSession.id)

      const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0

      const { error } = await supabase
        .from("cash_sessions")
        .update({
          closed_at: new Date().toISOString(),
          closed_by: userId,
          final_amount: Number.parseFloat(finalAmount),
          total_sales: totalSales,
          total_expenses: totalExpenses,
          notes: notes || null,
        })
        .eq("id", activeSession.id)

      if (error) throw error

      setActiveSession(null)
      setIsCloseDialogOpen(false)
      setFinalAmount("0.00")
      setNotes("")
      setDayTransactions([])
      router.refresh()
    } catch (error) {
      console.error("Error closing cash:", error)
      alert("Erro ao fechar caixa")
    }
  }

  return (
    <div className="space-y-6">
      {activeSession ? (
        <>
          <Card className="border-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Unlock className="h-5 w-5 text-green-500" />
                  Caixa Aberto
                </CardTitle>
                <Badge className="bg-green-500">Ativo</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Aberto em</p>
                  <p className="font-medium">{formatDateTime(activeSession.opened_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor inicial</p>
                  <p className="font-medium">{formatCurrency(activeSession.initial_amount)}</p>
                </div>
              </div>

              <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    <Lock className="mr-2 h-4 w-4" />
                    Fechar Caixa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fechar Caixa</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCloseCash} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="finalAmount">Valor final no caixa (R$) *</Label>
                      <Input
                        id="finalAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={finalAmount}
                        onChange={(e) => setFinalAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => setIsCloseDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                        Fechar Caixa
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Movimentação do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="orders">Pedidos</TabsTrigger>
                  <TabsTrigger value="expenses">Despesas</TabsTrigger>
                  <TabsTrigger value="summary">Resumo</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dayTransactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação</p>
                    ) : (
                      dayTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            {transaction.type === "initial" && <TrendingUp className="h-5 w-5 text-blue-500" />}
                            {transaction.type === "order" && <ShoppingCart className="h-5 w-5 text-green-500" />}
                            {transaction.type === "expense" && <Trash2 className="h-5 w-5 text-red-500" />}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt)}</p>
                            </div>
                          </div>
                          <p
                            className={`font-bold text-right ${
                              transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.amount >= 0 ? "+" : ""}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="space-y-3">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dayTransactions
                      .filter((t) => t.type === "order")
                      .map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt)}</p>
                          </div>
                          <p className="font-bold text-green-600">+{formatCurrency(transaction.amount)}</p>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="expenses" className="space-y-3">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dayTransactions
                      .filter((t) => t.type === "expense")
                      .map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt)}</p>
                          </div>
                          <p className="font-bold text-red-600">{formatCurrency(transaction.amount)}</p>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="space-y-3">
                  <div className="grid gap-3">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                      <p className="font-bold text-lg">{formatCurrency(activeSession.initial_amount)}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total de Vendas</p>
                      <p className="font-bold text-lg text-green-600">
                        +
                        {formatCurrency(
                          dayTransactions.filter((t) => t.type === "order").reduce((s, t) => s + t.amount, 0),
                        )}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total de Despesas</p>
                      <p className="font-bold text-lg text-red-600">
                        {formatCurrency(
                          dayTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
                        )}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg bg-orange-50">
                      <p className="text-sm text-muted-foreground">Saldo Esperado</p>
                      <p className="font-bold text-lg text-orange-600">
                        {formatCurrency(
                          activeSession.initial_amount +
                            dayTransactions.filter((t) => t.type === "order").reduce((s, t) => s + t.amount, 0) +
                            dayTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
                        )}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Caixa Fechado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Unlock className="mr-2 h-4 w-4" />
                  Abrir Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Caixa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleOpenCash} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialAmount">Valor inicial no caixa (R$) *</Label>
                    <Input
                      id="initialAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={initialAmount}
                      onChange={(e) => setInitialAmount(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Informe o valor em dinheiro disponível no início do expediente
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setIsOpenDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                      Abrir Caixa
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Caixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{formatDateTime(session.closed_at!)}</p>
                    <p className="text-sm text-muted-foreground">
                      Inicial: {formatCurrency(session.initial_amount)} | Final:{" "}
                      {formatCurrency(session.final_amount || 0)}
                    </p>
                    {session.total_sales !== null && (
                      <p className="text-sm text-muted-foreground">
                        Vendas: {formatCurrency(session.total_sales)} | Despesas:{" "}
                        {formatCurrency(session.total_expenses || 0)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">
                      {formatCurrency((session.final_amount || 0) - session.initial_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Diferença</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
