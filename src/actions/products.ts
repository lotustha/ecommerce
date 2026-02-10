"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized Access");
  }
}

export async function deleteProduct(productId: string) {
  try {
    await requireAdmin();
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/dashboard/products");
    return { success: "Product deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete product" };
  }
}
