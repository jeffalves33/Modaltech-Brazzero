// app/admin/page.tsx
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/admin/dashboard-content"

const MS_IN_DAY = 24 * 60 * 60 * 1000

export default async function AdminDashboardPage() {
    const supabase = await createClient()
    const now = new Date()

    // janelas de tempo
    const start24h = new Date(now.getTime() - MS_IN_DAY)
    const startPrev24h = new Date(now.getTime() - 2 * MS_IN_DAY)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const last30Days = new Date(now.getTime() - 30 * MS_IN_DAY)
    const last7Days = new Date(now.getTime() - 7 * MS_IN_DAY)

    const toISO = (d: Date) => d.toISOString()

    const sumNumeric = (rows: { [key: string]: any }[] | null | undefined, field: string) =>
        (rows || []).reduce((acc, row) => acc + Number(row[field] ?? 0), 0)

    // ============ VENDAS 24h ============
    const { data: ordersLast24h } = await supabase
        .from("orders")
        .select("total")
        .eq("status", "entregue")
        .gte("created_at", toISO(start24h))
        .lte("created_at", toISO(now))

    const { data: ordersPrev24h } = await supabase
        .from("orders")
        .select("total")
        .eq("status", "entregue")
        .gte("created_at", toISO(startPrev24h))
        .lt("created_at", toISO(start24h))

    const salesLast24h = sumNumeric(ordersLast24h, "total")
    const salesPrev24h = sumNumeric(ordersPrev24h, "total")
    const salesLast24hDiff = salesPrev24h > 0 ? ((salesLast24h - salesPrev24h) / salesPrev24h) * 100 : null

    // ============ RECEITA MENSAL (por enquanto no card de CMV) ============
    const { data: ordersThisMonth } = await supabase
        .from("orders")
        .select("total")
        .eq("status", "entregue")
        .gte("created_at", toISO(startOfMonth))
        .lte("created_at", toISO(now))

    const { data: ordersPrevMonth } = await supabase
        .from("orders")
        .select("total")
        .eq("status", "entregue")
        .gte("created_at", toISO(startOfPrevMonth))
        .lt("created_at", toISO(startOfMonth))

    const monthlyRevenue = sumNumeric(ordersThisMonth, "total")
    const monthlyRevenuePrev = sumNumeric(ordersPrevMonth, "total")
    const monthlyRevenueDiff =
        monthlyRevenuePrev > 0
            ? ((monthlyRevenue - monthlyRevenuePrev) / monthlyRevenuePrev) * 100
            : null

    // ============ DESPESAS DO MÊS ============
    const { data: expensesThisMonth } = await supabase
        .from("cash_expenses")
        .select("amount")
        .gte("created_at", toISO(startOfMonth))
        .lte("created_at", toISO(now))

    const monthlyExpenses = sumNumeric(expensesThisMonth, "amount")
    const monthlyExpensesCount = expensesThisMonth?.length ?? 0

    // ============ CLIENTES ATIVOS / NOVOS ============
    const { data: recentOrders } = await supabase
        .from("orders")
        .select("customer_id")
        .eq("status", "entregue")
        .gte("created_at", toISO(last30Days))

    const activeCustomers = new Set(
        (recentOrders || []).map((o) => o.customer_id).filter(Boolean),
    ).size

    const { data: newCustomers } = await supabase
        .from("customers")
        .select("id")
        .gte("created_at", toISO(last7Days))

    const newCustomersWeek = newCustomers?.length ?? 0

    // ============ MAIS VENDIDOS (últimos 30 dias) ============
    const { data: itemsLast30d } = await supabase
        .from("order_items")
        .select("quantity, menu_item:menu_items(name)")
        .gte("created_at", toISO(last30Days))

    const salesByProduct = new Map<string, number>()
    for (const row of itemsLast30d || []) {
        const name = row.menu_item?.name ?? "Sem nome"
        const qty = Number(row.quantity ?? 0)
        salesByProduct.set(name, (salesByProduct.get(name) ?? 0) + qty)
    }

    const mostSold = Array.from(salesByProduct.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, qty], index) => ({
            rank: index < 3 ? index + 1 : undefined,
            name,
            change: null as string | null, // por enquanto sem tendência
            sales: `${qty} un`,
        }))

    // ============ ESTOQUE BAIXO ============
    const { data: inventory } = await supabase
        .from("inventory_items")
        .select("name, current_quantity, unit, minimum_quantity")

    const lowStock = (inventory || [])
        .filter((item) => {
            const current = Number(item.current_quantity ?? 0)
            const min = Number(item.minimum_quantity ?? 0)
            return min > 0 && current <= min
        })
        .sort(
            (a, b) =>
                Number(a.current_quantity ?? 0) - Number(b.current_quantity ?? 0),
        )
        .slice(0, 10)
        .map((item) => ({
            name: item.name as string,
            quantity: `${Number(item.current_quantity ?? 0)} ${item.unit ?? ""}`.trim(),
        }))

    return (
        <DashboardContent
            salesLast24h={salesLast24h}
            salesLast24hDiff={salesLast24hDiff}
            monthlyRevenue={monthlyRevenue}
            monthlyRevenueDiff={monthlyRevenueDiff}
            monthlyExpenses={monthlyExpenses}
            monthlyExpensesCount={monthlyExpensesCount}
            activeCustomers={activeCustomers}
            newCustomersWeek={newCustomersWeek}
            mostSold={mostSold}
            lowStock={lowStock}
        />
    )
}
