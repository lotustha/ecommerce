import { prisma } from "@/lib/db/prisma";
import CategoryForm from "@/components/admin/category-form";

export default async function NewCategoryPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  return <CategoryForm categories={categories} />;
}
