import { prisma } from "@/lib/db/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "../../../generated/prisma/client";
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
        createdAt: "desc",
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
        createdAt: "desc",
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
            attribute: true,
          },
        },
        reviews: {
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
    return serializeData(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getSimilarProducts(
  categoryId: string,
  currentProductId: string,
) {
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
        isFeatured: "desc",
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
              select: { images: true, slug: true }, // Fetch image for display
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return serializeData(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

// ⬇️ NEW: Advanced Search Function
export interface SearchParams {
  q?: string;
  category?: string;
  brand?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}
const ITEMS_PER_PAGE = 12;

export async function searchProducts(params: SearchParams) {
  noStore();
  const { q, category, brand, minPrice, maxPrice, sort, page = "1" } = params;

  const where: Prisma.ProductWhereInput = {
    isArchived: false,
  };

  if (q) {
    where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (brand) {
    const brands = Array.isArray(brand) ? brand : brand.split(",");
    if (brands.length > 0) {
      where.brand = { slug: { in: brands } };
    }
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };
  if (sort === "name_asc") orderBy = { name: "asc" };

  // Pagination Logic
  const currentPage = Number(page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Run two queries in parallel: Get items AND Get total count
    const [products, totalCount] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: { category: true, brand: true },
        orderBy,
        take: ITEMS_PER_PAGE,
        skip,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: serializeData(products),
      totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
      currentPage,
      totalCount,
    };
  } catch (error) {
    console.error("Search Error:", error);
    return { products: [], totalPages: 0, currentPage: 1, totalCount: 0 };
  }
}

export async function getFilterMetadata() {
  noStore();
  const [categories, brands, priceAgg] = await Promise.all([
    prisma.category.findMany({
      select: {
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.brand.findMany({
      select: {
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.product.aggregate({ _max: { price: true }, _min: { price: true } }),
  ]);

  return {
    categories,
    brands,
    priceRange: {
      min: Number(priceAgg._min.price) || 0,
      max: Number(priceAgg._max.price) || 10000,
    },
  };
}
