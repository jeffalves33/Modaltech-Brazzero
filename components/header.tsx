"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/types"
import { LogOut, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Navigation } from "@/components/navigation"

import Image from "next/image"

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [showLogoutWarning, setShowLogoutWarning] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()

    // Check if cash session is open
    const { data: activeSessions } = await supabase.from("cash_sessions").select("*").is("closed_at", null).limit(1)

    if (activeSessions && activeSessions.length > 0) {
      setShowLogoutWarning(true)
      return
    }

    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur bg-white mb-6 px-8">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="Logo da Hamburgueria"
                width={150}
                height={150}
                priority
              />
            </div>
          </div>

          <Navigation />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={showLogoutWarning} onOpenChange={setShowLogoutWarning}>
        <AlertDialogContent>
          <AlertDialogTitle>Caixa Aberto</AlertDialogTitle>
          <AlertDialogDescription>
            Você não pode sair sem fechar o caixa. Por favor, acesse a página de Caixa e feche-o antes de fazer logout.
          </AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                className=""
                onClick={() => {
                  setShowLogoutWarning(false)
                  router.push("/caixa")
                }}
              >
                Ir para Caixa
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
