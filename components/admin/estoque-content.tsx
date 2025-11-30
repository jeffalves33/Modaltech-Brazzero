// components/admin/estoque-content.tsx
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

import { AlertTriangle, Package, RefreshCw, Edit2 } from "lucide-react"

type InventoryItem = {
  id: string
  name: string
  sku: string | null
  unit: string
  current_quantity: number
  minimum_quantity: number | null
  created_at: string
}

export function EstoqueContent() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal de criar / editar item
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemForm, setItemForm] = useState({
    name: "",
    sku: "",
    unit: "unid.",
    current_quantity: "0",
    minimum_quantity: "",
  })

  // Modal de renovação de estoque
  const [isReplenishDialogOpen, setIsReplenishDialogOpen] = useState(false)
  const [replenishItem, setReplenishItem] = useState<InventoryItem | null>(null)
  const [replenishQuantity, setReplenishQuantity] = useState("")
  const [replenishDescription, setReplenishDescription] = useState("")

  const [actionLoading, setActionLoading] = useState(false)

  // ======================
  // Carregar itens do banco
  // ======================
  const loadItems = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, sku, unit, current_quantity, minimum_quantity, created_at")
        .order("name", { ascending: true })

      if (error) throw error
      setItems((data as InventoryItem[]) || [])
    } catch (err: any) {
      console.error("[ESTOQUE] Erro ao carregar itens:", err)
      setError("Erro ao carregar itens de estoque.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const totalStockItems = items.length
  const lowStockItems = items.filter(
    (item) => item.minimum_quantity !== null && item.current_quantity <= (item.minimum_quantity ?? 0),
  )
  const lowStockCount = lowStockItems.length

  // ======================
  // Helpers de form
  // ======================
  const resetItemForm = () => {
    setItemForm({
      name: "",
      sku: "",
      unit: "unid.",
      current_quantity: "0",
      minimum_quantity: "",
    })
    setEditingItem(null)
  }

  const openCreateItemDialog = () => {
    resetItemForm()
    setIsItemDialogOpen(true)
  }

  const openEditItemDialog = (item: InventoryItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      sku: item.sku ?? "",
      unit: item.unit,
      current_quantity: String(item.current_quantity),
      minimum_quantity: item.minimum_quantity !== null ? String(item.minimum_quantity) : "",
    })
    setIsItemDialogOpen(true)
  }

  // ======================
  // Salvar (create/update) item de estoque
  // ======================
  const handleSaveItem = async (event: React.FormEvent) => {
    event.preventDefault()
    setActionLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const currentQuantityNumber = Number(
        String(itemForm.current_quantity).replace(",", "."),
      )
      const minimumQuantityNumber = itemForm.minimum_quantity
        ? Number(String(itemForm.minimum_quantity).replace(",", "."))
        : null

      if (!itemForm.name.trim()) {
        throw new Error("Nome é obrigatório.")
      }

      if (!itemForm.unit.trim()) {
        throw new Error("Unidade é obrigatória.")
      }

      const payload = {
        name: itemForm.name.trim(),
        sku: itemForm.sku.trim() || null,
        unit: itemForm.unit.trim(),
        current_quantity: isNaN(currentQuantityNumber) ? 0 : currentQuantityNumber,
        minimum_quantity:
          minimumQuantityNumber !== null && !isNaN(minimumQuantityNumber)
            ? minimumQuantityNumber
            : null,
      }

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from("inventory_items")
          .update(payload)
          .eq("id", editingItem.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase.from("inventory_items").insert(payload)
        if (error) throw error
      }

      await loadItems()
      setIsItemDialogOpen(false)
      resetItemForm()
    } catch (err: any) {
      console.error("[ESTOQUE] Erro ao salvar item:", err)
      setError(err.message || "Erro ao salvar item de estoque.")
    } finally {
      setActionLoading(false)
    }
  }

  // ======================
  // Renovar estoque (INSERT em inventory_movements + UPDATE em inventory_items)
  // ======================
  const openReplenishDialog = (item: InventoryItem) => {
    setReplenishItem(item)
    setReplenishQuantity("")
    setReplenishDescription("")
    setIsReplenishDialogOpen(true)
  }

  const handleReplenish = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!replenishItem) return

    setActionLoading(true)
    setError(null)

    try {
      const quantityNumber = Number(String(replenishQuantity).replace(",", "."))

      if (!quantityNumber || quantityNumber <= 0) {
        throw new Error("Informe uma quantidade válida para renovação.")
      }

      const supabase = createClient()

      // 1) Insere movimento de entrada
      const { error: movError } = await supabase.from("inventory_movements").insert({
        inventory_item_id: replenishItem.id,
        movement_type: "in",
        reason: "manual", // por enquanto, usamos 'manual'
        quantity: quantityNumber,
        description: replenishDescription || null,
      })

      if (movError) throw movError

      // 2) Atualiza quantidade atual no item
      const newQuantity = (replenishItem.current_quantity ?? 0) + quantityNumber

      const { error: updError } = await supabase
        .from("inventory_items")
        .update({ current_quantity: newQuantity })
        .eq("id", replenishItem.id)

      if (updError) throw updError

      await loadItems()
      setIsReplenishDialogOpen(false)
      setReplenishItem(null)
      setReplenishQuantity("")
      setReplenishDescription("")
    } catch (err: any) {
      console.error("[ESTOQUE] Erro ao renovar estoque:", err)
      setError(err.message || "Erro ao renovar estoque.")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estoque</h1>

      {/* Erro geral */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Cards de resumo - mantemos o layout original */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">Itens em estoque</p>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">{totalStockItems}</p>
            <p className="text-xs text-gray-500">
              Controle geral dos itens de estoque
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">Itens com estoque baixo</p>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{lowStockCount}</p>
            <p className="text-xs text-gray-500">
              Baseado no estoque mínimo configurado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">Valor total</p>
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </div>
            {/* Ainda não temos custo no schema, então deixo placeholder */}
            <p className="text-3xl font-bold mb-1">R$ 0,00</p>
            <p className="text-xs text-gray-500">
              Configure custos por item para calcular o valor total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Itens de estoque</h2>
              <p className="text-xs text-gray-500">
                Controle de insumos, bebidas e demais produtos de estoque
              </p>
            </div>
            <Button onClick={openCreateItemDialog}>Adicionar produto</Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando itens...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhum item de estoque cadastrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const isLow =
                  item.minimum_quantity !== null &&
                  item.current_quantity <= (item.minimum_quantity ?? 0)

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          SKU: {item.sku || "—"} | Unidade: {item.unit}
                        </p>
                        {item.minimum_quantity !== null && (
                          <p className="text-xs text-gray-500">
                            Mínimo: {item.minimum_quantity} {item.unit}
                          </p>
                        )}
                      </div>

                      {isLow && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                          <AlertTriangle className="w-3 h-3" />
                          Estoque baixo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {item.current_quantity} {item.unit}
                        </p>
                        <p className="text-xs text-gray-500">Quantidade atual</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditItemDialog(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => openReplenishDialog(item)}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Renovar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===========================
          MODAL: Criar / Editar item
          =========================== */}
      <Dialog
        open={isItemDialogOpen}
        onOpenChange={(open) => {
          setIsItemDialogOpen(open)
          if (!open) {
            resetItemForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar item de estoque" : "Adicionar item de estoque"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Código (opcional)</Label>
              <Input
                id="sku"
                value={itemForm.sku}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, sku: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  value={itemForm.unit}
                  onChange={(e) =>
                    setItemForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                  placeholder="ex: unid., pct., kg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_quantity">Quantidade atual</Label>
                <Input
                  id="current_quantity"
                  type="number"
                  step="1"
                  value={itemForm.current_quantity}
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      current_quantity: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_quantity">Estoque mínimo</Label>
                <Input
                  id="minimum_quantity"
                  type="number"
                  step="0.001"
                  value={itemForm.minimum_quantity}
                  onChange={(e) =>
                    setItemForm((prev) => ({
                      ...prev,
                      minimum_quantity: e.target.value,
                    }))
                  }
                  placeholder="opcional"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsItemDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading
                  ? "Salvando..."
                  : editingItem
                    ? "Salvar alterações"
                    : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===========================
          MODAL: Renovar estoque
          =========================== */}
      <Dialog
        open={isReplenishDialogOpen}
        onOpenChange={(open) => {
          setIsReplenishDialogOpen(open)
          if (!open) {
            setReplenishItem(null)
            setReplenishQuantity("")
            setReplenishDescription("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Renovar estoque
              {replenishItem ? ` - ${replenishItem.name}` : ""}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReplenish} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="replenish_quantity">Quantidade a adicionar</Label>
              <Input
                id="replenish_quantity"
                type="number"
                step="0.001"
                value={replenishQuantity}
                onChange={(e) => setReplenishQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replenish_description">
                Observação (opcional)
              </Label>
              <Input
                id="replenish_description"
                value={replenishDescription}
                onChange={(e) => setReplenishDescription(e.target.value)}
                placeholder="ex: compra em fornecedor X, ajuste, etc."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReplenishDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Aplicando..." : "Confirmar renovação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
