"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function processRefund(orderId: string) {
  const session = await auth();

  // 1. Verify Admin Access
  if (session?.user?.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  try {
    // 2. Fetch Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return { error: "Order not found" };

    if (order.paymentStatus !== "PAID") {
      return { error: "Only PAID orders can be refunded" };
    }

    // 3. Process Refund (Database Update)
    // In a real production app, you would also call the eSewa/Khalti Refund API here
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "REFUNDED",
        status: "CANCELLED", // Auto-cancel order upon refund
      },
    });

    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/orders");

    return { success: "Order refunded and cancelled successfully" };
  } catch (error) {
    console.error("Refund Error:", error);
    return { error: "Failed to process refund" };
  }
}
