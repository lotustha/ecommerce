import { getUserOrders } from "@/lib/db/data";
import OrderList from "@/components/order/order-list";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login?callbackUrl=/orders");
    }

    // Fetch data on the server
    const orders = await getUserOrders();

    return (
        <div className="min-h-screen bg-base-200/30">
            <div className="max-w-5xl mx-auto py-10 px-4 md:px-8">
                <OrderList orders={orders} />
            </div>
        </div>
    );
}