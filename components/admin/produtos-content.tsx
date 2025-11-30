// components/admin/produtos-content.tsx
"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MenuItem } from "@/lib/types"
import type { MenuAddon } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InventoryItem {
  id: string
  name: string
  unit: string
}

interface ProdutosContentProps {
  initialItems: MenuItem[]
  initialAddons: MenuAddon[]
  inventoryItems?: InventoryItem[]
}

interface IngredientSelection {
  inventory_item_id: string
  quantity: string // string para usar em input
}

export function ProdutosContent({ initialItems, initialAddons, inventoryItems = [], }: ProdutosContentProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [ingredientSelections, setIngredientSelections] = useState<IngredientSelection[]>([])
  const [addons, setAddons] = useState<MenuAddon[]>(initialAddons)
  const [editingAddon, setEditingAddon] = useState<MenuAddon | null>(null)
  const [isAddonDialogOpen, setIsAddonDialogOpen] = useState(false)
  const [showAddAddons, setShowAddAddons] = useState(false)
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])

  const [categories, setCategories] = useState<string[]>(Array.from(new Set(initialItems.map((item) => item.category))))
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newAddonsName, setNewAddonsName] = useState("")
  const [newAddonsValue, setNewAddonsValue] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    is_available: true,
  })
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      is_available: true,
    })
    setEditingItem(null)
    setSelectedAddonIds([])
    setIngredientSelections([])
  }

  const openDialog = async (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || "",
        category: item.category,
        price: item.price.toString(),
        is_available: item.is_available,
      })

      try {
        const supabase = createClient()

        // 1) adicionais
        const { data: addonRows, error: addonError } = await supabase
          .from("menu_item_addons")
          .select("menu_addon_id")
          .eq("menu_item_id", item.id)

        if (addonError) {
          console.error("Erro ao carregar adicionais do item:", addonError)
          setSelectedAddonIds([])
        } else {
          setSelectedAddonIds((addonRows || []).map((row) => row.menu_addon_id))
        }

        // 2) ingredientes
        const { data: ingredientRows, error: ingredientError } = await supabase
          .from("menu_item_ingredients")
          .select("inventory_item_id, quantity")
          .eq("menu_item_id", item.id)

        if (ingredientError) {
          console.error("Erro ao carregar ingredientes do item:", ingredientError)
          setIngredientSelections([])
        } else {
          setIngredientSelections(
            (ingredientRows || []).map((row) => ({
              inventory_item_id: row.inventory_item_id,
              quantity: row.quantity.toString(),
            })),
          )
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar dados do item:", err)
        setSelectedAddonIds([])
        setIngredientSelections([])
      }
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const updateIngredientSelection = (inventoryItemId: string, quantityStr: string) => {
    setIngredientSelections((prev) => {
      const qty = quantityStr.trim()
      const existing = prev.find((i) => i.inventory_item_id === inventoryItemId)

      if (!qty || Number.parseFloat(qty) <= 0) {
        // remove se vazio ou zero
        return prev.filter((i) => i.inventory_item_id !== inventoryItemId)
      }

      if (existing) {
        return prev.map((i) =>
          i.inventory_item_id === inventoryItemId ? { ...i, quantity: qty } : i,
        )
      }

      return [...prev, { inventory_item_id: inventoryItemId, quantity: qty }]
    })
  }

  const handleAddCategory = () => {
    if (!newCategory.trim()) return
    if (categories.includes(newCategory)) {
      alert("Categoria já existe")
      return
    }
    setCategories([...categories, newCategory])
    setNewCategory("")
    setShowAddCategory(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    if (!formData.category) {
      alert("Selecione uma categoria")
      return
    }

    const itemData = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      price: Number.parseFloat(formData.price),
      is_available: formData.is_available,
    }

    try {
      let savedItem: MenuItem

      if (editingItem) {
        const { data, error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id)
          .select()
          .single()

        if (error) throw error

        savedItem = data
        setItems(items.map((item) => (item.id === editingItem.id ? data : item)))
      } else {
        const { data, error } = await supabase
          .from("menu_items")
          .insert(itemData)
          .select()
          .single()

        if (error) throw error

        savedItem = data
        setItems([...items, data])
      }

      // 1) apaga todas as associações antigas desse item
      const { error: deleteError } = await supabase
        .from("menu_item_addons")
        .delete()
        .eq("menu_item_id", savedItem.id)

      if (deleteError) throw deleteError

      // 2) insere as novas associações (se houver)
      if (selectedAddonIds.length > 0) {
        const rows = selectedAddonIds.map((addonId) => ({
          menu_item_id: savedItem.id,
          menu_addon_id: addonId,
        }))

        const { error: insertError } = await supabase
          .from("menu_item_addons")
          .insert(rows)

        if (insertError) throw insertError
      }

      // Ingredientes (receita)
      const { error: deleteIngredientsError } = await supabase
        .from("menu_item_ingredients")
        .delete()
        .eq("menu_item_id", savedItem.id)

      if (deleteIngredientsError) throw deleteIngredientsError

      const ingredientRows = ingredientSelections
        .map((sel) => ({
          menu_item_id: savedItem.id,
          inventory_item_id: sel.inventory_item_id,
          quantity: Number.parseFloat(sel.quantity),
        }))
        .filter((row) => !Number.isNaN(row.quantity) && row.quantity > 0)

      if (ingredientRows.length > 0) {
        const { error: insertIngredientsError } = await supabase
          .from("menu_item_ingredients")
          .insert(ingredientRows)

        if (insertIngredientsError) throw insertIngredientsError
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving menu item:", error)
      alert("Erro ao salvar item")
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    try {
      // Delega a decisão (apagar x arquivar) para o banco
      const { error } = await supabase.rpc("safe_archive_menu_item", { p_id: id })
      if (error) throw error

      // Remove da lista (não exibimos arquivados)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error archiving/deleting item:", error)
      alert("Não foi possível remover o item (arquivar ou deletar).")
    }
  }

  const toggleAvailability = async (item: MenuItem) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating availability:", error)
      return
    }

    setItems(items.map((i) => (i.id === item.id ? data : i)))
  }

  const handleUpdateAddonPrice = async (addonId: string, newPrice: string) => {
    const price = parseFloat(newPrice)
    if (isNaN(price) || price < 0) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("menu_addons")
        .update({ price })
        .eq("id", addonId)

      if (error) throw error

      // Atualiza o estado local
      setAddons((prev) =>
        prev.map((addon) =>
          addon.id === addonId ? { ...addon, price } : addon
        )
      )
    } catch (error) {
      console.error("Erro ao atualizar preço:", error)
    }
  }

  // Função para abrir dialog de edição
  const openAddonDialog = (addon?: MenuAddon) => {
    if (addon) {
      setEditingAddon(addon)
      setNewAddonsName(addon.name)
      setNewAddonsValue(addon.price.toString())
    } else {
      setEditingAddon(null)
      setNewAddonsName("")
      setNewAddonsValue("")
    }
    setIsAddonDialogOpen(true)
  }

  // Função para salvar (criar ou editar)
  const handleSaveAddon = async () => {
    if (!newAddonsName || !newAddonsValue) return

    const price = parseFloat(newAddonsValue)
    if (isNaN(price) || price < 0) return

    try {
      const supabase = createClient()

      if (editingAddon) {
        // Editar
        const { error } = await supabase
          .from("menu_addons")
          .update({ name: newAddonsName, price })
          .eq("id", editingAddon.id)

        if (error) throw error

        setAddons((prev) =>
          prev.map((addon) =>
            addon.id === editingAddon.id
              ? { ...addon, name: newAddonsName, price }
              : addon
          )
        )
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from("menu_addons")
          .insert({ name: newAddonsName, price })
          .select()
          .single()

        if (error) throw error
        if (data) setAddons((prev) => [...prev, data])
      }

      setIsAddonDialogOpen(false)
      setNewAddonsName("")
      setNewAddonsValue("")
      setEditingAddon(null)
    } catch (error) {
      console.error("Erro ao salvar adicional:", error)
    }
  }

  // Função para deletar
  const handleDeleteAddon = async (addonId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc("safe_archive_menu_addon", { p_id: addonId })
      if (error) throw error
      setAddons((prev) => prev.filter((a) => a.id !== addonId))
    } catch (error) {
      console.error("Erro ao arquivar/deletar adicional:", error)
      alert("Não foi possível remover o adicional.")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Produtos</h1>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 space-y-6">
          {/* Categories Sidebar */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Categorias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat} className="p-2.5 border rounded-md bg-muted/50 text-sm flex items-center justify-between">
                    {cat}
                  </div>
                ))}
              </div>
              {!showAddCategory && (
                <Button type="button" variant="outline" onClick={() => setShowAddCategory(true)} className="w-full mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              )}
              {showAddCategory && (
                <div className="space-y-2 p-2 border rounded-lg mt-3">
                  <Input
                    placeholder="Nome da categoria"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAddCategory(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleAddCategory} className="flex-1">
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addons Sidebar */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Adicionais</CardTitle>
                <Dialog open={isAddonDialogOpen} onOpenChange={setIsAddonDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-transparent"
                      onClick={() => openAddonDialog()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAddon ? "Editar Adicional" : "Novo Adicional"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          value={newAddonsName}
                          onChange={(e) => setNewAddonsName(e.target.value)}
                          placeholder="Nome do adicional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preço (R$) *</Label>
                        <Input
                          value={newAddonsValue}
                          type="number"
                          step="0.01"
                          min="0"
                          onChange={(e) => setNewAddonsValue(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setIsAddonDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSaveAddon}
                          className="flex-1"
                        >
                          {editingAddon ? "Salvar" : "Adicionar"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {addons.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-2 p-2.5 border rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => openAddonDialog(addon)}
                  >
                    <span className="text-sm">{addon.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <span className="text-sm font-medium">{addon.price.toFixed(2)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteAddon(addon.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Display */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()} className="">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Categoria, Preço e Disponível na mesma linha */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4 space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-4 space-y-2">
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>

                    <div className="col-span-3 space-y-2">
                      <Label htmlFor="is_available">Disponível</Label>
                      <div className="flex items-center h-10">
                        <Switch
                          id="is_available"
                          checked={formData.is_available}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {addons.length > 0 && (
                    <div className="space-y-2">
                      <Label>Adicionais permitidos</Label>
                      <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                        {addons.map((addon) => {
                          const checked = selectedAddonIds.includes(addon.id)
                          return (
                            <div
                              key={addon.id}
                              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted/60"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{addon.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(addon.price)}
                                </span>
                              </div>
                              <Switch
                                checked={checked}
                                onCheckedChange={(isChecked) => {
                                  setSelectedAddonIds((prev) =>
                                    isChecked
                                      ? [...prev, addon.id]
                                      : prev.filter((id) => id !== addon.id)
                                  )
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {inventoryItems.length > 0 && (
                    <div className="space-y-2">
                      <Label>Insumos (receita por unidade)</Label>
                      <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                        {inventoryItems.map((inv) => {
                          const sel = ingredientSelections.find(
                            (s) => s.inventory_item_id === inv.id,
                          )

                          return (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted/60"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{inv.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Unidade: {inv.unit}
                                </span>
                              </div>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24 h-8 text-right"
                                value={sel?.quantity ?? ""}
                                onChange={(e) =>
                                  updateIngredientSelection(inv.id, e.target.value)
                                }
                                placeholder="0"
                              />
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Informe quanto de cada insumo é consumido por 1 unidade desse item
                        (ex.: X-tudo usa 2 fatias de queijo).
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingItem ? "Salvar" : "Adicionar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {categories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.name}</h4>
                            {!item.is_available && <Badge variant="secondary">Indisponível</Badge>}
                          </div>
                          {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                          <p className="text-sm font-semibold mt-1">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={item.is_available} onCheckedChange={() => toggleAvailability(item)} />
                          <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div></div>
  )
}


/*"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Edit, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"


export function ProdutosContent() {
  const [activeTab, setActiveTab] = useState("produtos")

  const productsData = [
    { name: "Brazza Bacon", additionals: 7, price: "R$28,00", active: true },
    { name: "Brazza Burger", additionals: 5, price: "R$22,00", active: true },
    { name: "Supremo bacon", additionals: 6, price: "R$38,00", active: true },
    { name: "Supremo bacon", additionals: null, price: "R$24,00", active: true, combo: "Frango Brazza" },
    {
      name: "Refri lata 350ml",
      additionals: null,
      price: "R$24,00",
      active: true,
      types: "5 Tipos",
      extra: "7 Adicionais",
    },
    { name: "Brazza Bacon", price: "R$28,00", active: false },
  ]

  const combosData = [
    { name: "Combo Brazza Bacon", items: "Burger + Fritas + Refri", price: "R$42,00", active: true },
    { name: "Combo Supremo", items: "Burger + Fritas + Refri", price: "R$52,00", active: true },
    { name: "Combo Duo", items: "2 Burgers + 2 Refris", price: "R$68,00", active: true },
    { name: "Combo Família", items: "4 Burgers + 4 Fritas + 4 Refris", price: "R$135,00", active: true },
  ]

  const additionalsData = [
    { name: "Queijo Cheddar", price: "R$3,00", active: true },
    { name: "Bacon Extra", price: "R$4,00", active: true },
    { name: "Ovo", price: "R$2,00", active: true },
    { name: "Cebola Caramelizada", price: "R$3,50", active: true },
    { name: "Molho Especial", price: "R$2,50", active: true },
    { name: "Picles", price: "R$1,50", active: true },
    { name: "Alface e Tomate", price: "R$2,00", active: true },
  ]

  const categoriesData = [
    { name: "Burgers", qtd: 12, active: true },
    { name: "Bebidas", qtd: 8, active: true },
    { name: "Acompanhamentos", qtd: 6, active: true },
    { name: "Sobremesas", qtd: 4, active: true },
    { name: "Molhos", qtd: 5, active: true },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "produtos":
        return renderProducts()
      case "combos":
        return renderCombos()
      case "adicionais":
        return renderAdditionals()
      case "categorias":
        return renderCategories()
      default:
        return renderProducts()
    }
  }

  const renderProducts = () => (
    <>
      <div className="px-4 md:px-6 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">BURGERS</h3>
      </div>
      {productsData.map((product, index) => (
        <div
          key={index}
          className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50"
        >
          <div className="flex flex-wrap items-center gap-2 md:gap-4 flex-1">
            <span className="text-sm font-medium">{product.name}</span>
            {product.combo && <span className="text-sm text-gray-600">{product.combo}</span>}
            {product.additionals && (
              <span className="px-3 py-1 bg-black text-white text-xs rounded-full whitespace-nowrap">
                {product.additionals} Adicionais
              </span>
            )}
            {product.types && (
              <>
                <span className="px-3 py-1 bg-gray-800 text-white text-xs rounded-full">{product.types}</span>
                {product.extra && (
                  <span className="px-3 py-1 bg-gray-800 text-white text-xs rounded-full">{product.extra}</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm font-semibold">{product.price}</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", product.active ? "bg-green-500" : "bg-gray-300")} />
              <span className="text-xs text-gray-600">Ativo</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </>
  )

  const renderCombos = () => (
    <>
      <div className="px-4 md:px-6 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">COMBOS</h3>
      </div>
      {combosData.map((combo, index) => (
        <div
          key={index}
          className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50"
        >
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium">{combo.name}</span>
            <span className="text-xs text-gray-500">{combo.items}</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm font-semibold">{combo.price}</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", combo.active ? "bg-green-500" : "bg-gray-300")} />
              <span className="text-xs text-gray-600">Ativo</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </>
  )

  const renderAdditionals = () => (
    <>
      <div className="px-4 md:px-6 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">ADICIONAIS</h3>
      </div>
      {additionalsData.map((additional, index) => (
        <div
          key={index}
          className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50"
        >
          <span className="text-sm font-medium flex-1">{additional.name}</span>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-sm font-semibold">{additional.price}</span>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", additional.active ? "bg-green-500" : "bg-gray-300")} />
              <span className="text-xs text-gray-600">Ativo</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </>
  )

  const renderCategories = () => (
    <>
      <div className="px-4 md:px-6 py-3 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">CATEGORIAS</h3>
      </div>
      {categoriesData.map((category, index) => (
        <div
          key={index}
          className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-medium">{category.name}</span>
            <span className="text-xs text-gray-500">{category.qtd} produtos</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", category.active ? "bg-green-500" : "bg-gray-300")} />
              <span className="text-xs text-gray-600">Ativo</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      ))}
    </>
  )

  return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Pesquisar produtos..." className="pl-10 bg-white" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="w-3 h-3 rounded-full bg-black flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">Taxa de entrega</span>
              <Input defaultValue="R$ 2,00" className="w-24 bg-white text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 md:gap-6 border-b border-gray-200 overflow-x-auto">
          {["Produtos", "Combos", "Adicionais", "Categorias"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.toLowerCase()
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <Card className="bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y">{renderTabContent()}</div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button className="bg-black text-white hover:bg-gray-800 gap-2 w-full md:w-auto">
            <span className="hidden sm:inline">Adicionar produto</span>
            <span className="sm:hidden">Adicionar</span>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
  )
}*/