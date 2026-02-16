"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  CustomerFormSchema,
  CustomerFormValues,
} from "@/lib/validators/customer-schema";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto"; // Built-in Node module

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized Access");
  }
}

// 🛠️ Helper: Save Base64 Image to Public Folder
async function saveImageToDisk(base64Data: string): Promise<string> {
  // If it's already a path (e.g. /customers/img.png) or empty, return as is
  if (!base64Data || !base64Data.startsWith("data:image")) {
    return base64Data;
  }

  try {
    // 1. Extract Extension (png, jpeg, etc.)
    const matches = base64Data.match(/^data:image\/([a-z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid image data");
    }
    const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    // 2. Create directory if not exists
    const uploadDir = path.join(process.cwd(), "public", "customers");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // 3. Generate unique filename
    const filename = `${crypto.randomUUID()}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // 4. Write file
    await fs.writeFile(filepath, buffer);

    // 5. Return public URL path
    return `/customers/${filename}`;
  } catch (error) {
    console.error("Image Save Error:", error);
    throw new Error("Failed to save image to disk");
  }
}

// 🛠️ Helper: Delete Image from Disk
async function deleteImageFromDisk(imagePath: string) {
  if (!imagePath || !imagePath.startsWith("/customers/")) return;

  try {
    const fullPath = path.join(process.cwd(), "public", imagePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.warn("Failed to delete image:", imagePath, error);
  }
}

export async function upsertCustomer(data: CustomerFormValues, id?: string) {
  try {
    await requireAdmin();

    const validated = CustomerFormSchema.safeParse(data);
    if (!validated.success) {
      return { error: "Invalid form data" };
    }

    const { password, addresses, image, ...fields } = validated.data;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: fields.email },
    });

    if (existingUser && existingUser.id !== id) {
      return { error: "Email already exists" };
    }

    // ✅ Handle Image Logic (Delete old if replaced)
    let imageUrl = image;

    if (id) {
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { image: true },
      });

      // If a new image is being uploaded (base64) OR image is cleared, delete the old one
      const isNewUpload = image && image.startsWith("data:image");
      const isRemoved = !image && currentUser?.image;

      if ((isNewUpload || isRemoved) && currentUser?.image) {
        await deleteImageFromDisk(currentUser.image);
      }
    }

    // Save new image if provided
    if (image && image.startsWith("data:image")) {
      imageUrl = await saveImageToDisk(image);
    }

    const userData: any = {
      ...fields,
      image: imageUrl,
    };

    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }

    if (id) {
      // Update
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id },
          data: userData,
        });

        await tx.address.deleteMany({ where: { userId: id } });

        if (addresses && addresses.length > 0) {
          await tx.address.createMany({
            data: addresses.map((addr) => ({
              userId: id,
              province: addr.province,
              district: addr.district,
              city: addr.city,
              ward: addr.ward,
              street: addr.street,
              postalCode: addr.postalCode,
              phone: addr.phone,
              isDefault: addr.isDefault,
            })),
          });
        }
      });
    } else {
      // Create
      if (!password) return { error: "Password is required for new customers" };

      userData.password = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          ...userData,
          role: "USER",
          addresses: {
            create: addresses?.map((addr) => ({
              province: addr.province,
              district: addr.district,
              city: addr.city,
              ward: addr.ward,
              street: addr.street,
              postalCode: addr.postalCode,
              phone: addr.phone,
              isDefault: addr.isDefault,
            })),
          },
        },
      });
    }

    revalidatePath("/dashboard/customers");
    return { success: `Customer ${id ? "updated" : "created"} successfully` };
  } catch (error) {
    console.error("Customer Upsert Error:", error);
    return { error: "Failed to save customer" };
  }
}

export async function deleteCustomer(userId: string) {
  try {
    await requireAdmin();
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (targetUser?.role !== "USER") {
      return { error: "Cannot delete staff members from this page." };
    }

    // ✅ Clean up profile image before deleting user
    if (targetUser.image) {
      await deleteImageFromDisk(targetUser.image);
    }

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/dashboard/customers");
    return { success: "Customer profile deleted successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete customer." };
  }
}
