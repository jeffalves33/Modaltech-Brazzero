"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { CashSession, CashExpense } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { Plus, Trash2, AlertCircle } from "lucide-react"

interface ExpensesManagementProps {
  activeSession: CashSession | null
  initialExpenses: CashExpense[]
  userId: string
}

export function ExpensesManagement({ activeSession, initialExpenses, userId }: ExpensesManagementProps) {
  const [expenses, setExpenses] = useState<CashExpense[]>(initialExpenses)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
  })

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSession) return

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from("cash_expenses")
        .insert({
          cash_session_id: activeSession.id,
          description: formData.description,
          amount: Number.parseFloat(formData.amount),
          category: formData.category || null,
          created_by: userId,
        })
        .select()
        .single()

      if (error) throw error

      setExpenses([data, ...expenses])
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error creating expense:", error)
      alert("Erro ao registrar despesa")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return

    const supabase = createClient()
    const { error } = await supabase.from("cash_expenses").delete().eq("id", id)

    if (error) {
      console.error("Error deleting expense:", error)
      alert("Erro ao excluir despesa")
      return
    }

    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  if (!activeSession) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Abra o caixa para registrar despesas do expediente.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Total de Despesas</CardTitle>
            <span className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Despesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Despesa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Compra de ingredientes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Ingredientes, Manutenção, etc"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                    Registrar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Despesas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada</p>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{expense.description}</h4>
                    {expense.category && <p className="text-sm text-muted-foreground">{expense.category}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(expense.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-red-600">{formatCurrency(expense.amount)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
