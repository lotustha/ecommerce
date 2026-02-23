"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"

export async function markAsDelivered(orderId: string) {
    const session = await auth();

    if (!session || session.user.role !== "RIDER") {
        return { error: "Unauthorized access. Rider privileges required." };
    }

    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) return { error: "Order not found" };
        if (order.riderId !== session.user.id) return { error: "This order is not assigned to you." };

        const updateData: any = {
            status: "DELIVERED"
        };

        // If it was Cash on Delivery and unpaid, the rider has collected the cash.
        if (order.paymentMethod === "COD" && order.paymentStatus !== "PAID") {
            updateData.paymentStatus = "PAID";
        }

        await prisma.order.update({
            where: { id: orderId },
            data: updateData
        });

        revalidatePath("/rider");
        return { success: "Order successfully marked as delivered!" };

    } catch (error) {
        console.error("Rider Delivery Error:", error);
        return { error: "Failed to update order status." };
    }
}