"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  CategoryFormSchema,
  CategoryFormValues,
} from "@/lib/validators/category-schema";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized Access");
  }
}

export async function upsertCategory(data: CategoryFormValues, id?: string) {
  try {
    await requireAdmin();

    const validated = CategoryFormSchema.safeParse(data);
    if (!validated.success) return { error: "Invalid data" };

    const { name, slug, parentId, image } = validated.data;

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing && existing.id !== id) {
      return { error: "Slug already exists" };
    }

    // Prevent circular dependency (parent cannot be itself)
    if (id && parentId === id) {
      return { error: "Category cannot be its own parent" };
    }

    if (id) {
      await prisma.category.update({
        where: { id },
        data: { name, slug, parentId: parentId || null, image },
      });
    } else {
      await prisma.category.create({
        data: { name, slug, parentId: parentId || null, image },
      });
    }

    revalidatePath("/dashboard/categories");
    return { success: `Category ${id ? "updated" : "created"} successfully` };
  } catch (error) {
    return { error: "Failed to save category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireAdmin();

    // Check for products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      return { error: `Cannot delete: Category has ${productCount} products.` };
    }

    // Check for subcategories
    const childCount = await prisma.category.count({ where: { parentId: id } });
    if (childCount > 0) {
      return {
        error: `Cannot delete: Category has ${childCount} sub-categories.`,
      };
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/dashboard/categories");
    return { success: "Category deleted" };
  } catch (error) {
    return { error: "Failed to delete category" };
  }
}
