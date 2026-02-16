import { prisma } from "@/lib/db/prisma";
import CategoryForm from "@/components/admin/category-form";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) notFound();

  const categories = await prisma.category.findMany({
    where: { id: { not: id } }, // Exclude self from parent options
    select: { id: true, name: true },
  });

  return <CategoryForm initialData={category} categories={categories} />;
}
