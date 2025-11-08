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

interface MenuManagementProps {
  initialItems: MenuItem[]
  initialAddons: MenuAddon[]
}

export function MenuManagement({ initialItems, initialAddons }: MenuManagementProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

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

      // Busca adicionais habilitados para esse item
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("menu_item_addons")
          .select("menu_addon_id")
          .eq("menu_item_id", item.id)

        if (error) {
          console.error("Erro ao carregar adicionais do item:", error)
          setSelectedAddonIds([])
        } else {
          setSelectedAddonIds((data || []).map((row) => row.menu_addon_id))
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar adicionais do item:", err)
        setSelectedAddonIds([])
      }
    } else {
      resetForm()
      setSelectedAddonIds([]) // garantir limpo em item novo
    }
    setIsDialogOpen(true)
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

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving menu item:", error)
      alert("Erro ao salvar item")
    }
  }

  const handleDelete = async (id: string) => {

    const supabase = createClient()
    const { error } = await supabase.from("menu_items").delete().eq("id", id)

    if (error) {
      console.error("Error deleting item:", error)
      alert("Erro ao excluir item")
      return
    }

    setItems(items.filter((item) => item.id !== id))
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
      const { error } = await supabase
        .from("menu_addons")
        .delete()
        .eq("id", addonId)

      if (error) throw error

      setAddons((prev) => prev.filter((addon) => addon.id !== addonId))
    } catch (error) {
      console.error("Erro ao deletar adicional:", error)
    }
  }

  return (
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
                <div key={cat} className="p-2.5 border rounded-md bg-muted/50 text-sm">
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
                <DialogContent>
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
            <DialogContent>
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
    </div>
  )
}
