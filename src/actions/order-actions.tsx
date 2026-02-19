"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus } from "../../generated/prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") {
    throw new Error("Unauthorized Access");
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
) {
  try {
    await requireAdmin();

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: `Order marked as ${newStatus}` };
  } catch (error) {
    console.error("Order Update Error:", error);
    return { error: "Failed to update order status" };
  }
}

export async function updatePaymentStatus(
  orderId: string,
  newStatus: PaymentStatus,
) {
  try {
    await requireAdmin();

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: newStatus },
    });

    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: `Payment status updated to ${newStatus}` };
  } catch (error) {
    console.error("Payment Update Error:", error);
    return { error: "Failed to update payment status" };
  }
}

// ✅ NEW: Switch to COD Action
export async function switchPaymentToCOD(orderId: string) {
  try {
    await requireAdmin();
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: "COD" },
    });
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: "Payment method switched to COD" };
  } catch (error) {
    return { error: "Failed to switch payment method" };
  }
}
