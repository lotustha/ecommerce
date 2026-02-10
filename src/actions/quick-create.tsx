"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function createQuickCategory(name: string) {
  try {
    await requireAdmin();
    // Simple slugify
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const category = await prisma.category.create({
      data: { name, slug },
    });
    revalidatePath("/dashboard/products/new");
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: "Failed to create category" };
  }
}

export async function createQuickBrand(name: string) {
  try {
    await requireAdmin();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const brand = await prisma.brand.create({
      data: { name, slug },
    });
    revalidatePath("/dashboard/products/new");
    return { success: true, data: brand };
  } catch (error) {
    return { success: false, error: "Failed to create brand" };
  }
}
