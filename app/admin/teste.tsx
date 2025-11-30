// components/admin/dashboard-content.tsx
"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function DashboardContent() {
  const mostSold = [
    { rank: 1, name: "Brazza Bacon", change: null, sales: "152/mês", badge: true },
    { rank: 2, name: "Frango Brazza", change: "+12%", sales: "95/mês", badge: true },
    { rank: 3, name: "Brazza Duo", change: "-5%", sales: "95/mês", badge: true },
    { name: "Supremo bacon", sales: "95/mês" },
    { name: "Coca lata 350ml", sales: "95/mês" },
    { name: "Coca lata 350ml", sales: "95/mês" },
    { name: "Coca lata 350ml", sales: "95/mês" },
    { name: "Coca lata 350ml", sales: "95/mês" },
    { name: "Coca lata 350ml", sales: "95/mês" },
  ]

  const lowStock = [
    { name: "Bacon em Tiras", quantity: "05 Pct." },
    { name: "Queijo Fatiado", quantity: "07 Pct." },
    { name: "Tempero p/ Batata", quantity: "05 Unid." },
    { name: "Carvão", quantity: "20 Pct." },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Vendas últimas 24h</p>
            <p className="text-3xl font-bold mb-1">R$ 1.234,56</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12% em relação a última 24h
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">CMV Mensal</p>
            <p className="text-3xl font-bold mb-1">R$ 8.456,78</p>
            <p className="text-xs text-red-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              -5% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Despesas</p>
            <p className="text-3xl font-bold mb-1">156</p>
            <p className="text-xs text-red-600">
              <span className="font-semibold">3 itens</span> com estoque baixo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Clientes Ativos</p>
            <p className="text-3xl font-bold mb-1">89</p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">+7</span> novos esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Most Sold */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4">Mais vendidos</h2>
            <div className="space-y-3">
              {mostSold.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {item.rank && (
                      <div
                        className={cn(
                          "w-8 h-8 rounded flex items-center justify-center text-xs font-bold",
                          item.rank === 1
                            ? "bg-orange-500 text-white"
                            : item.rank === 2
                              ? "bg-orange-400 text-white"
                              : "bg-gray-300 text-gray-700",
                        )}
                      >
                        {String(item.rank).padStart(2, "0")}
                      </div>
                    )}
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.change && (
                      <span
                        className={cn(
                          "text-xs flex items-center gap-0.5",
                          item.change.startsWith("+") ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {item.change.startsWith("+") ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {item.change}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">{item.sales}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4">Produtos com Estoque Baixo</h2>
            <div className="space-y-3">
              {lowStock.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-red-600 font-semibold">{item.quantity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
