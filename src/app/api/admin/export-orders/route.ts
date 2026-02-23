import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                items: { select: { name: true, quantity: true, price: true } }
            }
        });

        // CSV Header
        const headers = [
            "Order ID", "Date", "Customer Name", "Customer Phone",
            "Order Status", "Payment Method", "Payment Status",
            "Subtotal", "Shipping", "Discount", "Total", "Items"
        ];

        // Map rows
        const rows = orders.map(order => {
            let shippingAddress: any = {};
            try {
                shippingAddress = typeof order.shippingAddress === "string"
                    ? JSON.parse(order.shippingAddress)
                    : order.shippingAddress || {};
            } catch (err) { }

            const customerName = shippingAddress.fullName || order.user?.name || "Guest";
            const phone = shippingAddress.phone || order.phone || "N/A";
            const itemsString = order.items.map(i => `${i.quantity}x ${i.name}`).join(" | ");

            // Escape fields to prevent CSV breaking on commas and quotes
            const escape = (str: string | number) => `"${String(str ?? "").replace(/"/g, '""')}"`;

            return [
                escape(order.id),
                escape(new Date(order.createdAt).toLocaleDateString()),
                escape(customerName),
                escape(phone),
                escape(order.status),
                escape(order.paymentMethod),
                escape(order.paymentStatus),
                escape(Number(order.subTotal)),
                escape(Number(order.shippingCost)),
                escape(Number(order.discount || 0)),
                escape(Number(order.totalAmount)),
                escape(itemsString)
            ].join(",");
        });

        // Add UTF-8 BOM (\uFEFF) so Excel properly formats columns and special characters
        const csvContent = '\uFEFF' + [headers.join(","), ...rows].join("\n");

        // Use native Web Response with strict caching headers
        return new Response(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="orders_export.csv"`,
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            },
        });

    } catch (error) {
        console.error("CSV Export Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}