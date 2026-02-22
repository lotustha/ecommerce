"use server"

import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { cancelPathaoOrder } from "@/lib/delivery/external-apis"
import { DeliveryType } from "../../generated/prisma/enums"

export async function cancelDeliveryAssignment(orderId: string) {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        return { error: "Unauthorized access" };
    }

    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return { error: "Order not found" };

        // 1. If it's a Pathao order, attempt to cancel it via their API first
        if (order.trackingCode && order.courier === "Pathao") {
            const cancelledInPathao = await cancelPathaoOrder(order.trackingCode);

            if (!cancelledInPathao) {
                console.warn(`Pathao API cancellation failed for ${order.trackingCode}. The package might already be processed.`);
                // Note: Even if it fails (e.g. status is past 'Pending'), we still clear it locally below
                // so the admin isn't permanently locked out of reassigning in the dashboard.
            }
        }

        // 2. Clear the local database assignment fields
        await prisma.order.update({
            where: { id: orderId },
            data: {
                riderId: null,
                trackingCode: null,
                courier: null,
                deliveryType: DeliveryType.INTERNAL,
            }
        });

        revalidatePath(`/dashboard/orders/${orderId}`);
        return { success: "Delivery assignment has been successfully cancelled." };

    } catch (error) {
        console.error("Cancel Delivery Error:", error);
        return { error: "Failed to cancel delivery assignment." };
    }
}