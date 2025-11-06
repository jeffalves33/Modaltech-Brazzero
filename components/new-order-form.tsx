"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MenuItem, CartItem, Customer, PaymentMethod } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

interface NewOrderFormProps {
  menuItems: MenuItem[]
  userId: string
}

export function NewOrderForm({ menuItems, userId }: NewOrderFormProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [street, setStreet] = useState("")
  const [number, setNumber] = useState("")
  const [complement, setComplement] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [reference, setReference] = useState("")
  const [deliveryFee, setDeliveryFee] = useState("5.00")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro")
  const [orderNotes, setOrderNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = Array.from(new Set(menuItems.map((item) => item.category)))

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find((item) => item.menu_item.id === menuItem.id)
    if (existingItem) {
      setCart(cart.map((item) => (item.menu_item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { menu_item: menuItem, quantity: 1, notes: "" }])
    }
  }

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.menu_item.id === menuItemId) {
            const newQuantity = item.quantity + delta
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
          }
          return item
        })
        .filter((item): item is CartItem => item !== null),
    )
  }

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter((item) => item.menu_item.id !== menuItemId))
  }

  const updateItemNotes = (menuItemId: string, notes: string) => {
    setCart(cart.map((item) => (item.menu_item.id === menuItemId ? { ...item, notes } : item)))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.menu_item.price * item.quantity, 0)
  const total = subtotal + Number.parseFloat(deliveryFee || "0")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      alert("Adicione itens ao carrinho")
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      // Create or find customer
      let customer: Customer | null = null
      const { data: existingCustomers } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", customerPhone.replace(/\D/g, ""))
        .limit(1)

      if (existingCustomers && existingCustomers.length > 0) {
        customer = existingCustomers[0]
        // Update customer name if changed
        await supabase.from("customers").update({ name: customerName }).eq("id", customer.id)
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({ name: customerName, phone: customerPhone.replace(/\D/g, "") })
          .select()
          .single()

        if (customerError) throw customerError
        customer = newCustomer
      }

      // Create address
      const { data: address, error: addressError } = await supabase
        .from("customer_addresses")
        .insert({
          customer_id: customer.id,
          street,
          number,
          complement: complement || null,
          neighborhood,
          city: "São Paulo",
          state: "SP",
          reference: reference || null,
          is_default: false,
        })
        .select()
        .single()

      if (addressError) throw addressError

      // Get active cash session
      const { data: activeSessions } = await supabase
        .from("cash_sessions")
        .select("*")
        .is("closed_at", null)
        .order("opened_at", { ascending: false })
        .limit(1)

      const cashSessionId = activeSessions && activeSessions.length > 0 ? activeSessions[0].id : null

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          address_id: address.id,
          cash_session_id: cashSessionId,
          status: "em_producao",
          payment_method: paymentMethod,
          subtotal,
          delivery_fee: Number.parseFloat(deliveryFee || "0"),
          total,
          notes: orderNotes || null,
          created_by: userId,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        unit_price: item.menu_item.price,
        subtotal: item.menu_item.price * item.quantity,
        notes: item.notes || null,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Success - redirect to dashboard
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Erro ao criar pedido. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Menu Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cardápio</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={categories[0]}>
                <TabsList className="w-full justify-start overflow-x-auto">
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categories.map((category) => (
                  <TabsContent key={category} value={category} className="space-y-3 mt-4">
                    {menuItems
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                            <p className="text-sm font-semibold text-orange-600 mt-1">{formatCurrency(item.price)}</p>
                          </div>
                          <Button type="button" size="sm" onClick={() => addToCart(item)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Cart & Customer Info */}
        <div className="space-y-6">
          {/* Cart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrinho
                </CardTitle>
                <Badge>{cart.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carrinho vazio</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.menu_item.id} className="space-y-2 pb-3 border-b last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm truncate">{item.menu_item.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.menu_item.price * item.quantity)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() => updateQuantity(item.menu_item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() => updateQuantity(item.menu_item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeFromCart(item.menu_item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <Input
                          placeholder="Observações do item..."
                          value={item.notes}
                          onChange={(e) => updateItemNotes(item.menu_item.id, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Taxa de entrega:</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        className="w-24 h-8 text-right"
                      />
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-orange-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome *</Label>
                <Input
                  id="customerName"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefone *</Label>
                <Input
                  id="customerPhone"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, bloco, etc"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Ponto de referência</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Próximo ao..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamento e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de pagamento *</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderNotes">Observações do pedido</Label>
                <Textarea
                  id="orderNotes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Observações gerais..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
            {isSubmitting ? "Criando pedido..." : "Criar Pedido"}
          </Button>
        </div>
      </div>
    </form>
  )
}
