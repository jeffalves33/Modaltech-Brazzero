// components/admin/dashboard-content.tsx
"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

type MostSoldItem = {
  rank?: number
  name: string
  change: string | null
  sales: string
}

type LowStockItem = {
  name: string
  quantity: string
}

interface DashboardContentProps {
  salesLast24h: number
  salesLast24hDiff: number | null
  monthlyRevenue: number
  monthlyRevenueDiff: number | null
  monthlyExpenses: number
  monthlyExpensesCount: number
  activeCustomers: number
  newCustomersWeek: number
  mostSold: MostSoldItem[]
  lowStock: LowStockItem[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(isNaN(value) ? 0 : value)

const formatPercentChange = (value: number | null) => {
  if (value === null || isNaN(value)) return null
  const rounded = Number(value.toFixed(1))
  const sign = rounded > 0 ? "+" : ""
  return `${sign}${rounded}%`
}

export function DashboardContent({
  salesLast24h,
  salesLast24hDiff,
  monthlyRevenue,
  monthlyRevenueDiff,
  monthlyExpenses,
  monthlyExpensesCount,
  activeCustomers,
  newCustomersWeek,
  mostSold,
  lowStock,
}: DashboardContentProps) {
  const vendas24hStr = formatCurrency(salesLast24h)
  const vendas24hDiffStr = formatPercentChange(salesLast24hDiff)
  const vendas24hPositivo = (salesLast24hDiff ?? 0) >= 0

  const receitaMensalStr = formatCurrency(monthlyRevenue)
  const receitaMensalDiffStr = formatPercentChange(monthlyRevenueDiff)
  const receitaMensalPositiva = (monthlyRevenueDiff ?? 0) >= 0

  const despesasMensalStr = formatCurrency(monthlyExpenses)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Cards de topo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Vendas últimas 24h */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Vendas últimas 24h</p>
            <p className="text-3xl font-bold mb-1">{vendas24hStr}</p>
            {vendas24hDiffStr ? (
              <p
                className={cn(
                  "text-xs flex items-center gap-1",
                  vendas24hPositivo ? "text-green-600" : "text-red-600",
                )}
              >
                {vendas24hPositivo ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {vendas24hDiffStr} em relação às últimas 24h
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Sem comparação com o período anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* "CMV Mensal" (por enquanto Receita Mensal) */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">CMV Mensal</p>
            <p className="text-3xl font-bold mb-1">{receitaMensalStr}</p>
            {receitaMensalDiffStr ? (
              <p
                className={cn(
                  "text-xs flex items-center gap-1",
                  receitaMensalPositiva ? "text-green-600" : "text-red-600",
                )}
              >
                {receitaMensalPositiva ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {receitaMensalDiffStr} em relação ao mês passado
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Sem comparação com o mês anterior
              </p>
            )}
          </CardContent>
        </Card>

        {/* Despesas do mês */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Despesas (mês)</p>
            <p className="text-3xl font-bold mb-1">{despesasMensalStr}</p>
            <p className="text-xs text-gray-600">
              {monthlyExpensesCount} lançamentos de despesa
            </p>
          </CardContent>
        </Card>

        {/* Clientes ativos */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Clientes Ativos</p>
            <p className="text-3xl font-bold mb-1">{activeCustomers}</p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">+{newCustomersWeek}</span> novos
              esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção inferior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mais vendidos */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4">Mais vendidos</h2>
            <div className="space-y-3">
              {mostSold.length === 0 && (
                <p className="text-sm text-gray-500">
                  Nenhuma venda registrada no período.
                </p>
              )}

              {mostSold.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
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
                          item.change.startsWith("+")
                            ? "text-green-600"
                            : "text-red-600",
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

        {/* Produtos com estoque baixo */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-4">
              Produtos com Estoque Baixo
            </h2>
            <div className="space-y-3">
              {lowStock.length === 0 && (
                <p className="text-sm text-gray-500">
                  Nenhum item com estoque abaixo do mínimo.
                </p>
              )}

              {lowStock.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-red-600 font-semibold">
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
