"use client"

import { useEffect, useRef } from "react"
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
  const formattedOrderNumber = String(order.order_number ?? "").padStart(3, "0")

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido n°${formattedOrderNumber}</title>
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

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f5eee3;
            }

            .receipt {
              max-width: 80mm;
              margin: 0 auto;
              padding: 16px 16px 18px;
              background: #f5eee3;
              font-size: 11px;
              color: #1e1e1e;
            }

            .receipt-logo {
              text-align: center;
              margin-bottom: 10px;
            }

            .receipt-logo img {
              max-width: 120px;
              height: auto;
            }

            .order-meta {
              margin-bottom: 8px;
            }

            .order-number {
              font-weight: 700;
              font-size: 12px;
            }

            .order-datetime {
              margin-top: 2px;
              font-size: 11px;
            }

            .section {
              margin-top: 8px;
            }

            .label {
              font-weight: 600;
            }

            .strong {
              font-weight: 700;
            }

            .muted {
              font-size: 10px;
              color: #555;
            }

            .divider {
              border: 0;
              border-top: 1px solid #d3c5ad;
              margin: 10px 0;
            }

            .dashed-divider {
              border: 0;
              border-top: 1px dashed #c3b59a;
              margin: 8px 0;
            }

            .items-section {
              margin-top: 4px;
            }

            .item-row {
              margin: 4px 0;
            }

            .item-header {
              display: flex;
              align-items: baseline;
              justify-content: space-between;
              gap: 4px;
            }

            .item-main {
              display: flex;
              gap: 4px;
              flex: 1;
              min-width: 0;
            }

            .item-qty {
              font-weight: 600;
            }

            .item-name {
              font-weight: 500;
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }

            .item-price {
              font-weight: 600;
              white-space: nowrap;
              margin-left: 8px;
            }

            .item-note {
              font-size: 10px;
              margin-left: 20px;
              margin-top: 2px;
            }

            .totals {
              margin-top: 6px;
            }

            .line {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }

            .line span:last-child {
              text-align: right;
              min-width: 60px;
            }

            .total-line {
              margin-top: 4px;
              font-weight: 700;
            }

            .payment-section {
              margin-top: 10px;
            }

            .footer {
              text-align: center;
              margin-top: 14px;
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
      onOpenChange(false)
    }, 250)
  }

  useEffect(() => {
    if (!open) return
    // assim que o dialog "abre", já dispara a impressão
    handlePrint()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const paymentMethodLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao_debito: "Cartão de Débito",
    cartao_credito: "Cartão de Crédito",
  }

  const paymentLabel = paymentMethodLabels[order.payment_method] ?? order.payment_method

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Pedido</DialogTitle>
        </DialogHeader>

        {/* Conteúdo que vai para impressão */}
        <div ref={printRef}>
          <div className="receipt">
            {/* LOGO */}
            <div className="receipt-logo">
              <img src="/logo.svg" alt="Brazzero" />
            </div>

            {/* META DO PEDIDO */}
            <div className="order-meta">
              <p className="order-number">Pedido n°{formattedOrderNumber}</p>
              <p className="order-datetime">Realizado em: {formatDateTime(order.created_at)}</p>
            </div>

            {/* CLIENTE */}
            <div className="section">
              <p>
                <span className="label">Cliente: </span>
                <span className="strong">{order.customer?.name}</span>
              </p>
              {order.customer?.phone && (
                <p className="muted">{formatPhone(order.customer.phone)}</p>
              )}
            </div>

            {/* ENDEREÇO */}
            {order.address && (
              <div className="section">
                <p className="label">Endereço</p>
                <p className="strong">
                  {order.address.street}, {order.address.number}
                  {order.address.neighborhood ? `, ${order.address.neighborhood}` : ""}
                </p>
                <p>
                  {order.address.city} - {order.address.state}
                </p>
                {order.address.reference && (
                  <p className="muted">( {order.address.reference} )</p>
                )}
              </div>
            )}

            <hr className="divider" />

            {/* ITENS DO PEDIDO */}
            <div className="items-section">
              {order.items?.map((item) => (
                <div key={item.id} className="item-row">
                  <div className="item-header">
                    <div className="item-main">
                      <span className="item-qty">
                        {String(item.quantity).padStart(2, "0")}
                      </span>
                      <span className="item-name">{item.menu_item?.name}</span>
                    </div>
                    <span className="item-price">{formatCurrency(item.subtotal)}</span>
                  </div>

                  {item.notes && (
                    <p className="item-note">Obs: {item.notes}</p>
                  )}

                  <hr className="dashed-divider" />
                </div>
              ))}
            </div>

            {/* TOTAIS */}
            <div className="totals">
              <div className="line">
                <span>Valor dos produtos</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="line">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
              <div className="line total-line">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* PAGAMENTO */}
            <div className="payment-section">
              <p className="label">Forma de pagamento</p>
              <div className="line">
                <span>{paymentLabel}</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* OBSERVAÇÕES GERAIS DO PEDIDO */}
            {order.notes && (
              <div className="section">
                <p className="label">Observações</p>
                <p>{order.notes}</p>
              </div>
            )}

            {/* RODAPÉ */}
            <div className="footer">
              <p>Bom apetite!</p>
              <p>@brazzeroburger_</p>
            </div>
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
