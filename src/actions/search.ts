"use server";

import { prisma } from "@/lib/db/prisma";

export async function getSearchSuggestions(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
          { category: { name: { contains: query } } },
        ],
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        discountPrice: true,
        images: true,
        description: true,
        category: {
          select: { name: true },
        },
      },
      take: 5, // Limit suggestions
    });

    // Format for frontend
    return products.map((product) => {
      let image = "/placeholder.jpg";
      try {
        const parsed = product.images ? JSON.parse(product.images) : [];
        if (Array.isArray(parsed) && parsed.length > 0) image = parsed[0];
      } catch (e) {}

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        discountPrice: product.discountPrice
          ? Number(product.discountPrice)
          : null,
        image,
        category: product.category.name,
        description: product.description
          ? product.description.substring(0, 50) + "..."
          : "",
      };
    });
  } catch (error) {
    console.error("Search suggestion error:", error);
    return [];
  }
}
