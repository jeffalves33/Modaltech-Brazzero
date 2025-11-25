"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Order, OrderStatus } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime, formatPhone } from "@/lib/format"
import { ChevronRight, Phone, MapPin, Printer, User, Trash2, PencilLine } from "lucide-react"
import { printOrderReceipt } from "@/components/order-print-dialog"

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  em_producao: { label: "Em Produção", color: "bg-blue-500" },
  em_rota: { label: "Em Rota de Entrega", color: "bg-yellow-500" },
  entregue: { label: "Entregue", color: "bg-green-500" },
  cancelado: { label: "Cancelado", color: "bg-red-500" },
}

export function OrdersKanban() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCashSessionId, setActiveCashSessionId] = useState<string | null>(null)

  useEffect(() => {
    const initializeData = async () => {
      const supabase = createClient()

      const { data: activeSessions } = await supabase
        .from("cash_sessions")
        .select("*")
        .is("closed_at", null)
        .order("opened_at", { ascending: false })
        .limit(1)

      if (activeSessions && activeSessions.length > 0) {
        setActiveCashSessionId(activeSessions[0].id)
      }

      loadOrders(activeSessions?.[0]?.id)
    }

    initializeData()

    const supabase = createClient()
    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders(activeCashSessionId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeCashSessionId])

  const loadOrders = async (cashSessionId?: string | null) => {
    const supabase = createClient()
    let query = supabase
      .from("orders")
      .select(`
        *,
        customer:customers(*),
        address:customer_addresses(*),
        items:order_items(
          *,
          menu_item:menu_items(*),
          addons:order_item_addons(
            quantity,
            menu_addon:menu_addons(*)
          )
        )
      `)
      .in("status", ["em_producao", "em_rota", "entregue"])
      .order("created_at", { ascending: false })

    if (cashSessionId) {
      query = query.eq("cash_session_id", cashSessionId)
    }

    const { data, error } = await query

    if (!error && data) {
      setOrders(data as Order[])
    }
    setIsLoading(false)
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const supabase = createClient()
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

    loadOrders(activeCashSessionId)
  }

  const cancelOrder = async (order: Order) => {
    if (order.status === "entregue") {
      alert("Pedido entregue não pode ser cancelado.")
      return
    }

    const supabase = createClient()

    // chama a função SQL que estorna estoque e marca status=cancelado
    const { error } = await supabase.rpc("cancel_order", { p_order_id: order.id })
    if (error) {
      console.error("Erro ao cancelar pedido:", error)
      alert("Erro ao cancelar pedido.")
      return
    }

    // some da lista (colunas já não exibem 'cancelado')
    setOrders((prev) => prev.filter((o) => o.id !== order.id))
  }

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status)
  }

  const renderOrderCard = (order: Order) => {
    const nextStatus: Record<OrderStatus, OrderStatus | null> = {
      em_producao: "em_rota",
      em_rota: "entregue",
      entregue: null,
      cancelado: null,
    }

    return (
      <Card key={order.id} className="mb-3">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-50">
                Nº {String(order.order_number).padStart(2, "0")}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(order.created_at)}
              </p>
            </div>
            <Badge variant="outline" className="font-mono">
              {formatCurrency(order.total)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.customer?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{formatPhone(order.customer?.phone || "")}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                {order.address?.street}, {order.address?.number}
                {order.address?.complement && ` - ${order.address.complement}`}
                <br />
                {order.address?.neighborhood}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            {order.items?.map((item: any) => {
              const addons = item.addons || []
              const addonsLabel =
                addons.length > 0
                  ? addons
                    .map((a: any) =>
                      a.quantity > 1
                        ? `${a.menu_addon?.name} x${a.quantity}`
                        : a.menu_addon?.name,
                    )
                    .join(", ")
                  : ""

              return (
                <div key={item.id} className="space-y-0.5 text-sm">
                  <div className="flex justify-between">
                    <span>
                      {item.quantity}x {item.menu_item?.name}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                  {addonsLabel && (
                    <p className="text-xs text-muted-foreground ml-4">
                      + {addonsLabel}
                    </p>
                  )}
                </div>
              )
            })}
          </div>


          {order.notes && (
            <div className="text-sm">
              <span className="font-medium">Obs:</span> {order.notes}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {order.status != "entregue" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive"
                onClick={() => cancelOrder(order)}
                title="Excluir pedido"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {/*<Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 bg-transparent"
              onClick={() => setPrintOrder(order)}
            >
              <PencilLine className="h-4 w-4" />
            </Button>*/}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 bg-transparent"
              onClick={() => printOrderReceipt(order)}
            >
              <Printer className="h-4 w-4" />
            </Button>

            {nextStatus[order.status] && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => updateOrderStatus(order.id, nextStatus[order.status]!)}
              >
                {statusConfig[nextStatus[order.status]!].label}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <div className="text-center py-12">Carregando pedidos...</div>
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {(["em_producao", "em_rota", "entregue"] as OrderStatus[]).map((status) => {
          const statusOrders = getOrdersByStatus(status)
          return (
            <div key={status}>
              <div className="mb-4 flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${statusConfig[status].color}`} />
                <h3 className="font-semibold">{statusConfig[status].label}</h3>
                <Badge variant="secondary">{statusOrders.length}</Badge>
              </div>
              <div className="space-y-3">
                {statusOrders.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido</CardContent>
                  </Card>
                ) : (
                  statusOrders.map(renderOrderCard)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
