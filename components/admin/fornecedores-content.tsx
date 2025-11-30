// components/admin/estoque-content.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Plus } from "lucide-react"

export function FornecedoresContent() {
    const suppliers = [
        { name: "Padaria Central", products: 5, contact: "+55 11 98765-4321" },
        { name: "Meli", products: 3, contact: "+55 11 98765-4321" },
    ]

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Fornecedores</h1>
            {/* Suppliers List */}
            <Card className="bg-white">
                <CardContent className="p-6">
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
        </div>
    )
}
