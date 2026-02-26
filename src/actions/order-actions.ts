"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus } from "../../generated/prisma/client";
import { sendOrderStatusEmail } from "@/lib/mail";

// Secure helper to ensure only admins can perform actions
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized Access");
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
) {
  try {
    await requireAdmin();

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { user: true }
    });
    // ✅ ADD THIS BLOCK AFTER THE UPDATE:
    try {
      // Only send emails to actual users with emails (guests might not have one depending on your setup)
      if (updatedOrder.user && updatedOrder.user.email) {
        await sendOrderStatusEmail(updatedOrder.user.email, {
          id: updatedOrder.id,
          status: updatedOrder.status,
          trackingCode: updatedOrder.trackingCode,
          courier: updatedOrder.courier,
          customerName: updatedOrder.user.name || "Customer"
        });
      }
    } catch (error) {
      console.error("Non-fatal: Failed to send status update email", error);
    }
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: `Order marked as ${newStatus}` };
  } catch (error) {
    return { error: "Failed to update status" };
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

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: `Payment status updated to ${newStatus}` };
  } catch (error) {
    return { error: "Failed to update payment status" };
  }
}

export async function switchPaymentToCOD(orderId: string) {
  try {
    await requireAdmin();

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: "COD" },
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: "Payment method switched to COD" };
  } catch (error) {
    return { error: "Failed to switch payment method" };
  }
}

export async function updateOrderShippingCost(
  orderId: string,
  newShippingCost: number,
) {
  try {
    await requireAdmin();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return { error: "Order not found" };

    // Calculate new total using exact numbers
    const newTotal =
      Number(order.subTotal) + newShippingCost - (Number(order.discount) || 0);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingCost: newShippingCost,
        totalAmount: newTotal,
      },
    });

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: "Shipping cost synced to order successfully" };
  } catch (error) {
    console.error("Shipping Update Error:", error);
    return { error: "Failed to update shipping cost" };
  }
}
