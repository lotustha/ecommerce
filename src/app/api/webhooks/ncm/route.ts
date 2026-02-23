import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Handle NCM Manual Test Webhook from their portal
    if (body.test) {
      console.log("NCM Test webhook received successfully:", body);
      return NextResponse.json({
        status: "success",
        message: "Test webhook received",
      });
    }

    const event = body.event;
    const status = body.status;

    // 2. Extract Order IDs correctly (NCM sends 'order_id' for single, or 'order_ids' for bulk)
    let orderIds: string[] = [];
    if (body.order_id) {
      orderIds.push(body.order_id);
    } else if (Array.isArray(body.order_ids)) {
      orderIds = body.order_ids;
    }

    if (orderIds.length === 0) {
      return NextResponse.json(
        { error: "No order IDs provided in payload" },
        { status: 400 },
      );
    }

    // 3. Map NCM Event strings to your internal OrderStatus Enum
    let internalStatus: "SHIPPED" | "DELIVERED" | null = null;

    if (event === "delivery_completed") {
      internalStatus = "DELIVERED";
    } else if (
      [
        "pickup_completed",
        "sent_for_delivery",
        "order_dispatched",
        "order_arrived",
      ].includes(event)
    ) {
      internalStatus = "SHIPPED";
    }

    // 4. Update the Database records via their Tracking Codes
    if (internalStatus) {
      for (const trackingId of orderIds) {
        // Locate the order in our DB using the tracking ID provided by NCM earlier
        const order = await prisma.order.findFirst({
          where: { trackingCode: trackingId },
        });

        if (order) {
          // If it was delivered and originally Cash on Delivery, automatically mark the payment as PAID
          const isDeliveredAndCod =
            internalStatus === "DELIVERED" && order.paymentMethod === "COD";

          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: internalStatus,
              ...(isDeliveredAndCod ? { paymentStatus: "PAID" } : {}),
            },
          });
        } else {
          console.warn(
            `Webhook received for unknown tracking ID: ${trackingId}`,
          );
        }
      }
    }

    return NextResponse.json({ status: "received" });
  } catch (error) {
    console.error("NCM Webhook Error:", error);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
