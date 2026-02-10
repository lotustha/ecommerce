import { prisma } from "@/lib/db/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/auth";

// 🛠️ Helper: Converts Prisma Decimals/Dates to plain strings/numbers for Next.js
function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getFeaturedProducts() {
  noStore();
  try {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isArchived: false,
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 8,
    });
    return serializeData(products);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getNewArrivals() {
  noStore();
  try {
    const products = await prisma.product.findMany({
      where: {
        isArchived: false,
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 8,
    });
    return serializeData(products);
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  noStore();
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        variants: true,
        specs: {
          include: {
            attribute: true
          }
        },
        reviews: {
          include: {
            user: {
              select: { name: true, image: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
    return serializeData(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getSimilarProducts(categoryId: string, currentProductId: string) {
  noStore();
  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: currentProductId },
        isArchived: false,
      },
      include: {
        category: true,
        brand: true,
      },
      orderBy: {
        isFeatured: 'desc',
      },
      take: 4,
    });
    return serializeData(products);
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return [];
  }
}

// ⬇️ NEW: Fetch User Orders
export async function getUserOrders() {
  noStore();
  const session = await auth();

  if (!session?.user?.id) return [];

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: { images: true, slug: true } // Fetch image for display
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return serializeData(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}