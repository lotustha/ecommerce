"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  ProductFormSchema,
  ProductFormValues,
} from "@/lib/validators/product-schema";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// 🛠️ Helper: Save Base64 or External HTTP Image to Public Folder
async function saveImageToDisk(imageInput: string): Promise<string> {
  // If it's empty, return as is
  if (!imageInput) return imageInput;

  // If it's already a local path (e.g. /products/img.png), return as is
  if (imageInput.startsWith("/products/")) {
    return imageInput;
  }

  const uploadDir = path.join(process.cwd(), "public", "products");

  // Ensure the directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  try {
    // 1. Handle External URLs (e.g., scraped by AI)
    if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
      const response = await fetch(imageInput);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch external image: ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Guess extension from headers
      const contentType = response.headers.get("content-type") || "";
      let extension = "jpg"; // Default
      if (contentType.includes("png")) extension = "png";
      else if (contentType.includes("webp")) extension = "webp";
      else if (contentType.includes("svg")) extension = "svg";
      else if (contentType.includes("gif")) extension = "gif";

      const filename = `${crypto.randomUUID()}.${extension}`;
      const filepath = path.join(uploadDir, filename);

      await fs.writeFile(filepath, buffer);
      return `/products/${filename}`;
    }

    // 2. Handle Base64 Uploads
    if (imageInput.startsWith("data:image")) {
      const matches = imageInput.match(
        /^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/,
      );
      if (!matches || matches.length !== 3) return imageInput;

      let extension = matches[1].toLowerCase();
      if (extension === "jpeg") extension = "jpg";
      if (extension.startsWith("svg")) extension = "svg";

      const buffer = Buffer.from(matches[2], "base64");

      const filename = `${crypto.randomUUID()}.${extension}`;
      const filepath = path.join(uploadDir, filename);

      await fs.writeFile(filepath, buffer);
      return `/products/${filename}`;
    }

    // Fallback if it's an unrecognized format
    return imageInput;
  } catch (error) {
    console.error("Product Image Save Error:", error);
    return imageInput; // Fallback to original input if saving fails
  }
}

// Helper to fetch products for the cross-selling dropdown
export async function getProductsForCrossSell(currentProductId?: string) {
  try {
    const products = await prisma.product.findMany({
      where: currentProductId ? { id: { not: currentProductId } } : undefined,
      select: { id: true, name: true, images: true, price: true },
      orderBy: { createdAt: "desc" },
    });
    // ✅ Convert Prisma Decimal to standard JS Number to fix serialization error
    return products.map((p) => ({
      ...p,
      price: Number(p.price),
    }));
  } catch (error) {
    return [];
  }
}

export async function upsertProduct(data: ProductFormValues, id?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const validated = ProductFormSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid form data" };
  }

  // Extract relational arrays and options from the base fields
  const { images, specs, variants, crossSells, options, ...fields } =
    validated.data;

  try {
    const existingSlug = await prisma.product.findUnique({
      where: { slug: fields.slug },
    });

    if (existingSlug && existingSlug.id !== id) {
      return { error: "Slug already exists. Please choose another." };
    }

    // ✅ 1. Process Main Images (Convert Base64 or External URLs to Physical Files)
    const processedImages = [];
    if (images && images.length > 0) {
      for (const img of images) {
        processedImages.push(await saveImageToDisk(img));
      }
    }

    // ✅ 2. Process Variant Images AND Calculate Total Variant Stock
    const processedVariants: any = [];
    let totalVariantStock = 0; // Initialize stock counter

    if (variants && variants.length > 0) {
      for (const v of variants) {
        let vImg = v.image;
        if (vImg) {
          vImg = await saveImageToDisk(vImg);
        }

        const variantStock = Number(v.stock) || 0;
        totalVariantStock += variantStock; // Add to total

        processedVariants.push({
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: variantStock,
          colorCode: v.colorCode,
          image: vImg,
        });
      }
    }

    // 3. Prepare specifications mapping
    const specData: any = [];
    if (specs && specs.length > 0) {
      for (const spec of specs) {
        let attribute = await prisma.attribute.findFirst({
          where: { name: spec.name },
        });
        if (!attribute) {
          attribute = await prisma.attribute.create({
            data: { name: spec.name },
          });
        }
        specData.push({ attributeId: attribute.id, value: spec.value });
      }
    }

    // 4. Clean base product details
    const productBase = {
      ...fields,
      discountPrice: fields.discountPrice === 0 ? null : fields.discountPrice, // Clean up empty discounts
      images: JSON.stringify(processedImages),
      options: options || null,
      hasVariants: processedVariants.length > 0,
      // ✅ SMART STOCK: If variants exist, override base stock with the calculated total
      stock: processedVariants.length > 0 ? totalVariantStock : fields.stock,
    };

    if (id) {
      // ✅ UPDATE EXISTING PRODUCT
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            ...productBase,
            // Prisma uses `set` to overwrite existing relations during an update
            crossSells:
              crossSells && crossSells.length > 0
                ? { set: crossSells.map((crossId) => ({ id: crossId })) }
                : { set: [] },
          },
        });

        if (specs) {
          await tx.productSpec.deleteMany({ where: { productId: id } });
          if (specData.length > 0) {
            await tx.productSpec.createMany({
              data: specData.map((s: any) => ({
                productId: id,
                attributeId: s.attributeId,
                value: s.value,
              })),
            });
          }
        }

        if (variants) {
          await tx.productVariant.deleteMany({ where: { productId: id } });
          if (processedVariants.length > 0) {
            await tx.productVariant.createMany({
              data: processedVariants.map((v: any) => ({
                productId: id,
                ...v,
              })),
            });
          }
        }
      });
    } else {
      // ✅ CREATE NEW PRODUCT
      await prisma.product.create({
        data: {
          ...productBase,
          // Prisma uses `connect` to link relations during initial creation
          crossSells:
            crossSells && crossSells.length > 0
              ? {
                  connect: crossSells.map((crossId) => ({ id: crossId })),
                }
              : undefined,

          specs:
            specData.length > 0
              ? {
                  create: specData.map((s: any) => ({
                    attribute: { connect: { id: s.attributeId } },
                    value: s.value,
                  })),
                }
              : undefined,

          variants:
            processedVariants.length > 0
              ? {
                  create: processedVariants,
                }
              : undefined,
        },
      });
    }

    revalidatePath("/dashboard/products");
    revalidatePath("/");
    return { success: `Product ${id ? "updated" : "created"} successfully` };
  } catch (error) {
    console.error("Product Upsert Error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
