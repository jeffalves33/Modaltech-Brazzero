export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "operator"
  created_at: string
  updated_at: string
}

export interface CashSession {
  id: string
  opened_by: string
  opened_at: string
  closed_at: string | null
  closed_by: string | null
  initial_amount: number
  final_amount: number | null
  total_sales: number | null
  total_expenses: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CashExpense {
  id: string
  cash_session_id: string
  description: string
  amount: number
  category: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  id?: string
  customer_id?: string
  street: string
  number: string
  complement?: string | null
  neighborhood: string
  city: string
  state: string
  zip_code?: string | null
  reference?: string | null
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  image_url: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export type OrderStatus = "em_producao" | "em_rota" | "entregue" | "cancelado"
export type PaymentMethod = "dinheiro" | "pix" | "cartao_debito" | "cartao_credito"

export interface Order {
  id: string
  order_number: number
  customer_id: string
  address_id: string
  cash_session_id: string | null
  status: OrderStatus
  payment_method: PaymentMethod
  subtotal: number
  delivery_fee: number
  total: number
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  customer?: Customer
  address?: CustomerAddress
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  subtotal: number
  notes: string | null
  created_at: string
  updated_at: string
  menu_item?: MenuItem
}

export interface CartItem {
  menu_item: MenuItem
  quantity: number
  notes: string
}
