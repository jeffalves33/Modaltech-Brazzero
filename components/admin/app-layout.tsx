// components/admin/app-layout.tsx
"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  FileText,
  MoreVertical,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const base = "/admin"
  const navItems = [
    { label: "GERAL", items: [{ name: "Dashboard", href: `${base}`, icon: Home }] },
    {
      label: "PRODUTOS & ESTOQUE",
      items: [
        { name: "Produtos", href: `${base}/produtos`, icon: ShoppingCart },
        { name: "Estoque", href: `${base}/estoque`, icon: Package },
        { name: "Fornecedores", href: `${base}/fornecedores`, icon: Users },
      ],
    },
    {
      label: "FINANCEIRO",
      items: [
        { name: "CMV Analytics", href: `${base}/cmv-analytics`, icon: TrendingUp },
        { name: "Despesas", href: `${base}/despesas`, icon: FileText },
        { name: "Financeiro", href: `${base}/financeiro`, icon: DollarSign },
      ],
    },
    {
      label: "FUNCIONÁRIOS",
      items: [{ name: "Colaboradores", href: `${base}/colaboradores`, icon: Users }],
    },
  ]

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 h-[73px] flex items-center justify-between px-4 md:px-8 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h2 className="text-xl md:text-2xl font-bold">BRAZZERO</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300" />
          <span className="text-xs md:text-sm font-medium hidden sm:inline">Saulo Souza (Admin)</span>
          <button className="hidden md:block">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <aside
        className={cn(
          "w-[232px] bg-[#1a1a1a] text-white flex flex-col fixed top-[73px] h-[calc(100vh-73px)] transition-transform duration-300 z-40",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {navItems.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold text-gray-400 mb-3 px-3">{section.label}</p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isActive ? "bg-[#2563eb] text-white" : "text-gray-300 hover:bg-[#2a2a2a]",
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-[#2a2a2a] w-full">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden top-[73px]" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex-1 lg:ml-[232px] w-full">
        <main className="pt-[73px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
