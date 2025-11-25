// components/order-print-dialog.tsx
"use client"

import type { Order } from "@/lib/types"
import { formatCurrency, formatDateTime, formatPhone } from "@/lib/format"

export function printOrderReceipt(order: Order) {
  if (typeof window === "undefined") return

  const formattedOrderNumber = String(order.order_number ?? "").padStart(3, "0")

  const paymentMethodLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao_debito: "Cartão de Débito",
    cartao_credito: "Cartão de Crédito",
  }

  const paymentLabel = paymentMethodLabels[order.payment_method] ?? order.payment_method

  const html = `
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
        <div class="receipt">
          <div class="receipt-logo">
            <img src="/logo.svg" alt="Brazzero" />
          </div>

          <div class="order-meta">
            <p class="order-number">Pedido n°${formattedOrderNumber}</p>
            <p class="order-datetime">Realizado em: ${formatDateTime(order.created_at)}</p>
          </div>

          <div class="section">
            <p>
              <span class="label">Cliente: </span>
              <span class="strong">${order.customer?.name ?? ""}</span>
            </p>
            ${order.customer?.phone
      ? `<p class="muted">${formatPhone(order.customer.phone)}</p>`
      : ""
    }
          </div>

          ${order.address
      ? `
          <div class="section">
            <p class="label">Endereço</p>
            <p class="strong">
              ${order.address.street}, ${order.address.number}${order.address.neighborhood ? `, ${order.address.neighborhood}` : ""
      }
            </p>
            <p>${order.address.city} - ${order.address.state}</p>
            ${order.address.reference
        ? `<p class="muted">( ${order.address.reference} )</p>`
        : ""
      }
          </div>
          `
      : ""
    }

          <hr class="divider" />

          <div class="items-section">
            ${(order.items || [])
      .map((item) => {
        const qty = String(item.quantity).padStart(2, "0")
        const name = item.menu_item?.name ?? ""
        const subtotal = formatCurrency(item.subtotal)
        const note = item.notes ? `<p class="item-note">Obs: ${item.notes}</p>` : ""

        return `
                    <div class="item-row">
                      <div class="item-header">
                        <div class="item-main">
                          <span class="item-qty">${qty}</span>
                          <span class="item-name">${name}</span>
                        </div>
                        <span class="item-price">${subtotal}</span>
                      </div>
                      ${note}
                      <hr class="dashed-divider" />
                    </div>
                  `
      })
      .join("")
    }
          </div>

          <div class="totals">
            <div class="line">
              <span>Valor dos produtos</span>
              <span>${formatCurrency(order.subtotal)}</span>
            </div>
            <div class="line">
              <span>Taxa de entrega</span>
              <span>${formatCurrency(order.delivery_fee)}</span>
            </div>
            <div class="line total-line">
              <span>Total</span>
              <span>${formatCurrency(order.total)}</span>
            </div>
          </div>

          <div class="payment-section">
            <p class="label">Forma de pagamento</p>
            <div class="line">
              <span>${paymentLabel}</span>
              <span>${formatCurrency(order.total)}</span>
            </div>
          </div>

          ${order.notes
      ? `
          <div class="section">
            <p class="label">Observações</p>
            <p>${order.notes}</p>
          </div>
          `
      : ""
    }

          <div class="footer">
            <p>Bom apetite!</p>
            <p>@brazzeroburger_</p>
          </div>
        </div>
      </body>
    </html>
  `

  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}
