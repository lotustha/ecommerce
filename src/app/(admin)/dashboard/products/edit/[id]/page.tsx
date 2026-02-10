import { prisma } from "@/lib/db/prisma";
import ProductForm from "@/components/admin/product-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  // Support both parameter names to handle folder naming variations ([id] vs [slug])
  params: Promise<{ id?: string; slug?: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const resolvedParams = await params;
  // We link to this page using the Product ID, so whether the route param is named 'id' or 'slug',
  // it holds the ID value we need for the lookup.
  const id = resolvedParams.id || resolvedParams.slug;

  if (!id) {
    notFound();
  }

  // 1. Fetch Product with all relations needed for the form
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true, // Fetch variants for the dynamic form list
      specs: {
        include: {
          attribute: true, // Fetch attribute names (e.g. "Color")
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // 2. Fetch Options for Dropdowns
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ]);

  // 3. Serialize Data (Handle Decimals/Dates for Client Component)
  // Next.js cannot pass Prisma Decimal/Date objects directly to client components
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
