"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { OrderStatus } from "../../generated/prisma/client"

async function requireAdmin() {
    const session = await auth()
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") {
        throw new Error("Unauthorized Access")
    }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
        await requireAdmin()

        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus }
        })

        revalidatePath("/dashboard/orders")
        revalidatePath(`/dashboard/orders/${orderId}`)
        return { success: `Order marked as ${newStatus}` }
    } catch (error) {
        console.error("Order Update Error:", error)
        return { error: "Failed to update order status" }
    }
}