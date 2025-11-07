"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Customer, CustomerAddress, CashSession } from "@/lib/types"
import { useState } from "react"
import { Plus, Edit2, Trash2, MapPin, ShoppingCart, Phone } from "lucide-react"
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
import {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerAddress,
    deleteCustomerAddress,
    getCustomerAddresses
} from "@/app/actions/clients"

interface ClientsManagementProps {
    initialCustomers: Customer[]
    activeSession: CashSession | null
}

export function ClientsManagement({ initialCustomers, activeSession }: ClientsManagementProps) {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [addresses, setAddresses] = useState<CustomerAddress[]>([])
    console.log("🚀 ~ ClientsManagement ~ addresses: ", addresses)
    const [customerStats, setCustomerStats] = useState<{ orders: number; total: number }>({ orders: 0, total: 0 })
    const [searchTerm, setSearchTerm] = useState("")
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [editingName, setEditingName] = useState("")
    const [editingPhone, setEditingPhone] = useState("")
    const [showAddAddress, setShowAddAddress] = useState(false)
    const [showNewCustomer, setShowNewCustomer] = useState(false)
    const [newCustomerName, setNewCustomerName] = useState("")
    const [newCustomerPhone, setNewCustomerPhone] = useState("")
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
    const [loading, setLoading] = useState(false)

    const handleLoadCustomerDetails = async (customer: Customer) => {
        setSelectedCustomer(customer)
        setLoading(true)

        try {
            const addressesFromDb = await getCustomerAddresses(customer.id)
            console.log("🚀 ~ handleLoadCustomerDetails ~ addressesFromDb: ", addressesFromDb)
            setAddresses(addressesFromDb)
            setCustomerStats({ orders: 0, total: 0 })
        } catch (error) {
            console.error("Erro ao carregar detalhes do cliente:", error)
            setAddresses([])
            setCustomerStats({ orders: 0, total: 0 })
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCustomer = async () => {
        if (!newCustomerName.trim() || !newCustomerPhone.trim()) return

        setLoading(true)
        try {
            const newCustomer = await createCustomer(newCustomerName, newCustomerPhone)
            setCustomers((prev) => [...prev, newCustomer])
            setNewCustomerName("")
            setNewCustomerPhone("")
            setShowNewCustomer(false)
        } catch (error) {
            console.error("Error creating customer:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateCustomer = async () => {
        if (!editingCustomer || !editingName.trim()) return

        setLoading(true)
        try {
            await updateCustomer(editingCustomer.id, editingName, editingPhone)
            const updatedCustomer = { ...editingCustomer, name: editingName, phone: editingPhone }
            setCustomers((prev) => prev.map((c) => (c.id === editingCustomer.id ? updatedCustomer : c)))
            setSelectedCustomer(updatedCustomer)
            setEditingCustomer(null)
        } catch (error) {
            console.error("Error updating customer:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddAddress = async () => {
        if (
            !selectedCustomer ||
            !newAddress.street.trim() ||
            !newAddress.number.trim() ||
            !newAddress.neighborhood.trim()
        ) {
            return
        }

        setLoading(true)
        try {
            await addCustomerAddress(selectedCustomer.id, newAddress)
            setShowAddAddress(false)
            // Reload customer details
            await handleLoadCustomerDetails(selectedCustomer)
        } catch (error) {
            console.error("Error adding address:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAddress = async (addressId: string) => {
        setLoading(true)
        try {
            await deleteCustomerAddress(addressId)
            setDeletingAddressId(null)
            if (selectedCustomer) {
                await handleLoadCustomerDetails(selectedCustomer)
            }
        } catch (error) {
            console.error("Error deleting address:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteCustomer = async (customerId: string) => {
        setLoading(true)
        try {
            await deleteCustomer(customerId)
            setDeletingCustomerId(null)
            setSelectedCustomer(null)
            setCustomers((prev) => prev.filter((c) => c.id !== customerId))
        } catch (error) {
            console.error("Error deleting customer:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCustomers = customers.filter(
        (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm.replace(/\D/g, "")),
    )

    return (
        <div className="grid gap-6 lg:grid-cols-4">
            {/* Customers List Sidebar */}
            <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">Clientes</CardTitle>
                        <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-transparent">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Novo Cliente</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nome *</Label>
                                        <Input
                                            value={newCustomerName}
                                            onChange={(e) => setNewCustomerName(e.target.value)}
                                            placeholder="Nome completo"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefone *</Label>
                                        <Input
                                            value={newCustomerPhone}
                                            onChange={(e) => setNewCustomerPhone(normalizePhoneInput(e.target.value))}
                                            placeholder="(99) 99999-9999"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowNewCustomer(false)}
                                            className="flex-1"
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleCreateCustomer}
                                            className="flex-1"
                                            disabled={loading}
                                        >
                                            {loading ? "Criando..." : "Criar"}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Input
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-sm"
                    />

                    <div className="space-y-1 max-h-[600px] overflow-y-auto">
                        {filteredCustomers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente encontrado</p>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <button
                                    key={customer.id}
                                    onClick={() => handleLoadCustomerDetails(customer)}
                                    className={`w-full text-left p-2.5 border rounded-md transition-all text-sm ${selectedCustomer?.id === customer.id
                                        ? "border-black bg-gray-50"
                                        : "border-transparent hover:bg-muted"
                                        }`}
                                >
                                    <p className="font-medium truncate">{customer.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{formatPhone(customer.phone)}</p>
                                </button>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Customer Details */}
            {selectedCustomer ? (
                <div className="lg:col-span-3 space-y-4">
                    {/* Header with actions */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="truncate">{selectedCustomer.name}</CardTitle>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <Phone className="h-3.5 w-3.5" />
                                        {formatPhone(selectedCustomer.phone)}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
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
                                                disabled={loading}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                                <span className="hidden sm:inline ml-2">Editar</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Editar Cliente</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Nome</Label>
                                                    <Input
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        placeholder="Nome completo"
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Telefone</Label>
                                                    <Input
                                                        value={editingPhone}
                                                        onChange={(e) => setEditingPhone(normalizePhoneInput(e.target.value))}
                                                        placeholder="(99) 99999-9999"
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setEditingCustomer(null)}
                                                        className="flex-1"
                                                        disabled={loading}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        onClick={handleUpdateCustomer}
                                                        className="flex-1"
                                                        disabled={loading}
                                                    >
                                                        {loading ? "Salvando..." : "Salvar"}
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
                                                <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    disabled={loading}
                                                >
                                                    {loading ? "Deletando..." : "Deletar"}
                                                </AlertDialogAction>
                                            </div>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={() => setDeletingCustomerId(selectedCustomer.id)}
                                        disabled={loading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Tabs for Stats and Addresses */}
                    <Tabs defaultValue="stats" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="stats" className="gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                <span className="hidden sm:inline">Estatísticas</span>
                            </TabsTrigger>
                            <TabsTrigger value="addresses" className="gap-2">
                                <MapPin className="h-4 w-4" />
                                <span className="hidden sm:inline">Endereços</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Stats Tab */}
                        <TabsContent value="stats" className="space-y-3 mt-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                                    <CardContent className="pt-4">
                                        <p className="text-xs text-muted-foreground">Pedidos Hoje</p>
                                        <p className="text-3xl font-bold text-blue-700 mt-1">{customerStats.orders}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                                    <CardContent className="pt-4">
                                        <p className="text-xs text-muted-foreground">Total de Compras</p>
                                        <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(customerStats.total)}</p>
                                    </CardContent>
                                </Card>
                            </div>
                            {activeSession ? (
                                <p className="text-xs text-muted-foreground text-center">Dados da sessão atual do caixa</p>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center">Abra o caixa para ver estatísticas</p>
                            )}
                        </TabsContent>

                        {/* Addresses Tab */}
                        <TabsContent value="addresses" className="space-y-3 mt-4">
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {addresses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum endereço cadastrado</p>
                                ) : (
                                    addresses.map((addr) => (
                                        <Card key={addr.id} className="bg-muted/50">
                                            <CardContent className="pt-4">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm">
                                                            {addr.street}, {addr.number}
                                                            {addr.complement && ` - ${addr.complement}`}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {addr.neighborhood}, {addr.city} - {addr.state}
                                                        </p>
                                                        {addr.reference && (
                                                            <p className="text-xs text-muted-foreground mt-1"> REF.: {addr.reference}</p>
                                                        )}
                                                        {addr.is_default && <p className="text-xs text-green-600 font-medium mt-1">Padrão</p>}
                                                    </div>
                                                    <AlertDialog
                                                        open={deletingAddressId === addr.id}
                                                        onOpenChange={(open) => !open && setDeletingAddressId(null)}
                                                    >
                                                        <AlertDialogContent>
                                                            <AlertDialogTitle>Deletar Endereço?</AlertDialogTitle>
                                                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                                            <div className="flex gap-2">
                                                                <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteAddress(addr.id)}
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                    disabled={loading}
                                                                >
                                                                    {loading ? "Deletando..." : "Deletar"}
                                                                </AlertDialogAction>
                                                            </div>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setDeletingAddressId(addr.id)}
                                                        className="flex-shrink-0 text-destructive"
                                                        disabled={loading}
                                                    >
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
                                className="w-full"
                                disabled={loading}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Endereço
                            </Button>

                            {showAddAddress && (
                                <Card className="border-black-200 bg-gray-50">
                                    <CardContent className="pt-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm">Rua *</Label>
                                            <Input
                                                value={newAddress.street}
                                                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                                                placeholder="Nome da rua"
                                                className="text-sm"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm">Número *</Label>
                                                <Input
                                                    value={newAddress.number}
                                                    onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                                                    placeholder="Número"
                                                    className="text-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm">Complemento</Label>
                                                <Input
                                                    value={newAddress.complement}
                                                    onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                                                    placeholder="Apto, sala..."
                                                    className="text-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm">Bairro *</Label>
                                            <Input
                                                value={newAddress.neighborhood}
                                                onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                                                placeholder="Bairro"
                                                className="text-sm"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm">Cidade</Label>
                                                <Input
                                                    value={newAddress.city}
                                                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                                    placeholder="Cidade"
                                                    className="text-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm">Estado</Label>
                                                <Input
                                                    value={newAddress.state}
                                                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })}
                                                    placeholder="SP"
                                                    maxLength={2}
                                                    className="text-sm"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm">Referência</Label>
                                            <Textarea
                                                value={newAddress.reference}
                                                onChange={(e) => setNewAddress({ ...newAddress, reference: e.target.value })}
                                                placeholder="Perto de... (opcional)"
                                                rows={2}
                                                className="text-sm"
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowAddAddress(false)}
                                                className="flex-1"
                                                disabled={loading}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={handleAddAddress}
                                                className="flex-1"
                                                disabled={loading}
                                            >
                                                {loading ? "Adicionando..." : "Adicionar"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                <div className="lg:col-span-3">
                    <Card>
                        <CardContent className="pt-12">
                            <p className="text-center text-muted-foreground">
                                Selecione um cliente na lista para visualizar detalhes
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
