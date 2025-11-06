"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Plus, UtensilsCrossed, Wallet, Receipt, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navigation() {
  const pathname = usePathname()

  const links = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/pedidos/novo",
      label: "Novo Pedido",
      icon: Plus,
    },
    {
      href: "/clientes",
      label: "Clientes",
      icon: Users,
    },
    {
      href: "/cardapio",
      label: "Cardápio",
      icon: UtensilsCrossed,
    },
    {
      href: "/caixa",
      label: "Caixa",
      icon: Wallet,
    },
    {
      href: "/despesas",
      label: "Despesas",
      icon: Receipt,
    },
  ]

  return (
    <nav className="border-b bg-muted/40">
      <div className="container flex gap-2 overflow-x-auto py-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Button
              key={link.href}
              asChild
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn("flex-shrink-0", isActive && "bg-orange-600 hover:bg-orange-700")}
            >
              <Link href={link.href}>
                <Icon className="mr-2 h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
