"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getEsewaConfig } from "@/lib/payment/esewa";

export async function preparePayment(
  orderId: string,
  paymentMethod: "ESEWA" | "KHALTI",
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.userId !== session.user.id) {
    return { error: "Order not found" };
  }

  // 1. Update payment method if the user chose a different one
  if (order.paymentMethod !== paymentMethod) {
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod },
    });
  }

  // 2. Prepare Config
  if (paymentMethod === "ESEWA") {
    // Generate a unique transaction ID for every attempt to avoid "Duplicate UUID" error
    const uniqueTransactionId = `${orderId}_${Date.now()}`;

    // ✅ Add await here since getEsewaConfig now fetches database settings
    const config = await getEsewaConfig(
      Number(order.totalAmount),
      uniqueTransactionId,
    );

    return { success: true, config, method: "ESEWA" };
  }

  if (paymentMethod === "KHALTI") {
    return { success: true, method: "KHALTI" };
  }

  return { error: "Invalid method" };
}
