"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

// Input Schema matches the frontend checkout form + items
const PlaceOrderSchema = z.object({
    fullName: z.string(),
    phone: z.string(),
    province: z.string(),
    city: z.string(),
    street: z.string(),
    paymentMethod: z.enum(["COD", "ESEWA", "KHALTI"]),
    items: z.array(z.object({
        productId: z.string(),
        variantId: z.string().nullable().optional(),
        quantity: z.number().min(1),
    }))
})

export async function placeOrder(values: z.infer<typeof PlaceOrderSchema>) {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
        return { error: "You must be logged in to place an order." }
    }

    const validated = PlaceOrderSchema.safeParse(values)
    if (!validated.success) {
        return { error: "Invalid order data." }
    }

    const { items, paymentMethod, ...address } = validated.data

    // 1. Calculate Totals Server-Side (Security: Don't trust client prices)
    let subTotal = 0
    const orderItemsData = []

    for (const item of items) {
        const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { variants: true }
        })

        if (!product) continue // Skip invalid products

        // Determine Price
        let price = Number(product.price)

        // If variant is selected, check variant price
        if (item.variantId) {
            const variant = product.variants.find(v => v.id === item.variantId)
            if (variant) {
                price = Number(variant.price)
            }
        }

        // Check for Discount (Override if present and lower)
        if (product.discountPrice) {
            const discount = Number(product.discountPrice)
            if (discount < price) price = discount
        }

        const lineTotal = price * item.quantity
        subTotal += lineTotal

        orderItemsData.push({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: price, // Store unit price at time of purchase
            name: product.name, // Snapshot name
        })
    }

    const shippingCost = 150 // Fixed for now
    const totalAmount = subTotal + shippingCost

    try {
        // 2. Database Transaction
        // We create the order and order items in one atomic operation
        const order = await prisma.order.create({
            data: {
                userId,
                status: "PENDING",
                paymentStatus: "UNPAID",
                paymentMethod,
                deliveryType: "EXTERNAL",

                // Save Address Snapshot
                shippingAddress: JSON.stringify(address),
                phone: address.phone,

                // Financials
                subTotal,
                shippingCost,
                totalAmount,

                // Items
                items: {
                    create: orderItemsData
                }
            }
        })

        return { success: "Order placed successfully!", orderId: order.id }

    } catch (error) {
        console.error("Order Placement Error:", error)
        return { error: "Failed to place order. Please try again." }
    }
}