"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ReviewSchema = z.object({
    productId: z.string(),
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().min(5, "Comment must be at least 5 characters"),
})

export async function submitReview(data: z.infer<typeof ReviewSchema>) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "You must be logged in to review." }
    }

    const validated = ReviewSchema.safeParse(data)
    if (!validated.success) {
        return { error: "Invalid review data." }
    }

    const { productId, rating, comment } = validated.data
    const userId = session.user.id

    try {
        // ✅ 1. Verify Purchase: Must have a DELIVERED order containing this product
        const hasPurchased = await prisma.order.findFirst({
            where: {
                userId,
                status: "DELIVERED", // Only users who have received the item
                items: {
                    some: { productId }
                }
            }
        })

        if (!hasPurchased) {
            return { error: "You can only review products you have purchased and received." }
        }

        // ✅ 2. Check for Duplicate Reviews
        const existingReview = await prisma.review.findFirst({
            where: { userId, productId }
        })

        if (existingReview) {
            return { error: "You have already reviewed this product." }
        }

        // 3. Create Review
        await prisma.review.create({
            data: {
                userId,
                productId,
                rating,
                comment
            }
        })

        revalidatePath(`/product/${productId}`)
        return { success: "Review submitted successfully!" }

    } catch (error) {
        console.error("Review Error:", error)
        return { error: "Failed to submit review." }
    }
}