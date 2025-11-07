"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCustomer(name: string, phone: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("customers")
        .insert({ name: name.trim(), phone: phone.replace(/\D/g, "") })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath("/clientes")
    return data
}

export async function updateCustomer(id: string, name: string, phone: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("customers")
        .update({ name: name.trim(), phone: phone.replace(/\D/g, "") })
        .eq("id", id)

    if (error) throw new Error(error.message)
    revalidatePath("/clientes")
}

export async function deleteCustomer(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from("customers").delete().eq("id", id)

    if (error) throw new Error(error.message)
    revalidatePath("/clientes")
}

export async function addCustomerAddress(customerId: string, address: any) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("customer_addresses")
        .insert({
            customer_id: customerId,
            street: address.street.trim(),
            number: address.number.trim(),
            complement: address.complement?.trim() || null,
            neighborhood: address.neighborhood.trim(),
            city: address.city.trim(),
            state: address.state.trim().toUpperCase(),
            reference: address.reference?.trim() || null,
            is_default: address.is_default ?? false,
        })
        .select()

    if (error) throw new Error(error.message)
    revalidatePath("/clientes")
    return data
}

export async function deleteCustomerAddress(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from("customer_addresses").delete().eq("id", id)

    if (error) throw new Error(error.message)
    revalidatePath("/clientes")
}

export async function getCustomerAddresses(customerId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true })

    if (error) throw error
    return data
}
