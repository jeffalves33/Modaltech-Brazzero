// components/admin/cmv-analytics-content.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function CMVAnalyticsContent() {
  const [activeTab, setActiveTab] = useState("mensal")

  const products = [
    { name: "Brazza Bacon", cost: "R$ 8.50", price: "R$ 18.90", margin: "55%", color: "text-green-600" },
    { name: "Brazza Bacon", cost: "R$ 8.50", price: "R$ 18.90", margin: "55%", color: "text-green-600" },
    { name: "Brazza Bacon", cost: "R$ 8.50", price: "R$ 18.90", margin: "35%", color: "text-orange-600" },
    { name: "Brazza Bacon", cost: "R$ 8.50", price: "R$ 18.90", margin: "55%", color: "text-green-600" },
    { name: "Brazza Bacon", cost: "R$ 8.50", price: "R$ 18.90", margin: "55%", color: "text-green-600" },
  ]

  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">CMV Analytics</h1>

        {/* Period Tabs */}
        <div className="flex gap-3">
          {["Semanal", "Mensal", "Anual"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.toLowerCase() ? "bg-gray-200 text-black" : "bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">CMV Mensal</p>
              <p className="text-3xl font-bold mb-1">R$ 8.456,78</p>
              <p className="text-xs text-gray-600">Janeiro 2025</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Margem Bruta</p>
              <p className="text-3xl font-bold text-green-600 mb-1">65%</p>
              <p className="text-xs text-gray-600">+3% vs mês anterior</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-2">Ticket Médio</p>
              <p className="text-3xl font-bold mb-1">R$ 32,45</p>
              <p className="text-xs text-gray-600">+R$ 2,10 vs mês anterior</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Analysis */}
        <Card className="bg-white">
          <CardContent className="p-0">
            <div className="divide-y">
              <div className="px-6 py-3 bg-gray-50">
                <h3 className="text-xs font-semibold text-gray-600 uppercase">ANÁLISE POR PRODUTO</h3>
              </div>
              {products.map((product, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      Custo: {product.cost} | Venda: {product.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={cn("text-sm font-semibold", product.color)}>Margem</span>
                    <span className={cn("text-lg font-bold", product.color)}>{product.margin}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
