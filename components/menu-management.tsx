"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MenuItem } from "@/lib/types"
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
}

export function MenuManagement({ initialItems }: MenuManagementProps) {
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [categories, setCategories] = useState<string[]>(Array.from(new Set(initialItems.map((item) => item.category))))
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    is_available: true,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      is_available: true,
    })
    setEditingItem(null)
  }

  const openDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || "",
        category: item.category,
        price: item.price.toString(),
        is_available: item.is_available,
      })
    } else {
      resetForm()
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
      if (editingItem) {
        const { data, error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id)
          .select()
          .single()

        if (error) throw error
        setItems(items.map((item) => (item.id === editingItem.id ? data : item)))
      } else {
        const { data, error } = await supabase.from("menu_items").insert(itemData).select().single()

        if (error) throw error
        setItems([...items, data])
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

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {/* Categories Sidebar */}
      <Card className="lg:col-span-1 h-fit">
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
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
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
                <div className="space-y-2">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_available">Disponível</Label>
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                </div>
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
