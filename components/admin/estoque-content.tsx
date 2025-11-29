// components/admin/estoque-content.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function EstoqueContent() {
  const [activeTab, setActiveTab] = useState("estoque")

  const stockItems = [
    { name: "Bacon", supplier: "Padaria Central", min: "20 Pacotes", status: "low", quantity: "15 PCT." },
    { name: "Batata Frita", supplier: "Padaria Central", min: "10 Pacotes", status: "low", quantity: "5 PCT." },
    { name: "Tempero batata", supplier: "Meli", min: "3 Unidades", status: "low", quantity: "3 UND." },
    { name: "Sal Parrilla", supplier: "Meli", min: "2 Pacotes", status: "ok", quantity: "5 PCT." },
  ]

  const suppliers = [
    { name: "Padaria Central", products: 5, contact: "+55 11 98765-4321" },
    { name: "Meli", products: 3, contact: "+55 11 98765-4321" },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        {["Estoque", "Fornecedores"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.toLowerCase()
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "estoque" ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6">
            <Card className="bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Total de Itens</p>
                <p className="text-3xl font-bold mb-1">156</p>
                <p className="text-xs text-gray-600">Produtos cadastrados</p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Estoquebaixo</p>
                <p className="text-3xl font-bold text-red-600 mb-1">3</p>
                <p className="text-xs text-gray-600">Itens precisam reposição</p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Valor Total</p>
                <p className="text-3xl font-bold mb-1">R$ 8.456</p>
                <p className="text-xs text-gray-600">valor do estoque</p>
              </CardContent>
            </Card>
          </div>

          {/* Stock Table */}
          <Card className="bg-white">
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="px-6 py-3 bg-gray-50">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase">PRODUTOS</h3>
                </div>
                {stockItems.map((item, index) => (
                  <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Fornecedor: {item.supplier} | Mínimo: {item.min}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        {item.status === "low" && (
                          <span className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                            Estoque baixo
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold w-20 text-right">{item.quantity}</span>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <Button className="bg-[#2563eb] text-white hover:bg-blue-700">Renovar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Product Button */}
          <div className="flex justify-end">
            <Button className="bg-black text-white hover:bg-gray-800 gap-2">
              Adicionar produto
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Suppliers List */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">Fornecedores</h2>
              <div className="space-y-4">
                {suppliers.map((supplier, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-gray-500">{supplier.products} produtos fornecidos</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-600">{supplier.contact}</p>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-black text-white hover:bg-gray-800 gap-2">
              Novo fornecedor
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
