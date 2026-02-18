"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import {
    createPathaoOrder,
    getPathaoCities,
    getPathaoZones,
    getPathaoAreas,
    getPathaoPricePlan,
    getPathaoOrderStatus
} from "@/lib/delivery/external-apis"

export async function fetchCities() { return await getPathaoCities(); }
export async function fetchZones(cityId: number) { return await getPathaoZones(cityId); }
export async function fetchAreas(zoneId: number) { return await getPathaoAreas(zoneId); }
export async function calculateShipping(data: any) { return await getPathaoPricePlan(data); }

export async function refreshTrackingStatus(orderId: string, consignmentId: string) {
    try {
        const info = await getPathaoOrderStatus(consignmentId);
        if (info && info.order_status) return { success: true, status: info.order_status };
        return { error: "Could not fetch info" };
    } catch (e) {
        return { error: "Failed to track" };
    }
}

export async function getAvailablePartners() { return ["Pathao", "Upaya", "Manual"]; }

export async function getAvailableRiders() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return [];
    return prisma.user.findMany({ where: { role: "RIDER" }, select: { id: true, name: true } });
}

export async function assignDelivery(orderId: string, data: any) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return { error: "Unauthorized" };

    try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return { error: "Order not found" };

        const updateData: any = {
            status: "SHIPPED",
            riderId: null,
            trackingCode: null,
            courier: null
        };

        if (data.method === "PATHAO") {
            const payload = {
                merchant_order_id: order.id,
                recipient_name: data.recipient_name,
                recipient_phone: data.recipient_phone,
                recipient_address: data.recipient_address,
                recipient_city: data.recipient_city,
                recipient_zone: data.recipient_zone,
                recipient_area: data.recipient_area,
                item_weight: data.item_weight,
                item_quantity: 1,
                amount_to_collect: order.paymentStatus === 'PAID' ? 0 : Number(order.totalAmount),
                item_type: 2,
                delivery_type: 48,
                // ✅ Use description from client if provided, else fallback
                item_description: data.item_description || `Order #${order.id.slice(-6)}`
            };

            const res = await createPathaoOrder(payload);

            if (!res.success) {
                return { error: res.error || "Failed to create order with Pathao" };
            }

            updateData.deliveryType = "EXTERNAL";
            updateData.courier = "Pathao";
            updateData.trackingCode = res.consignment_id;
        }

        else if (data.method === "RIDER") {
            if (!data.riderId) return { error: "Please select a rider" };
            updateData.deliveryType = "INTERNAL";
            updateData.riderId = data.riderId;
        }

        else if (data.method === "OTHER") {
            updateData.deliveryType = "EXTERNAL";
            updateData.courier = data.courierName;
            updateData.trackingCode = data.trackingId;
        }

        await prisma.order.update({ where: { id: orderId }, data: updateData });

        revalidatePath(`/dashboard/orders/${orderId}`);
        return { success: "Delivery assigned successfully" };

    } catch (error: any) {
        console.error("Delivery Assign Error:", error);
        return { error: error.message || "Internal Server Error" };
    }
}