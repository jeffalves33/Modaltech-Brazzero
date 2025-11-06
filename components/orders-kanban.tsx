"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Order, OrderStatus } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime, formatPhone } from "@/lib/format"
import { ChevronRight, Phone, MapPin, Printer } from "lucide-react"
import { OrderPrintDialog } from "@/components/order-print-dialog"

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  em_producao: { label: "Em Produção", color: "bg-blue-500" },
  em_rota: { label: "Em Rota de Entrega", color: "bg-yellow-500" },
  entregue: { label: "Entregue", color: "bg-green-500" },
  cancelado: { label: "Cancelado", color: "bg-red-500" },
}

export function OrdersKanban() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [printOrder, setPrintOrder] = useState<Order | null>(null)
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
        items:order_items(*, menu_item:menu_items(*))
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
            <div>
              <CardTitle className="text-lg">Pedido #{order.order_number}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
            </div>
            <Badge variant="outline" className="font-mono">
              {formatCurrency(order.total)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.customer?.name}</span>
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
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menu_item?.name}
                </span>
                <span className="text-muted-foreground">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="text-sm">
              <span className="font-medium">Obs:</span> {order.notes}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => setPrintOrder(order)}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
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

      {printOrder && (
        <OrderPrintDialog order={printOrder} open={!!printOrder} onOpenChange={() => setPrintOrder(null)} />
      )}
    </>
  )
}
