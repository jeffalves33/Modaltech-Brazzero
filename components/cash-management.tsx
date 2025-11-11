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
import { Lock, Unlock, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

interface CashManagementProps {
  activeSession: CashSession | null
  recentSessions: CashSession[]
  userId: string
  userName: string
}

interface DayTransaction {
  type: "order" | "expense" | "initial"
  id: string
  description: string
  amount: number
  createdAt: string
  status?: string
}

interface PaymentMethodSummary {
  key: "pix" | "card" | "cash"
  label: string
  count: number
  total: number
}

interface CashClosureSummary {
  date: string
  payments: PaymentMethodSummary[]
  totalOrders: number
  totalSales: number
  totalExpenses: number
  netEntry: number
  cashPrevious: number
  cashSales: number
  cashExpenses: number
  cashCurrent: number
}

export function CashManagement({ activeSession: initialActiveSession, recentSessions, userId }: CashManagementProps) {
  const router = useRouter()
  const [activeSession, setActiveSession] = useState<CashSession | null>(initialActiveSession)
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false)
  const [closureSummary, setClosureSummary] = useState<CashClosureSummary | null>(null)
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
      // Pedidos da sessão por forma de pagamento
      const { data: orders } = await supabase
        .from("orders")
        .select("total, payment_method")
        .eq("cash_session_id", activeSession.id)
        .in("status", ["em_producao", "em_rota", "entregue"])

      const paidOrders = (orders || []) as { total: number; payment_method: string }[]

      const paymentTotals: Record<string, { count: number; total: number }> = {}

      paidOrders.forEach((order) => {
        const method = order.payment_method || "dinheiro"
        if (!paymentTotals[method]) {
          paymentTotals[method] = { count: 0, total: 0 }
        }
        paymentTotals[method].count += 1
        paymentTotals[method].total += order.total
      })

      const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0)
      const totalOrders = paidOrders.length

      const pix = paymentTotals["pix"] || { count: 0, total: 0 }
      const cash = paymentTotals["dinheiro"] || { count: 0, total: 0 }
      const cardDebit = paymentTotals["cartao_debito"] || { count: 0, total: 0 }
      const cardCredit = paymentTotals["cartao_credito"] || { count: 0, total: 0 }
      const card = {
        count: cardDebit.count + cardCredit.count,
        total: cardDebit.total + cardCredit.total,
      }

      // Despesas da sessão por forma de pagamento
      const { data: expenses } = await supabase
        .from("cash_expenses")
        .select("amount, payment_method")
        .eq("cash_session_id", activeSession.id)

      const expensesList = (expenses || []) as { amount: number; payment_method: string | null }[]

      const totalExpenses = expensesList.reduce((sum, exp) => sum + exp.amount, 0)

      const expenseTotalsByMethod: Record<string, number> = {}
      expensesList.forEach((exp) => {
        const method = exp.payment_method || "dinheiro"
        expenseTotalsByMethod[method] = (expenseTotalsByMethod[method] || 0) + exp.amount
      })

      const cashExpenses = expenseTotalsByMethod["dinheiro"] || 0

      const netEntry = totalSales - totalExpenses

      const cashPrevious = activeSession.initial_amount
      const cashSales = cash.total
      const cashCurrent = cashPrevious + cashSales - cashExpenses

      // Atualiza sessão no banco
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

      const summary: CashClosureSummary = {
        date: new Date().toISOString(),
        payments: [
          { key: "pix", label: "PIX", count: pix.count, total: pix.total },
          { key: "card", label: "CARTÃO DE CRÉDITO/DÉBITO", count: card.count, total: card.total },
          { key: "cash", label: "DINHEIRO", count: cash.count, total: cash.total },
        ],
        totalOrders,
        totalSales,
        totalExpenses,
        netEntry,
        cashPrevious,
        cashSales,
        cashExpenses,
        cashCurrent,
      }

      setClosureSummary(summary)
      setIsCloseDialogOpen(false)
      setIsSummaryDialogOpen(true)
    } catch (error) {
      console.error("Error closing cash:", error)
      alert("Erro ao fechar caixa")
    }
  }

  const handleFinishClosure = () => {
    setIsSummaryDialogOpen(false)
    setClosureSummary(null)
    setActiveSession(null)
    setFinalAmount("0.00")
    setNotes("")
    setDayTransactions([])
    router.refresh()
  }

  const handlePrintClosure = () => {
    if (!closureSummary) return

    const pix = closureSummary.payments.find((p) => p.key === "pix")
    const card = closureSummary.payments.find((p) => p.key === "card")
    const cash = closureSummary.payments.find((p) => p.key === "cash")

    const dateStr = formatDateTime(closureSummary.date)
    const format = (value: number) => formatCurrency(value)

    const printWindow = window.open("", "_blank", "width=380,height=600")
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>Fechamento de caixa</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f5eddc;
            }
            .ticket {
              width: 280px;
              margin: 0 auto;
              padding: 16px 18px;
            }
            .brand {
              text-align: center;
              font-size: 20px;
              font-weight: 800;
              letter-spacing: 0.18em;
              margin-bottom: 12px;
            }
            .title {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .meta {
              font-size: 11px;
              margin: 2px 0;
            }
            .line {
              border-bottom: 1px solid #000;
              margin: 10px 0;
            }
            .row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-size: 12px;
              margin: 2px 0;
            }
            .row .count {
              width: 28px;
              font-weight: 600;
            }
            .row .label {
              flex: 1;
              margin: 0 6px;
              text-transform: uppercase;
              font-weight: 600;
            }
            .row .value {
              min-width: 80px;
              text-align: right;
              font-weight: 600;
            }
            .dashed {
              border-bottom: 1px dashed #000;
              margin: 6px 0;
            }
            .negative {
              color: #b91c1c;
            }
            .section-title {
              font-size: 12px;
              font-weight: 600;
              margin-top: 10px;
              margin-bottom: 2px;
            }
            .footer {
              margin-top: 18px;
              text-align: center;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="brand">BRAZZERO</div>

            <div class="title">Fechamento de caixa</div>
            <div class="meta">Realizado em: ${dateStr}</div>
            <div class="meta">Por: <strong>${userName}</strong></div>

            <div class="line"></div>

            <div class="row">
              <span class="count">${pix?.count ?? 0}</span>
              <span class="label">PIX</span>
              <span class="value">${format(pix?.total ?? 0)}</span>
            </div>
            <div class="dashed"></div>
            <div class="row">
              <span class="count">${card?.count ?? 0}</span>
              <span class="label">CARTÃO</span>
              <span class="value">${format(card?.total ?? 0)}</span>
            </div>
            <div class="dashed"></div>
            <div class="row">
              <span class="count">${cash?.count ?? 0}</span>
              <span class="label">DINHEIRO</span>
              <span class="value">${format(cash?.total ?? 0)}</span>
            </div>

            <div class="line"></div>

            <div class="row">
              <span class="label">Despesas</span>
              <span class="value negative">- ${format(closureSummary.totalExpenses)}</span>
            </div>

            <div class="line"></div>

            <div class="section-title">Caixa anterior</div>
            <div class="row">
              <span class="label"></span>
              <span class="value">${format(closureSummary.cashPrevious)}</span>
            </div>

            <div class="section-title">Caixa atual</div>
            <div class="row">
              <span class="label"></span>
              <span class="value">${format(closureSummary.cashCurrent)}</span>
            </div>

            <div class="footer">
              Bom apetite!<br />
              @brazzeroburger_
            </div>
          </div>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()

    handleFinishClosure()
  }

  return (
    <div className="space-y-6">
      {activeSession ? (
        <>
          <Card className="">
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
                            {transaction.type === "expense" && <TrendingDown className="h-5 w-5 text-red-500" />}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt)}</p>
                            </div>
                          </div>
                          <p
                            className={`font-bold text-right ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"
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
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Saldo Esperado</p>
                      <p className="font-bold text-lg">
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

          {closureSummary && (
            <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg">
                <DialogHeader className="pb-2">
                  <DialogTitle>Fechamento de caixa</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(closureSummary.date)}
                  </p>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="border rounded-2xl p-4 bg-muted/40">
                    <div className="grid grid-cols-[60px,1fr,120px] text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pb-2">
                      <span>Vendas</span>
                      <span>Forma de pagamento</span>
                      <span className="text-right">Valor total</span>
                    </div>

                    {closureSummary.payments.map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-[60px,1fr,120px] items-center py-2 border-t"
                      >
                        <span className="text-sm font-semibold">
                          {row.count || "--"}
                        </span>
                        <span className="text-sm font-semibold">
                          {row.label}
                        </span>
                        <span className="text-sm text-right font-semibold">
                          {formatCurrency(row.total)}
                        </span>
                      </div>
                    ))}

                    <div className="grid grid-cols-[60px,1fr,120px] items-center py-2 border-t text-red-600">
                      <span className="text-sm font-semibold">--</span>
                      <span className="text-sm font-semibold uppercase">
                        Despesas de hoje
                      </span>
                      <span className="text-sm text-right font-semibold">
                        - {formatCurrency(closureSummary.totalExpenses)}
                      </span>
                    </div>

                    <div className="grid grid-cols-[60px,1fr,120px] items-center py-3 border-t mt-1">
                      <span className="text-base font-bold">
                        {closureSummary.totalOrders}
                      </span>
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Saldo entrada
                      </span>
                      <span className="text-base font-bold text-right">
                        {formatCurrency(closureSummary.netEntry)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Caixa anterior</span>
                      <span className="font-medium">
                        {formatCurrency(closureSummary.cashPrevious)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Caixa atual</span>
                      <span className="font-semibold">
                        {formatCurrency(closureSummary.cashCurrent)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={handleFinishClosure}
                    >
                      Fechar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handlePrintClosure}
                    >
                      Imprimir
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
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
                    <p className="font-semibold">
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
