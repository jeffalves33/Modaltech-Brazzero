// components/admin/fornecedores-content.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

import { Edit, Plus, Phone, Mail, Trash2 } from "lucide-react"

type Supplier = {
    id: string
    name: string
    contact_name: string | null
    phone: string | null
    email: string | null
    notes: string | null
}

export function FornecedoresContent() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        name: "",
        contact_name: "",
        phone: "",
        email: "",
        notes: "",
    })

    const supabase = createClient()

    // ==========================
    // Carregar fornecedores
    // ==========================
    const loadSuppliers = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from("suppliers")
                .select("id, name, contact_name, phone, email, notes")
                .order("name", { ascending: true })

            if (error) throw error

            setSuppliers((data as Supplier[]) || [])
        } catch (err: any) {
            console.error("[FORNECEDORES] Erro ao carregar fornecedores:", err)
            setError("Erro ao carregar fornecedores.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadSuppliers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ==========================
    // Helpers de formulário
    // ==========================
    const resetForm = () => {
        setForm({
            name: "",
            contact_name: "",
            phone: "",
            email: "",
            notes: "",
        })
        setEditingSupplier(null)
    }

    const openNewDialog = () => {
        resetForm()
        setIsDialogOpen(true)
    }

    const openEditDialog = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setForm({
            name: supplier.name,
            contact_name: supplier.contact_name ?? "",
            phone: supplier.phone ?? "",
            email: supplier.email ?? "",
            notes: supplier.notes ?? "",
        })
        setIsDialogOpen(true)
    }

    const handleFormChange =
        (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }))
        }

    // ==========================
    // Salvar (create/update)
    // ==========================
    const handleSaveSupplier = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            if (!form.name.trim()) {
                throw new Error("Nome do fornecedor é obrigatório.")
            }

            const payload = {
                name: form.name.trim(),
                contact_name: form.contact_name.trim() || null,
                phone: form.phone.trim() || null,
                email: form.email.trim() || null,
                notes: form.notes.trim() || null,
            }

            if (editingSupplier) {
                const { error } = await supabase
                    .from("suppliers")
                    .update(payload)
                    .eq("id", editingSupplier.id)

                if (error) throw error
            } else {
                const { error } = await supabase.from("suppliers").insert(payload)
                if (error) throw error
            }

            await loadSuppliers()
            setIsDialogOpen(false)
            resetForm()
        } catch (err: any) {
            console.error("[FORNECEDORES] Erro ao salvar fornecedor:", err)
            setError(err.message || "Erro ao salvar fornecedor.")
        } finally {
            setSaving(false)
        }
    }

    // ==========================
    // Excluir fornecedor (DELETE)
    // ==========================
    const deleteSupplier = async (supplier: Supplier) => {
        const confirmed = window.confirm(
            `Tem certeza que deseja excluir o fornecedor "${supplier.name}"? Esta ação não pode ser desfeita.`,
        )

        if (!confirmed) return

        try {
            setSaving(true)
            setError(null)

            const { error } = await supabase
                .from("suppliers")
                .delete()
                .eq("id", supplier.id)

            if (error) throw error

            await loadSuppliers()
        } catch (err: any) {
            console.error("[FORNECEDORES] Erro ao excluir fornecedor:", err)
            setError(err.message || "Erro ao excluir fornecedor.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            <Card className="bg-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">Fornecedores</h1>
                        </div>
                        <Button
                            className="bg-black text-white hover:bg-gray-800 gap-2"
                            onClick={openNewDialog}
                            disabled={saving}
                        >
                            Novo fornecedor
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    {isLoading ? (
                        <p className="text-sm text-gray-500">Carregando fornecedores...</p>
                    ) : suppliers.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Nenhum fornecedor cadastrado ainda.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {suppliers.map((supplier) => (
                                <div
                                    key={supplier.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{supplier.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {supplier.contact_name
                                                ? supplier.contact_name
                                                : "Contato não informado"}
                                        </p>
                                        {supplier.notes && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Observação: {supplier.notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-gray-600 flex flex-col items-end gap-1">
                                            {supplier.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-4 h-4 text-gray-500" />
                                                    {supplier.phone}
                                                </span>
                                            )}
                                            {supplier.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-4 h-4 text-gray-500" />
                                                    {supplier.email}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => openEditDialog(supplier)}
                                                disabled={saving}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => deleteSupplier(supplier)}
                                                disabled={saving}
                                                title="Excluir fornecedor"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal de criar / editar fornecedor */}
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) {
                        resetForm()
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingSupplier ? "Editar fornecedor" : "Novo fornecedor"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveSupplier} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={handleFormChange("name")}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_name">Nome do contato</Label>
                            <Input
                                id="contact_name"
                                value={form.contact_name}
                                onChange={handleFormChange("contact_name")}
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                <Input
                                    id="phone"
                                    value={form.phone}
                                    onChange={handleFormChange("phone")}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleFormChange("email")}
                                    placeholder="contato@fornecedor.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Input
                                id="notes"
                                value={form.notes}
                                onChange={handleFormChange("notes")}
                                placeholder="Informações adicionais sobre o fornecedor"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving
                                    ? "Salvando..."
                                    : editingSupplier
                                        ? "Salvar alterações"
                                        : "Adicionar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
