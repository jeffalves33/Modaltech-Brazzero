// components/admin/produtos-content.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Edit, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"


export function ProdutosContent() {
  const [activeTab, setActiveTab] = useState("produtos")

  const productsData = [
    { name: "Brazza Bacon", additionals: 7, price: "R$28,00", active: true },
    { name: "Brazza Burger", additionals: 5, price: "R$22,00", active: true },
    { name: "Supremo bacon", additionals: 6, price: "R$38,00", active: true },
    { name: "Supremo bacon", additionals: null, price: "R$24,00", active: true, combo: "Frango Brazza" },
    {
      name: "Refri lata 350ml",
      additionals: null,
      price: "R$24,00",
      active: true,
      types: "5 Tipos",
      extra: "7 Adicionais",
    },
    { name: "Brazza Bacon", price: "R$28,00", active: false },
  ]

  const combosData = [
    { name: "Combo Brazza Bacon", items: "Burger + Fritas + Refri", price: "R$42,00", active: true },
    { name: "Combo Supremo", items: "Burger + Fritas + Refri", price: "R$52,00", active: true },
    { name: "Combo Duo", items: "2 Burgers + 2 Refris", price: "R$68,00", active: true },
    { name: "Combo Família", items: "4 Burgers + 4 Fritas + 4 Refris", price: "R$135,00", active: true },
  ]

  const additionalsData = [
    { name: "Queijo Cheddar", price: "R$3,00", active: true },
    { name: "Bacon Extra", price: "R$4,00", active: true },
    { name: "Ovo", price: "R$2,00", active: true },
    { name: "Cebola Caramelizada", price: "R$3,50", active: true },
    { name: "Molho Especial", price: "R$2,50", active: true },
    { name: "Picles", price: "R$1,50", active: true },
    { name: "Alface e Tomate", price: "R$2,00", active: true },
  ]

  const categoriesData = [
    { name: "Burgers", qtd: 12, active: true },
    { name: "Bebidas", qtd: 8, active: true },
    { name: "Acompanhamentos", qtd: 6, active: true },
    { name: "Sobremesas", qtd: 4, active: true },
    { name: "Molhos", qtd: 5, active: true },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "produtos":
        return renderProducts()
      case "combos":
        return renderCombos()
      case "adicionais":
        return renderAdditionals()
      case "categorias":
        return renderCategories()
      default:
        return renderProducts()
    }
  }

  const renderProducts = () => (
    <>
      <div className="px-4 md:px-6 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">BURGERS</h3>
      </div>
      {productsData.map((product, index) => (
        <div
          key={index}
          className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50"
        >
          <div className="flex flex-wrap items-center gap-2 md:gap-4 flex-1">
            <span className="text-sm font-medium">{product.name}</span>
            {product.combo && <span className="text-sm text-gray-600">{product.combo}</span>}
            {product.additionals && (
              <span className="px-3 py-1 bg-black text-white text-xs rounded-full whitespace-nowrap">
                {product.additionals} Adicionais
              </span>
            )}
            {product.types && (
              <>
                <span className="px-3 py-1 bg-gray-800 text-white text-xs rounded-full">{product.types}</span>
                {product.extra && (
                  <span className="px-3 py-1 bg-gray-800 text-white text-xs rounded-full">{product.extra}</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm font-semibold">{product.price}</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", product.active ? "bg-green-500" : "bg-gray-300")} />
              <span className="text-xs text-gray-600">Ativo</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </>
  )

  const renderCombos = () => (
    <>
      <div className="px-4 md:px-6 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">COMBOS</h3>
      </div>
      {combosData.map((combo, index) => (
        <div
          key={index}
          className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50"
        >
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium">{combo.name}</span>
            <span className="text-xs text-gray-500">{combo.items}</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm font-semibold">{combo.price}</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", combo.active ? "bg-green-500" : "bg-gray-300")} />
              <span className="text-xs text-gray-600">Ativo</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </>
  )

  const renderAdditionals = () => (
    <>
      <div className="px-4 md:px-6 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">ADICIONAIS</h3>
      </div>
      {additionalsData.map((additional, index) => (
        <div
          key={index}
          className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50"
        >
          <span className="text-sm font-medium flex-1">{additional.name}</span>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm font-semibold">{additional.price}</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", additional.active ? "bg-green-500" : "bg-gray-300")} />
              <span className="text-xs text-gray-600">Ativo</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </>
  )

  const renderCategories = () => (
    <>
      <div className="px-4 md:px-6 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">CATEGORIAS</h3>
      </div>
      {categoriesData.map((category, index) => (
        <div
          key={index}
          className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium">{category.name}</span>
            <span className="text-xs text-gray-500">{category.qtd} produtos</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", category.active ? "bg-green-500" : "bg-gray-300")} />
              <span className="text-xs text-gray-600">Ativo</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </>
  )

  return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Pesquisar produtos..." className="pl-10 bg-white" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="w-3 h-3 rounded-full bg-black flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">Taxa de entrega</span>
              <Input defaultValue="R$ 2,00" className="w-24 bg-white text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 md:gap-6 border-b border-gray-200 overflow-x-auto">
          {["Produtos", "Combos", "Adicionais", "Categorias"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.toLowerCase()
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <Card className="bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y">{renderTabContent()}</div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="bg-black text-white hover:bg-gray-800 gap-2 w-full md:w-auto">
            <span className="hidden sm:inline">Adicionar produto</span>
            <span className="sm:hidden">Adicionar</span>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
  )
}
