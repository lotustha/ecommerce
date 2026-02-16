import { NextResponse } from "next/server";
import { initiateKhaltiPayment } from "@/lib/payment";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, amount, method, customer } = body;

        // Handle Khalti Initiation
        if (method === "KHALTI") {
            const paymentResponse = await initiateKhaltiPayment(amount, orderId, customer);

            if (paymentResponse?.payment_url) {
                return NextResponse.json({ url: paymentResponse.payment_url });
            }

            return NextResponse.json({ error: "Failed to verify Khalti configuration or keys" }, { status: 400 });
        }

        // eSewa handles initiation purely via Form POST on client, so no server API needed for init

        return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    } catch (error) {
        console.error("Payment Init Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}