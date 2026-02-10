import { prisma } from "@/lib/db/prisma";
import { updateOrderStatus } from "@/actions/admin";
import { format } from "date-fns"; // Standard date formatting if available, or native
import { CheckCircle2, Clock, XCircle, Truck, Package } from "lucide-react";
import OrderStatusSelect from "./_components/status-select"; // We'll define this below

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(Number(p));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tight">Order Management</h1>
        <div className="badge badge-neutral p-3">
          Total Orders: {orders.length}
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-3xl border border-base-200 shadow-sm">
        <table className="table table-zebra w-full">
          {/* head */}
          <thead className="bg-base-200/50 text-base-content/60 uppercase text-xs font-bold">
            <tr>
              <th className="py-4">Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover">
                <td className="font-mono text-xs opacity-70">
                  {order.id.slice(-8).toUpperCase()}
                </td>
                <td>
                  <div className="font-bold">
                    {JSON.parse(order.shippingAddress as string).fullName}
                  </div>
                  <div className="text-xs opacity-50">
                    {order.user?.email || "Guest"}
                  </div>
                </td>
                <td className="text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="font-bold text-primary">
                  {formatPrice(Number(order.totalAmount))}
                </td>
                <td>
                  <div className="badge badge-ghost badge-sm gap-1">
                    <Package size={12} /> {order._count.items}
                  </div>
                </td>
                <td>
                  <div
                    className={`badge badge-sm font-bold ${order.paymentStatus === "PAID" ? "badge-success text-white" : "badge-warning text-warning-content"}`}
                  >
                    {order.paymentMethod}
                  </div>
                </td>
                <td>
                  {/* Client Component for Interactivity */}
                  <OrderStatusSelect
                    orderId={order.id}
                    currentStatus={order.status}
                  />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 opacity-50">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
