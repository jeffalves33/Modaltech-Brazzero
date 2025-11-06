"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Customer, CustomerAddress } from "@/lib/types"
import { useEffect, useState } from "react"
import { Plus, Edit2, Trash2, MapPin, ShoppingCart, ArrowLeft } from "lucide-react"
import { formatCurrency, formatPhone, normalizePhoneInput } from "@/lib/format"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [customerStats, setCustomerStats] = useState<{ orders: number; total: number }>({ orders: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingPhone, setEditingPhone] = useState("")
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddress, setNewAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
  })
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("name")
    setCustomers(data || [])
    setIsLoading(false)
  }

  const loadCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer)

    // Load addresses
    const { data: addressesData } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("is_default", { ascending: false })

    setAddresses(addressesData || [])

    // Load customer stats - only current cash session
    const { data: activeSessions } = await supabase
      .from("cash_sessions")
      .select("*")
      .is("closed_at", null)
      .order("opened_at", { ascending: false })
      .limit(1)

    if (activeSessions && activeSessions.length > 0) {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("total")
        .eq("customer_id", customer.id)
        .eq("cash_session_id", activeSessions[0].id)

      const orders = ordersData || []
      const total = orders.reduce((sum, order) => sum + order.total, 0)
      setCustomerStats({ orders: orders.length, total })
    } else {
      setCustomerStats({ orders: 0, total: 0 })
    }
  }

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return

    const { error } = await supabase
      .from("customers")
      .update({ name: editingName, phone: editingPhone.replace(/\D/g, "") })
      .eq("id", editingCustomer.id)

    if (!error) {
      loadCustomers()
      setEditingCustomer(null)
      await loadCustomerDetails({ ...editingCustomer, name: editingName, phone: editingPhone })
    }
  }

  const handleAddAddress = async () => {
    if (!selectedCustomer || !newAddress.street || !newAddress.number || !newAddress.neighborhood) {
      alert("Preencha os dados obrigatórios")
      return
    }

    const { error } = await supabase.from("customer_addresses").insert({
      customer_id: selectedCustomer.id,
      ...newAddress,
      is_default: false,
    })

    if (!error) {
      setNewAddress({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        reference: "",
      })
      setShowAddAddress(false)
      await loadCustomerDetails(selectedCustomer)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    const { error } = await supabase.from("customer_addresses").delete().eq("id", addressId)

    if (!error) {
      setDeletingAddressId(null)
      if (selectedCustomer) {
        await loadCustomerDetails(selectedCustomer)
      }
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", customerId)

    if (!error) {
      setDeletingCustomerId(null)
      setSelectedCustomer(null)
      await loadCustomers()
    }
  }

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm.replace(/\D/g, "")),
  )

  if (isLoading) {
    return <div className="container py-6">Carregando...</div>
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Clientes</h1>
          <p className="text-muted-foreground">Edite dados, adicione endereços e veja histórico de compras</p>
        </div>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customers List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente encontrado</p>
              ) : (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => loadCustomerDetails(customer)}
                    className={`w-full text-left p-3 border rounded-lg transition-colors ${
                      selectedCustomer?.id === customer.id ? "border-orange-600 bg-orange-50" : "hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium text-sm">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPhone(customer.phone)}</p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        {selectedCustomer && (
          <div className="lg:col-span-2 space-y-4">
            {/* Customer Info */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{selectedCustomer.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{formatPhone(selectedCustomer.phone)}</p>
                </div>
                <div className="flex gap-2">
                  <Dialog
                    open={!!editingCustomer}
                    onOpenChange={(open) => {
                      if (!open) setEditingCustomer(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCustomer(selectedCustomer)
                          setEditingName(selectedCustomer.name)
                          setEditingPhone(formatPhone(selectedCustomer.phone))
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input
                            value={editingPhone}
                            onChange={(e) => setEditingPhone(normalizePhoneInput(e.target.value))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditingCustomer(null)} className="flex-1">
                            Cancelar
                          </Button>
                          <Button onClick={handleUpdateCustomer} className="flex-1 bg-orange-600 hover:bg-orange-700">
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog
                    open={deletingCustomerId === selectedCustomer.id}
                    onOpenChange={(open) => !open && setDeletingCustomerId(null)}
                  >
                    <AlertDialogContent>
                      <AlertDialogTitle>Deletar Cliente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todos os dados do cliente serão removidos.
                      </AlertDialogDescription>
                      <div className="flex gap-2">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Deletar
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button size="sm" variant="ghost" onClick={() => setDeletingCustomerId(selectedCustomer.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="stats">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stats" className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Estatísticas Hoje
                    </TabsTrigger>
                    <TabsTrigger value="addresses" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereços
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stats" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="bg-muted">
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
                          <p className="text-2xl font-bold">{customerStats.orders}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted">
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">Gasto Hoje</p>
                          <p className="text-2xl font-bold text-orange-600">{formatCurrency(customerStats.total)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="addresses" className="space-y-3">
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {addresses.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum endereço cadastrado</p>
                      ) : (
                        addresses.map((addr) => (
                          <Card key={addr.id} className="bg-muted">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {addr.street}, {addr.number}
                                    {addr.complement && ` - ${addr.complement}`}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {addr.neighborhood}, {addr.city} - {addr.state}
                                  </p>
                                  {addr.reference && (
                                    <p className="text-xs text-muted-foreground mt-1">Ref: {addr.reference}</p>
                                  )}
                                </div>
                                <AlertDialog
                                  open={deletingAddressId === addr.id}
                                  onOpenChange={(open) => !open && setDeletingAddressId(null)}
                                >
                                  <AlertDialogContent>
                                    <AlertDialogTitle>Deletar Endereço?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                    <div className="flex gap-2">
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteAddress(addr.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Deletar
                                      </AlertDialogAction>
                                    </div>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <Button size="sm" variant="ghost" onClick={() => setDeletingAddressId(addr.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>

                    <Button
                      onClick={() => setShowAddAddress(!showAddAddress)}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Endereço
                    </Button>

                    {showAddAddress && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-4 space-y-3">
                          <div className="space-y-2">
                            <Label>Rua</Label>
                            <Input
                              value={newAddress.street}
                              onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                              placeholder="Nome da rua"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>Número</Label>
                              <Input
                                value={newAddress.number}
                                onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                                placeholder="Número"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Complemento</Label>
                              <Input
                                value={newAddress.complement}
                                onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                                placeholder="Apto, sala..."
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Bairro</Label>
                            <Input
                              value={newAddress.neighborhood}
                              onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                              placeholder="Bairro"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>Cidade</Label>
                              <Input
                                value={newAddress.city}
                                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                placeholder="Cidade"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Estado</Label>
                              <Input
                                value={newAddress.state}
                                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                placeholder="SP"
                                maxLength={2}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Referência</Label>
                            <Textarea
                              value={newAddress.reference}
                              onChange={(e) => setNewAddress({ ...newAddress, reference: e.target.value })}
                              placeholder="Perto de..."
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowAddAddress(false)} className="flex-1">
                              Cancelar
                            </Button>
                            <Button onClick={handleAddAddress} className="flex-1 bg-orange-600 hover:bg-orange-700">
                              Adicionar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
