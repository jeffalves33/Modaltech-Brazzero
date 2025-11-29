// components/admin/despesas-content.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function DespesasContent() {
  const [activeTab, setActiveTab] = useState("fixos")

  const expenses = [
    { name: "Energia Elétrica", due: "01/11", status: "atrasada", amount: "R$350 - R$450" },
    { name: "Aluguel", due: "05/11", status: "pagar", amount: "R$3.000,00" },
    { name: "Água", due: "06/11", status: "pagar", amount: "R$80 - R$150" },
    { name: "Salário Jenário", due: "02/11", status: "pago", amount: "R$1.200,00" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Despesas</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Custos fixos</p>
            <p className="text-3xl font-bold mb-1">R$ 3.450</p>
            <p className="text-xs text-gray-600">Este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Custos Variáveis</p>
            <p className="text-3xl font-bold mb-1">R$ 2.450</p>
            <p className="text-xs text-gray-600">Este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total Despesas</p>
            <p className="text-3xl font-bold text-red-600 mb-1">R$ 5.630</p>
            <p className="text-xs text-gray-600">este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        {["Custos Fixos", "Custos Variáveis"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab === "Custos Fixos" ? "fixos" : "variaveis")}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              (tab === "Custos Fixos" && activeTab === "fixos") ||
                (tab === "Custos Variáveis" && activeTab === "variaveis")
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <Card className="bg-white">
        <CardContent className="p-0">
          <div className="divide-y">
            {expenses.map((expense, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{expense.name}</p>
                  <p className="text-xs text-gray-500">Vence em {expense.due}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "px-3 py-1 text-xs rounded-full font-medium",
                      expense.status === "atrasada"
                        ? "bg-red-100 text-red-600"
                        : expense.status === "pagar"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600",
                    )}
                  >
                    {expense.status === "atrasada" ? "Atrasada" : expense.status === "pagar" ? "A pagar" : "Pago"}
                  </span>
                  <span className="text-sm font-semibold w-32 text-right">{expense.amount}</span>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  {expense.status !== "pago" && (
                    <Button className="bg-[#2563eb] text-white hover:bg-blue-700">Confirmar pagamento</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Button */}
      <div className="flex justify-end">
        <Button className="bg-black text-white hover:bg-gray-800 gap-2">
          Nova despesa fixa
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
