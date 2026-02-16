import { prisma } from "@/lib/db/prisma";
import ProductForm from "@/components/admin/product-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ id?: string; slug?: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id || resolvedParams.slug;

  if (!id) {
    notFound();
  }

  // 1. Fetch Product
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      specs: {
        include: { attribute: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // 2. Fetch Categories with Hierarchy (Parent > Child)
  const rawCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      parent: { select: { name: true } }, // Fetch parent name
    },
    orderBy: { name: "asc" },
  });

  // Format: "Electronics > Smartphones"
  const categories = rawCategories
    .map((c) => ({
      id: c.id,
      name: c.parent ? `${c.parent.name} > ${c.name}` : c.name,
      originalName: c.name, // Keep original for search matching
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const serializedProduct = JSON.parse(JSON.stringify(product));

  return (
    <div className="space-y-6">
      <ProductForm
        initialData={serializedProduct}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
