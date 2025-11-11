"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type {
  MenuItem,
  Customer,
  CustomerAddress,
  MenuAddon,
  MenuItemAddon,
} from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPhone, normalizePhoneInput } from "@/lib/format"
import { Plus, Minus, Trash2, ShoppingCart, ChevronLeft, ChevronRight, Search, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface OrderFlowStepsProps {
  menuItems: MenuItem[]
  menuAddons: MenuAddon[]
  menuItemAddons: MenuItemAddon[]
  userId: string
}

interface MenuItemIngredient {
  menu_item_id: string
  inventory_item_id: string
  quantity: number
}

type OrderStep = "customer" | "items" | "address" | "payment"

interface CartAddon {
  addon: MenuAddon
  quantity: number
}

interface CartItem {
  id: string
  menu_item: MenuItem
  quantity: number
  notes: string
  addons: CartAddon[]
}


export function OrderFlowSteps({ menuItems, menuAddons, menuItemAddons, userId, }: OrderFlowStepsProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OrderStep>("customer")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState("")
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState<Partial<CustomerAddress>>({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    is_default: true,
    complement: "",
    reference: "",
  })
  const [cart, setCart] = useState<CartItem[]>([])
  const [addonModalItem, setAddonModalItem] = useState<MenuItem | null>(null)
  const [addonSelections, setAddonSelections] = useState<CartAddon[]>([])
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null)
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([])
  const [deliveryFee, setDeliveryFee] = useState("5.00")
  const [paymentMethod, setPaymentMethod] = useState("dinheiro")
  const [orderNotes, setOrderNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  const handleSearchCustomer = async () => {
    if (!customerSearch.trim()) {
      setCustomers([])
      return
    }

    try {
      const cleanedPhone = customerSearch.replace(/\D/g, "")
      const { data } = await supabase
        .from("customers")
        .select("*")
        .or(`name.ilike.%${customerSearch}%,phone.eq.${cleanedPhone}`)
        .limit(10)

      setCustomers(data || [])
    } catch (error) {
      console.error("Error searching customers:", error)
      setCustomers([])
    }
  }

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer)

    // Load customer addresses
    const { data: addresses } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("is_default", { ascending: false })

    setCustomerAddresses(addresses || [])

    if (addresses && addresses.length > 0) {
      setSelectedAddress(addresses[0])
    }

    setCurrentStep("items")
  }

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      alert("Preencha nome e telefone")
      return
    }

    if (
      !newCustomerAddress.street ||
      !newCustomerAddress.number ||
      !newCustomerAddress.neighborhood ||
      !newCustomerAddress.city ||
      !newCustomerAddress.state
    ) {
      alert("Preencha todos os dados do endereço (rua, número, bairro, cidade e estado)")
      return
    }

    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        name: newCustomerName,
        phone: newCustomerPhone.replace(/\D/g, ""),
      })
      .select()
      .single()

    if (error) {
      alert("Erro ao criar cliente")
      return
    }

    if (newCustomer) {
      const { data: addresses } = await supabase
        .from("customer_addresses")
        .insert({
          customer_id: newCustomer.id,
          street: newCustomerAddress.street,
          number: newCustomerAddress.number,
          complement: newCustomerAddress.complement || null,
          neighborhood: newCustomerAddress.neighborhood,
          city: newCustomerAddress.city,
          state: newCustomerAddress.state,
          zip_code: newCustomerAddress.zip_code || null,
          reference: newCustomerAddress.reference || null,
          is_default: true,
        })
        .select()

      setCustomerAddresses(addresses || [])
      if (addresses && addresses.length > 0) {
        setSelectedAddress(addresses[0])
      }
    }

    setSelectedCustomer(newCustomer)
    setShowAddCustomer(false)
    setNewCustomerName("")
    setNewCustomerPhone("")
    setNewCustomerAddress({
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
      is_default: true,
      complement: "",
      reference: "",
    })
    setCurrentStep("items")
  }

  const applyInventoryForOrder = async (orderId: string) => {
    try {
      // 1) quais itens de cardápio estão no carrinho
      const menuItemIds = Array.from(
        new Set(cart.map((item) => item.menu_item.id)),
      )

      if (menuItemIds.length === 0) return

      // 2) carrega receita de cada item
      const { data: itemIngredients, error: ingredientsError } =
        await supabase
          .from("menu_item_ingredients")
          .select("menu_item_id, inventory_item_id, quantity")
          .in("menu_item_id", menuItemIds)

      if (ingredientsError) throw ingredientsError

      const ingredients = (itemIngredients || []) as MenuItemIngredient[]

      if (ingredients.length === 0) return

      // 3) quantidade total vendida por item de cardápio
      const quantityByMenuItemId: Record<string, number> = {}
      cart.forEach((item) => {
        quantityByMenuItemId[item.menu_item.id] =
          (quantityByMenuItemId[item.menu_item.id] || 0) + item.quantity
      })

      // 4) consumo total por insumo
      const consumptionByInventoryItem: Record<string, number> = {}

      ingredients.forEach((ing) => {
        const totalItems = quantityByMenuItemId[ing.menu_item_id] || 0
        if (totalItems <= 0) return

        const totalQty = ing.quantity * totalItems
        consumptionByInventoryItem[ing.inventory_item_id] =
          (consumptionByInventoryItem[ing.inventory_item_id] || 0) +
          totalQty
      })

      const movementsPayload = Object.entries(consumptionByInventoryItem)
        .filter(([, qty]) => qty > 0)
        .map(([inventory_item_id, qty]) => ({
          inventory_item_id,
          movement_type: "out" as const,
          reason: "order" as const,
          quantity: qty,
          order_id: orderId,
          created_by: userId,
        }))

      if (movementsPayload.length === 0) return

      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert(movementsPayload)

      if (movementError) throw movementError
    } catch (err) {
      console.error("Error applying inventory for order:", err)
      // aqui você pode decidir se mostra um alerta ou só loga
    }
  }

  // Step 2: Items Selection
  const categories = Array.from(new Set(menuItems.map((item) => item.category)))

  const areAddonsEqual = (a: CartAddon[], b: CartAddon[]) => {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort((x, y) => x.addon.id.localeCompare(y.addon.id))
    const sortedB = [...b].sort((x, y) => x.addon.id.localeCompare(y.addon.id))

    return sortedA.every(
      (addon, index) =>
        addon.addon.id === sortedB[index].addon.id &&
        addon.quantity === sortedB[index].quantity,
    )
  }

  const addToCart = (menuItem: MenuItem, addons: CartAddon[] = []) => {
    const normalizedAddons = addons.filter((a) => a.quantity > 0)

    const existingItem = cart.find(
      (item) =>
        item.menu_item.id === menuItem.id &&
        areAddonsEqual(item.addons, normalizedAddons),
    )

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      )
    } else {
      const newItem: CartItem = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        menu_item: menuItem,
        quantity: 1,
        notes: "",
        addons: normalizedAddons,
      }
      setCart([...cart, newItem])
    }
  }

  const handleAddClick = (menuItem: MenuItem) => {
    const allowedAddonIds = menuItemAddons
      .filter((rel) => rel.menu_item_id === menuItem.id)
      .map((rel) => rel.menu_addon_id)

    const allowedAddons = menuAddons.filter((addon) =>
      allowedAddonIds.includes(addon.id),
    )

    // se não tiver complementos configurados, comportamento atual
    if (allowedAddons.length === 0) {
      addToCart(menuItem)
      return
    }

    // abre modal com lista de complementos
    setAddonModalItem(menuItem)
    setAddonSelections(
      allowedAddons.map((addon) => ({
        addon,
        quantity: 0,
      })),
    )
    setIsAddonModalOpen(true)
  }

  const updateAddonSelectionQuantity = (addonId: string, delta: number) => {
    setAddonSelections((prev) =>
      prev.map((entry) => {
        if (entry.addon.id !== addonId) return entry
        const newQty = entry.quantity + delta
        return { ...entry, quantity: newQty < 0 ? 0 : newQty }
      }),
    )
  }

  const closeAddonModal = () => {
    setIsAddonModalOpen(false)
    setAddonModalItem(null)
    setAddonSelections([])
  }

  const handleConfirmAddons = () => {
    if (!addonModalItem) return
    const selected = addonSelections.filter((entry) => entry.quantity > 0)
    addToCart(addonModalItem, selected)
    closeAddonModal()
  }

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== cartItemId) return item
          const newQuantity = item.quantity + delta
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
        })
        .filter((item): item is CartItem => item !== null),
    )
  }

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId))
  }

  const updateItemNotes = (cartItemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, notes } : item,
      ),
    )
  }

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const subtotal = cart.reduce((sum, item) => {
    const addonsPerUnit =
      item.addons?.reduce(
        (addonSum, a) => addonSum + a.addon.price * a.quantity,
        0,
      ) ?? 0

    const unitTotal = item.menu_item.price + addonsPerUnit
    return sum + unitTotal * item.quantity
  }, 0)

  const total = subtotal + Number.parseFloat(deliveryFee || "0")

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || !selectedAddress) {
      alert("Selecione cliente e endereço")
      return
    }

    setIsSubmitting(true)

    try {
      // Get active cash session
      const { data: activeSessions } = await supabase
        .from("cash_sessions")
        .select("*")
        .is("closed_at", null)
        .order("opened_at", { ascending: false })
        .limit(1)

      const cashSessionId = activeSessions && activeSessions.length > 0 ? activeSessions[0].id : null

      // Get next order number for this cash session
      const { data: sessionOrders } = await supabase
        .from("orders")
        .select("order_number")
        .eq("cash_session_id", cashSessionId)
        .order("order_number", { ascending: false })
        .limit(1)

      const nextOrderNumber = sessionOrders && sessionOrders.length > 0 ? sessionOrders[0].order_number + 1 : 1

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: selectedCustomer.id,
          address_id: selectedAddress.id,
          cash_session_id: cashSessionId,
          order_number: nextOrderNumber,
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

      // Create order items (incluindo complementos)
      const orderItemsPayload = cart.map((item) => {
        const addonsPerUnit =
          item.addons?.reduce(
            (addonSum, a) => addonSum + a.addon.price * a.quantity,
            0,
          ) ?? 0

        const lineSubtotal =
          (item.menu_item.price + addonsPerUnit) * item.quantity

        return {
          order_id: order.id,
          menu_item_id: item.menu_item.id,
          quantity: item.quantity,
          unit_price: item.menu_item.price,
          subtotal: lineSubtotal,
          notes: item.notes || null,
        }
      })

      const { data: insertedOrderItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsPayload)
        .select()

      if (itemsError) throw itemsError

      // Create order_item_addons
      const orderItemAddonsPayload: {
        order_item_id: string
        menu_addon_id: string
        quantity: number
        unit_price: number
        subtotal: number
      }[] = []

      insertedOrderItems?.forEach((orderItem, index) => {
        const cartItem = cart[index]
        if (!cartItem || !cartItem.addons || cartItem.addons.length === 0) return

        cartItem.addons.forEach((addonEntry) => {
          const totalAddonQty = addonEntry.quantity * cartItem.quantity
          if (totalAddonQty <= 0) return

          orderItemAddonsPayload.push({
            order_item_id: orderItem.id,
            menu_addon_id: addonEntry.addon.id,
            quantity: totalAddonQty,
            unit_price: addonEntry.addon.price,
            subtotal: addonEntry.addon.price * totalAddonQty,
          })
        })
      })

      if (orderItemAddonsPayload.length > 0) {
        const { error: addonsError } = await supabase
          .from("order_item_addons")
          .insert(orderItemAddonsPayload)

        if (addonsError) throw addonsError
      }

      // aplicar baixa de estoque com base nos insumos configurados
      await applyInventoryForOrder(order.id)

      window.location.href = "/"
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Erro ao criar pedido. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex justify-between mb-8">
        {["customer", "items", "address", "payment"].map((step, idx) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${step === currentStep
                ? "bg-black text-white"
                : ["customer", "items", "address", "payment"].indexOf(step) <
                  ["customer", "items", "address", "payment"].indexOf(currentStep)
                  ? "bg-gray-500 text-white"
                  : "bg-gray-200 text-gray-600"
                }`}
            >
              {idx + 1}
            </div>
            {idx < 3 && (
              <div
                className={`w-12 h-1 mx-2 ${["customer", "items", "address", "payment"].indexOf(step) <
                  ["customer", "items", "address", "payment"].indexOf(currentStep)
                  ? "bg-green-500"
                  : "bg-gray-200"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Customer */}
      {currentStep === "customer" && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerSearch">Pesquisar Cliente</Label>
              <div className="flex gap-2">
                <Input
                  id="customerSearch"
                  placeholder="Nome ou telefone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchCustomer()}
                />
                <Button type="button" onClick={handleSearchCustomer}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {customers.length > 0 && (
              <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full text-left p-3 border rounded transition-colors"
                  >
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{formatPhone(customer.phone)}</p>
                  </button>
                ))}
              </div>
            )}

            {!showAddCustomer && (
              <Button type="button" variant="outline" onClick={() => setShowAddCustomer(true)} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Novo Cliente
              </Button>
            )}

            {showAddCustomer && (
              <Card className="">
                <CardContent className="pt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="newCustomerName">Nome</Label>
                    <Input
                      id="newCustomerName"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCustomerPhone">Telefone</Label>
                    <Input
                      id="newCustomerPhone"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(normalizePhoneInput(e.target.value))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCustomerStreet">Rua</Label>
                    <Input
                      id="newCustomerStreet"
                      value={newCustomerAddress?.street || ""}
                      onChange={(e) => setNewCustomerAddress({ ...newCustomerAddress, street: e.target.value })}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="newCustomerNumber">Número</Label>
                      <Input
                        id="newCustomerNumber"
                        value={newCustomerAddress?.number || ""}
                        onChange={(e) => setNewCustomerAddress({ ...newCustomerAddress, number: e.target.value })}
                        placeholder="Número"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCustomerComplement">Complemento</Label>
                      <Input
                        id="newCustomerComplement"
                        value={newCustomerAddress?.complement || ""}
                        onChange={(e) => setNewCustomerAddress({ ...newCustomerAddress, complement: e.target.value })}
                        placeholder="Apto, sala..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCustomerNeighborhood">Bairro</Label>
                    <Input
                      id="newCustomerNeighborhood"
                      value={newCustomerAddress?.neighborhood || ""}
                      onChange={(e) => setNewCustomerAddress({ ...newCustomerAddress, neighborhood: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="newCustomerCity">Cidade</Label>
                      <Input
                        id="newCustomerCity"
                        value={newCustomerAddress?.city || ""}
                        onChange={(e) => setNewCustomerAddress({ ...newCustomerAddress, city: e.target.value })}
                        placeholder="Cidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCustomerState">Estado</Label>
                      <Input
                        id="newCustomerState"
                        value={newCustomerAddress?.state || ""}
                        onChange={(e) => setNewCustomerAddress({ ...newCustomerAddress, state: e.target.value })}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCustomerZipCode">CEP</Label>
                    <Input
                      id="newCustomerZipCode"
                      value={newCustomerAddress?.zip_code || ""}
                      onChange={(e) => setNewCustomerAddress({ ...newCustomerAddress, zip_code: e.target.value })}
                      placeholder="CEP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newCustomerReference">Referência</Label>
                    <Input
                      id="newCustomerReference"
                      value={newCustomerAddress?.reference || ""}
                      onChange={(e) => setNewCustomerAddress({ ...newCustomerAddress, reference: e.target.value })}
                      placeholder="Referência"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddCustomer(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddCustomer}
                      className="flex-1"
                    >
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              type="button"
              onClick={() => setCurrentStep("items")}
              disabled={!selectedCustomer}
              className="w-full"
            >
              Próximo: Selecionar Itens
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Items Selection */}
      {currentStep === "items" && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Itens</CardTitle>
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
                                <p className="text-sm font-semibold mt-1">{formatCurrency(item.price)}</p>
                              </div>
                              <Button type="button" size="sm" onClick={() => handleAddClick(item)}>
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

            {/* Cart Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Carrinho</span>
                    {cartItemsCount > 0 && (
                      <span className="inline-flex items-center justify-center rounded-md bg-gray-200 text-xs font-semibold px-2 py-0.5 min-w-[24px]">
                        {String(cartItemsCount).padStart(2, "0")}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Carrinho vazio</p>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {cart.map((item) => {
                          const addonsPerUnit =
                            item.addons?.reduce(
                              (addonSum, a) => addonSum + a.addon.price * a.quantity,
                              0,
                            ) ?? 0
                          const lineTotal =
                            (item.menu_item.price + addonsPerUnit) * item.quantity

                          const addonsLabel =
                            item.addons && item.addons.length > 0
                              ? item.addons
                                .map((a) =>
                                  a.quantity > 1
                                    ? `${a.addon.name} x${a.quantity}`
                                    : a.addon.name,
                                )
                                .join(", ")
                              : ""

                          return (
                            <div
                              key={item.id}
                              className="space-y-2 pb-3 border-b last:border-0"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm truncate">
                                    {item.menu_item.name}
                                  </h5>
                                  {addonsLabel && (
                                    <p className="text-xs text-muted-foreground">
                                      {addonsLabel}
                                    </p>
                                  )}
                                  <p className="text-sm text-muted-foreground">
                                    {formatCurrency(lineTotal)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 bg-transparent"
                                    onClick={() => updateQuantity(item.id, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 bg-transparent"
                                    onClick={() => updateQuantity(item.id, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <Input
                                placeholder="Observações..."
                                value={item.notes}
                                onChange={(e) => updateItemNotes(item.id, e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="">{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setCurrentStep("customer")} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep("address")}
                  disabled={cart.length === 0}
                  className="flex-1"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
          <Dialog open={isAddonModalOpen} onOpenChange={(open) => !open && closeAddonModal()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {addonModalItem
                    ? `Adicionar complementos - ${addonModalItem.name}`
                    : "Complementos"}
                </DialogTitle>
              </DialogHeader>

              {addonModalItem && (
                <div className="space-y-3">
                  {addonSelections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Este item não possui complementos configurados.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {addonSelections.map((entry) => (
                        <div
                          key={entry.addon.id}
                          className="flex items-center justify-between gap-2 border rounded-md px-2 py-1"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm">{entry.addon.name}</span>
                            {entry.addon.description && (
                              <span className="text-xs text-muted-foreground">
                                {entry.addon.description}
                              </span>
                            )}
                            <span className="text-xs font-medium">
                              {formatCurrency(entry.addon.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() =>
                                updateAddonSelectionQuantity(
                                  entry.addon.id,
                                  -1,
                                )
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">
                              {entry.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 bg-transparent"
                              onClick={() =>
                                updateAddonSelectionQuantity(
                                  entry.addon.id,
                                  1,
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeAddonModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleConfirmAddons}
                >
                  Adicionar ao carrinho
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Step 3: Address Selection */}
      {currentStep === "address" && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Endereço de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customerAddresses.length > 0 && (
              <div className="space-y-3">
                {customerAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress?.id === addr.id}
                      onChange={() => setSelectedAddress(addr)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {addr.street}, {addr.number}
                        {addr.complement && ` - ${addr.complement}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addr.neighborhood}, {addr.city} - {addr.state}
                      </p>
                      {addr.reference && <p className="text-sm text-muted-foreground">Ref: {addr.reference}</p>}
                      {addr.is_default && <Badge className="mt-2">Padrão</Badge>}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setCurrentStep("items")} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep("payment")}
                disabled={!selectedAddress}
                className="flex-1"
              >
                Próximo: Pagamento
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Payment */}
      {currentStep === "payment" && (
        <form onSubmit={handleSubmitOrder} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedCustomer?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">
                    {selectedAddress?.street}, {selectedAddress?.number}
                  </p>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
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
                    <span className="">{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Selecione a forma de pagamento *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                    <Label htmlFor="orderNotes">Observações</Label>
                    <Textarea
                      id="orderNotes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Observações gerais do pedido..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setCurrentStep("address")} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Criando..." : "Finalizar Pedido"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
