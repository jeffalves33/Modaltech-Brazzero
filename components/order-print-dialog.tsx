"use client"

import { useRef } from "react"
import type { Order } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime, formatPhone } from "@/lib/format"
import { Printer } from "lucide-react"

interface OrderPrintDialogProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderPrintDialog({ order, open, onOpenChange }: OrderPrintDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido #${order.order_number}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              padding: 10px;
              max-width: 80mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              font-weight: bold;
            }
            .header p {
              margin: 2px 0;
              font-size: 11px;
            }
            .section {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px dashed #000;
            }
            .section:last-child {
              border-bottom: 2px dashed #000;
            }
            .section-title {
              font-weight: bold;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .item-name {
              flex: 1;
            }
            .item-price {
              text-align: right;
              white-space: nowrap;
              margin-left: 10px;
            }
            .total {
              font-size: 14px;
              font-weight: bold;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const paymentMethodLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao_debito: "Cartão de Débito",
    cartao_credito: "Cartão de Crédito",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Pedido</DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="font-mono text-sm">
          <div className="header">
            <h1>HAMBURGUERIA</h1>
            <p>Sistema de Pedidos</p>
            <p>{formatDateTime(order.created_at)}</p>
          </div>

          <div className="section">
            <div className="section-title">Pedido #{order.order_number}</div>
          </div>

          <div className="section">
            <div className="section-title">Cliente</div>
            <div>{order.customer?.name}</div>
            <div>{formatPhone(order.customer?.phone || "")}</div>
          </div>

          <div className="section">
            <div className="section-title">Endereço de Entrega</div>
            <div>
              {order.address?.street}, {order.address?.number}
            </div>
            {order.address?.complement && <div>{order.address.complement}</div>}
            <div>{order.address?.neighborhood}</div>
            <div>
              {order.address?.city} - {order.address?.state}
            </div>
            {order.address?.reference && (
              <div>
                <strong>Ref:</strong> {order.address.reference}
              </div>
            )}
          </div>

          <div className="section">
            <div className="section-title">Itens do Pedido</div>
            {order.items?.map((item) => (
              <div key={item.id}>
                <div className="item">
                  <div className="item-name">
                    {item.quantity}x {item.menu_item?.name}
                  </div>
                  <div className="item-price">{formatCurrency(item.subtotal)}</div>
                </div>
                {item.notes && <div style={{ fontSize: "10px", marginLeft: "10px" }}>Obs: {item.notes}</div>}
              </div>
            ))}
          </div>

          <div className="section">
            <div className="item">
              <div>Subtotal:</div>
              <div>{formatCurrency(order.subtotal)}</div>
            </div>
            <div className="item">
              <div>Taxa de entrega:</div>
              <div>{formatCurrency(order.delivery_fee)}</div>
            </div>
            <div className="item total">
              <div>TOTAL:</div>
              <div>{formatCurrency(order.total)}</div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Pagamento</div>
            <div>{paymentMethodLabels[order.payment_method]}</div>
          </div>

          {order.notes && (
            <div className="section">
              <div className="section-title">Observações</div>
              <div>{order.notes}</div>
            </div>
          )}

          <div className="footer">
            <p>Obrigado pela preferência!</p>
            <p>Bom apetite!</p>
          </div>
        </div>

        <Button onClick={handlePrint} className="w-full">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </DialogContent>
    </Dialog>
  )
}
