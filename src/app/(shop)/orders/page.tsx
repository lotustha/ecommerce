import { getUserOrders } from "@/lib/db/data";
import OrderList from "@/components/order/order-list";

// Force dynamic rendering to ensure fresh data on every visit
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
    // Fetch data on the server
    const orders = await getUserOrders();

    // Pass data to the Client Component for rendering & animation
    return <OrderList orders={orders} />;
}