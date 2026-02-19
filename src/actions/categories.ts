"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  CategoryFormSchema,
  CategoryFormValues,
} from "@/lib/validators/category-schema";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized Access");
  }
}

// 🛠️ Helper: Save Base64 Image to Public Folder (Categories)
async function saveImageToDisk(base64Data: string): Promise<string> {
  // If it's already a path or empty, return as is
  if (!base64Data || !base64Data.startsWith("data:image")) {
    return base64Data;
  }

  try {
    const matches = base64Data.match(/^data:image\/([a-z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid image data");
    }
    const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    const uploadDir = path.join(process.cwd(), "public", "categories");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filename = `${crypto.randomUUID()}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);

    return `/categories/${filename}`;
  } catch (error) {
    console.error("Category Image Save Error:", error);
    throw new Error("Failed to save image to disk");
  }
}

// 🛠️ Helper: Delete Image from Disk
async function deleteImageFromDisk(imagePath: string) {
  if (!imagePath || !imagePath.startsWith("/categories/")) return;
  try {
    const fullPath = path.join(process.cwd(), "public", imagePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.warn("Failed to delete category image:", imagePath);
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

    // Prevent circular dependency
    if (id && parentId === id) {
      return { error: "Category cannot be its own parent" };
    }

    // ✅ Handle Image Logic
    let imageUrl = image;

    if (id) {
      const currentCat = await prisma.category.findUnique({
        where: { id },
        select: { image: true },
      });

      // If a new image is being uploaded (base64) OR image is cleared, delete the old one
      const isNewUpload = image && image.startsWith("data:image");
      const isRemoved = !image && currentCat?.image;

      if ((isNewUpload || isRemoved) && currentCat?.image) {
        await deleteImageFromDisk(currentCat.image);
      }
    }

    // Save new image if provided
    if (image && image.startsWith("data:image")) {
      imageUrl = await saveImageToDisk(image);
    }

    const categoryData = {
      name,
      slug,
      parentId: parentId || null,
      image: imageUrl, // Save the file path, not the base64 string
    };

    if (id) {
      await prisma.category.update({
        where: { id },
        data: categoryData,
      });
    } else {
      await prisma.category.create({
        data: categoryData,
      });
    }

    revalidatePath("/dashboard/categories");
    return { success: `Category ${id ? "updated" : "created"} successfully` };
  } catch (error) {
    console.error("Category Upsert Error:", error);
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

    // Clean up image
    const cat = await prisma.category.findUnique({ where: { id } });
    if (cat?.image) {
      await deleteImageFromDisk(cat.image);
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/dashboard/categories");
    return { success: "Category deleted" };
  } catch (error) {
    return { error: "Failed to delete category" };
  }
}
