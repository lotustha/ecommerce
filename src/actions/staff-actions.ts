"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
// Reusing customer schema for address validation, but customized for staff if needed.
// For simplicity, we can reuse the robust address schema and extend/modify locally if needed.
// However, Staff has 'role', so we need a specific schema or use the one we created earlier.
import {
  StaffFormSchema,
  StaffFormValues,
} from "@/lib/validators/staff-schema";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized Access");
  }
  return session.user.id;
}

// 🛠️ Helper: Save Base64 Image
async function saveImageToDisk(base64Data: string): Promise<string> {
  if (!base64Data || !base64Data.startsWith("data:image")) return base64Data;

  try {
    const matches = base64Data.match(/^data:image\/([a-z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid image data");

    const extension = matches[1] === "jpeg" ? "jpg" : matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    const uploadDir = path.join(process.cwd(), "public", "staff"); // Separate folder for staff
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filename = `${crypto.randomUUID()}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);
    return `/staff/${filename}`;
  } catch (error) {
    console.error("Image Save Error:", error);
    throw new Error("Failed to save image");
  }
}

// 🛠️ Helper: Delete Image
async function deleteImageFromDisk(imagePath: string) {
  if (!imagePath || !imagePath.startsWith("/staff/")) return;
  try {
    const fullPath = path.join(process.cwd(), "public", imagePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.warn("Failed to delete image:", imagePath);
  }
}

export async function upsertStaff(data: StaffFormValues, id?: string) {
  try {
    const currentAdminId = await requireAdmin();

    const validated = StaffFormSchema.safeParse(data);
    if (!validated.success) return { error: "Invalid form data" };

    const { password, image, ...fields } = validated.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: fields.email },
    });
    if (existingUser && existingUser.id !== id)
      return { error: "Email already exists" };

    // Prevent Admin from demoting themselves (if editing self)
    if (id === currentAdminId && fields.role !== "ADMIN") {
      return { error: "You cannot change your own role." };
    }

    // Handle Image
    let imageUrl = image;
    if (id) {
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { image: true },
      });
      const isNewUpload = image && image.startsWith("data:image");
      const isRemoved = !image && currentUser?.image;

      if ((isNewUpload || isRemoved) && currentUser?.image) {
        await deleteImageFromDisk(currentUser.image);
      }
    }
    if (image && image.startsWith("data:image")) {
      imageUrl = await saveImageToDisk(image);
    }

    const userData: any = { ...fields, image: imageUrl };

    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }

    if (id) {
      await prisma.user.update({
        where: { id },
        data: userData,
      });
    } else {
      if (!password) return { error: "Password is required for new staff" };
      userData.password = await bcrypt.hash(password, 10);
      await prisma.user.create({ data: userData });
    }

    revalidatePath("/dashboard/staff");
    return {
      success: `Staff member ${id ? "updated" : "created"} successfully`,
    };
  } catch (error) {
    console.error("Staff Upsert Error:", error);
    return { error: "Failed to save staff member" };
  }
}

export async function deleteStaff(userId: string) {
  try {
    const currentAdminId = await requireAdmin();

    if (currentAdminId === userId) {
      return { error: "You cannot delete your own account." };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (targetUser?.image) {
      await deleteImageFromDisk(targetUser.image);
    }

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/dashboard/staff");
    return { success: "Staff member deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete staff member." };
  }
}
