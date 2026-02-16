import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyKhaltiPayment, generateEsewaSignature } from "@/lib/payment";

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
            // Khalti returns purchase_order_id which we set as our Order ID
            orderId = searchParams.get("purchase_order_id") || "";

            if (pidx) {
                // Call Khalti API to confirm status
                isVerified = await verifyKhaltiPayment(pidx);
            }
        }

        // ---------------------------------------------------------
        // 2. ESEWA HANDLING (EPAY v2)
        // ---------------------------------------------------------
        else if (gateway === "esewa") {
            if (status === "failure") {
                // Redirect to payment page with error if we can find the order ID, 
                // otherwise to orders list.
                // Note: eSewa failure URL might not pass data depending on config.
                return NextResponse.redirect(new URL(`/orders?status=failed`, req.url));
            }

            // eSewa sends a base64 encoded 'data' param on success
            const data = searchParams.get("data");
            if (data) {
                const decodedJson = Buffer.from(data, "base64").toString("utf-8");
                const decodedData = JSON.parse(decodedJson);

                // decodedData structure: 
                // { transaction_code, status, total_amount, transaction_uuid, product_code, signature, ... }

                if (decodedData.status === "COMPLETE") {
                    const { total_amount, transaction_uuid, product_code, signature } = decodedData;
                    orderId = transaction_uuid; // We used Order ID as transaction_uuid

                    // Verify Signature matches what we expect
                    // Note: The total_amount comes as a string formatted like "100.0"
                    // Ensure your generateEsewaSignature handles the exact string format from eSewa
                    const expectedSignature = generateEsewaSignature(total_amount, transaction_uuid, product_code);

                    if (signature === expectedSignature) {
                        isVerified = true;
                    }
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
                    status: "PROCESSING" // Automatically mark as Processing
                }
            });
            // Redirect to Order History with success message
            return NextResponse.redirect(new URL(`/orders?status=success`, req.url));
        }

        // If verification failed but we have an order ID, mark as Failed? 
        // Or just redirect user to retry.
        if (orderId) {
            return NextResponse.redirect(new URL(`/payment/${orderId}?status=failed`, req.url));
        }

        // Fallback redirect
        return NextResponse.redirect(new URL(`/`, req.url));

    } catch (error) {
        console.error("Payment Callback Error:", error);
        return NextResponse.redirect(new URL(`/orders?status=error`, req.url));
    }
}