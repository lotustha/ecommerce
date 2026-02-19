import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyKhaltiPayment, verifyEsewaSignature } from "@/lib/payment"; // ✅ Updated Import

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const gateway = searchParams.get("gateway");
  const status = searchParams.get("status");

  let orderId = "";
  let isVerified = false;

  try {
    // ---------------------------------------------------------
    // 1. KHALTI HANDLING
    // ---------------------------------------------------------
    if (gateway === "khalti") {
      const pidx = searchParams.get("pidx");
      orderId = searchParams.get("purchase_order_id") || "";

      if (pidx) {
        isVerified = await verifyKhaltiPayment(pidx);
      }
    }

    // ---------------------------------------------------------
    // 2. ESEWA HANDLING
    // ---------------------------------------------------------
    else if (gateway === "esewa") {
      if (status === "failure") {
        return NextResponse.redirect(new URL(`/orders?status=failed`, req.url));
      }

      const data = searchParams.get("data");
      if (data) {
        const decodedJson = Buffer.from(data, "base64").toString("utf-8");
        const decodedData = JSON.parse(decodedJson);

        if (decodedData.status === "COMPLETE") {
          const { total_amount, transaction_uuid, product_code, signature } =
            decodedData;

          // Extract Real Order ID
          orderId = transaction_uuid.split("_")[0];

          // ✅ Verify Signature asynchronously via helper (Checks DB if Live/Sandbox)
          isVerified = await verifyEsewaSignature(
            total_amount,
            transaction_uuid,
            product_code,
            signature,
          );
        }
      }
    }

    // ---------------------------------------------------------
    // 3. UPDATE DATABASE & REDIRECT
    // ---------------------------------------------------------
    if (isVerified && orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING",
        },
      });
      return NextResponse.redirect(new URL(`/orders?status=success`, req.url));
    }

    if (orderId) {
      return NextResponse.redirect(
        new URL(`/payment/${orderId}?status=failed`, req.url),
      );
    }

    return NextResponse.redirect(new URL(`/`, req.url));
  } catch (error) {
    console.error("Payment Callback Error:", error);
    return NextResponse.redirect(new URL(`/orders?status=error`, req.url));
  }
}
