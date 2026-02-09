import { prisma } from "@/lib/db/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getFeaturedProducts() {
  noStore();
  try {
    const products = await prisma.product.findMany({
      where: {
        isArchived: false,
        isFeatured: true,
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12, // Increased to fill the new grid
    });
    return products;
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

// ⬇️ NEW FUNCTION
export async function getProductBySlug(slug: string) {
  noStore();
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        variants: true, // Fetch variants (Size, Color)
        specs: {
          // Fetch technical specs
          include: {
            attribute: true,
          },
        },
        reviews: {
          // Fetch reviews (optional for now)
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

// ⬇️ NEW FUNCTION: Fetch similar products by category
export async function getSimilarProducts(
  categoryId: string,
  currentProductId: string,
) {
  noStore();
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: currentProductId }, // Exclude current product
        isArchived: false,
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        isFeatured: "desc", // Prioritize featured items
      },
      take: 4, // Show 4 recommendations
    });
    return products;
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return [];
  }
}
