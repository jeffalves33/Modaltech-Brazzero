// components/admin/financeiro-content.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Edit } from "lucide-react"

export function FinanceiroContent() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financeiro</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Receita Mensal</p>
            <p className="text-3xl font-bold text-green-600 mb-1">R$ 24.567,89</p>
            <p className="text-xs text-gray-600">+15% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Lucro Líquido</p>
            <p className="text-3xl font-bold text-green-600 mb-1">R$ 8.234,56</p>
            <p className="text-xs text-gray-600">Margem: 33,5%</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Despesas</p>
            <p className="text-3xl font-bold text-red-600 mb-1">R$17.6765,79</p>
            <p className="text-xs text-gray-600">66,5% da receita</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">EBITDA</p>
            <p className="text-3xl font-bold mb-1">R$ 9.567,89</p>
            <p className="text-xs text-gray-600">38,9% da receita</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-6">Breakdown de Custos</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="text-sm font-medium mb-1">Salários</p>
                  <p className="text-xs text-gray-500">34,4% da receita</p>
                </div>
                <p className="text-sm font-semibold">R$ 8456.78</p>
              </div>
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <p className="text-sm font-medium mb-1">Custos fixa</p>
                  <p className="text-xs text-gray-500">34,4% da receita</p>
                </div>
                <p className="text-sm font-semibold">R$ 8456.78</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">Custos variáveis</p>
                  <p className="text-xs text-gray-500">34,4% da receita</p>
                </div>
                <p className="text-sm font-semibold">R$ 8456.78</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold mb-6">Métricas de Performance</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Margem Bruta</span>
                  <span className="text-sm font-bold">65,60%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: "65.6%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Margem Líquida</span>
                  <span className="text-sm font-bold">35,60%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: "35.6%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">ROI Mensal</span>
                  <span className="text-sm font-bold">24,60%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: "24.6%" }} />
                </div>
              </div>
            </div>

            {/* Financial Goals */}
            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Payout</p>
                <p className="text-sm font-semibold">R$ 16.333,33 (66,5%)</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Break-even</p>
                <p className="text-sm font-semibold">R$ 18.500,00</p>
              </div>
              <div className="text-center flex items-center justify-center gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Meta mensal</p>
                  <p className="text-sm font-semibold">R$ 30.000,00</p>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Edit className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
