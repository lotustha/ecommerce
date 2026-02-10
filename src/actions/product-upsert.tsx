"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  ProductFormSchema,
  ProductFormValues,
} from "@/lib/validators/product-schema";

export async function upsertProduct(data: ProductFormValues, id?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const validated = ProductFormSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid form data" };
  }

  const { images, specs, variants, ...fields } = validated.data;

  try {
    const existingSlug = await prisma.product.findUnique({
      where: { slug: fields.slug },
    });

    if (existingSlug && existingSlug.id !== id) {
      return { error: "Slug already exists. Please choose another." };
    }

    // 1. Prepare Spec Data
    const specData: { attributeId: string; value: string }[] = [];
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

        specData.push({
          attributeId: attribute.id,
          value: spec.value,
        });
      }
    }

    const productPayload = {
      ...fields,
      images: JSON.stringify(images),
      hasVariants: variants && variants.length > 0,
    };

    if (id) {
      // Update
      await prisma.$transaction(async (tx) => {
        // 1. Update basic fields
        await tx.product.update({
          where: { id },
          data: productPayload,
        });

        // 2. Handle Specs: Delete all existing and re-create
        if (specs) {
          await tx.productSpec.deleteMany({
            where: { productId: id },
          });

          if (specData.length > 0) {
            await tx.productSpec.createMany({
              data: specData.map((s) => ({
                productId: id,
                attributeId: s.attributeId,
                value: s.value,
              })),
            });
          }
        }

        // 3. Handle Variants: Delete all and re-create
        if (variants) {
          await tx.productVariant.deleteMany({
            where: { productId: id },
          });

          if (variants.length > 0) {
            await tx.productVariant.createMany({
              data: variants.map((v) => ({
                productId: id,
                name: v.name,
                sku: v.sku,
                price: v.price,
                stock: v.stock,
              })),
            });
          }
        }
      });
    } else {
      // Create
      await prisma.product.create({
        data: {
          ...productPayload,
          specs: {
            create: specData.map((s) => ({
              attribute: { connect: { id: s.attributeId } },
              value: s.value,
            })),
          },
          variants: {
            create: variants?.map((v) => ({
              name: v.name,
              sku: v.sku,
              price: v.price,
              stock: v.stock,
            })),
          },
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
