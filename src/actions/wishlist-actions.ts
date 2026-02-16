"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"

export async function toggleWishlist(productId: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: "Please log in to manage your wishlist." }
    }

    const userId = session.user.id

    try {
        // Check if already in wishlist using compound key
        const existingEntry = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId
                }
            }
        })

        if (existingEntry) {
            // Remove
            await prisma.wishlist.delete({
                where: {
                    userId_productId: { userId, productId }
                }
            })
            revalidatePath("/wishlist")
            return { success: "Removed from wishlist", isWishlisted: false }
        } else {
            // Add
            await prisma.wishlist.create({
                data: {
                    userId,
                    productId
                }
            })
            revalidatePath("/wishlist")
            return { success: "Added to wishlist", isWishlisted: true }
        }

    } catch (error) {
        console.error("Wishlist Error:", error)
        return { error: "Failed to update wishlist" }
    }
}