// components/admin/colaboradores-content.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Edit, Trash2, Plus } from "lucide-react"

export function ColaboradoresContent() {
  const employees = [
    {
      name: "Jenário da Matta",
      role: "Operação",
      since: "Desde 05/02/24",
      phone: "(33) 98511-1575",
      email: "jenariosmatta@gmail.com",
      salary: "R$ 1.200,00",
    },
    {
      name: "Jenário da Matta",
      role: "Operação",
      since: "Desde 05/02/24",
      phone: "(33) 98511-1575",
      email: "jenariosmatta@gmail.com",
      salary: "R$ 1.200,00",
    },
    {
      name: "Jenário da Matta",
      role: "Operação",
      since: "Desde 05/02/24",
      phone: "(33) 98511-1575",
      email: "jenariosmatta@gmail.com",
      salary: "R$ 1.200,00",
    },
    {
      name: "Jenário da Matta",
      role: "Operação",
      since: "Desde 05/02/24",
      phone: "(33) 98511-1575",
      email: "jenariosmatta@gmail.com",
      salary: "R$ 1.200,00",
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Colaboradores</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total de colaboradores</p>
            <p className="text-3xl font-bold mb-1">6</p>
            <p className="text-xs text-gray-600">0 novos este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total de salários</p>
            <p className="text-3xl font-bold text-red-600 mb-1">R$ 8.234,56</p>
            <p className="text-xs text-gray-600">Aumento em 33,5% este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Média salarial</p>
            <p className="text-3xl font-bold mb-1">R$ 950,00</p>
            <p className="text-xs text-gray-600">Aumento em 13,5% este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Employees List */}
      <Card className="bg-white">
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="px-6 py-3 bg-gray-50">
              <h3 className="text-xs font-semibold text-gray-600 uppercase">RELAÇÃO DE COLABORADORES</h3>
            </div>
            {employees.map((employee, index) => (
              <div key={index} className="px-6 py-4 flex items-center gap-6 hover:bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{employee.name}</p>
                  <p className="text-xs text-gray-500">
                    {employee.role} {employee.since}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Salário</p>
                    <p className="text-sm font-semibold">{employee.salary}</p>
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
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Button */}
      <div className="flex justify-end">
        <Button className="bg-black text-white hover:bg-gray-800 gap-2">
          Novo colaborador
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
