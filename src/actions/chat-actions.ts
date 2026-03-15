"use server"

import { prisma } from "@/lib/db/prisma"

export async function getProductContext(slug: string) {
    if (!slug) return null;

    try {
        const product = await prisma.product.findUnique({
            where: { slug },
            select: { name: true, price: true, discountPrice: true, images: true }
        });

        if (!product) return null;

        let image = "/placeholder.jpg";
        try {
            const parsed = JSON.parse(product.images as string);
            if (parsed.length > 0) image = parsed[0];
        } catch (e) { }

        const finalPrice = product.discountPrice ? Number(product.discountPrice) : Number(product.price);

        return {
            name: product.name,
            price: finalPrice,
            image
        };
    } catch (error) {
        console.error("Failed to fetch product context:", error);
        return null;
    }
}