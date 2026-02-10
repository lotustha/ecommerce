import { prisma } from "@/lib/db/prisma";
import ProductForm from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
