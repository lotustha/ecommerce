"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function createQuickBrand(name: string) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized Access" };
  }

  try {
    // Generate a clean slug from the name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Safety check: Does it already exist?
    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (existing) {
      return { success: true, brand: existing };
    }

    // Create the brand
    const brand = await prisma.brand.create({
      data: { name, slug },
    });

    return { success: true, brand };
  } catch (error) {
    console.error("Quick create brand error:", error);
    return { error: "Failed to create brand" };
  }
}

export async function createQuickCategory(path: string) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized Access" };
  }

  try {
    // Split the path by '>' to handle parent-child relationships
    const parts = path
      .split(">")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length === 0) return { error: "Invalid category name" };

    let currentParentId = null;
    let finalCategory = null;
    let formattedName = "";

    // Loop through each part, creating parents as needed
    for (let i = 0; i < parts.length; i++) {
      const partName = parts[i];
      // Generate a clean slug
      const slug = partName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if this specific category exists under the current parent
      let existing: any = await prisma.category.findFirst({
        where: {
          slug,
          parentId: currentParentId,
        },
      });

      if (!existing) {
        existing = await prisma.category.create({
          data: {
            name: partName,
            slug,
            parentId: currentParentId,
          },
        });
      }

      currentParentId = existing.id;
      finalCategory = existing;
      formattedName = formattedName
        ? `${formattedName} > ${partName}`
        : partName;
    }

    if (!finalCategory) return { error: "Failed to process category" };

    return {
      success: true,
      category: {
        id: finalCategory.id,
        name: formattedName,
        originalName: finalCategory.name,
      },
    };
  } catch (error) {
    console.error("Quick create category error:", error);
    return { error: "Failed to create category" };
  }
}
