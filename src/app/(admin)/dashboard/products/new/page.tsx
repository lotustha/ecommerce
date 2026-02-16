import { prisma } from "@/lib/db/prisma";
import ProductForm from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [rawCategories, brands] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parent: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.parent ? `${c.parent.name} > ${c.name}` : c.name,
    originalName: c.name,
  }));

  return (
    <div className="space-y-6">
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
