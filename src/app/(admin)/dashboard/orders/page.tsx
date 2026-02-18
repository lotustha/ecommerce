import { prisma } from "@/lib/db/prisma";
import { Package, Calendar, MapPin, Eye, ArrowUpRight, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import OrderStatusSelect from "./_components/status-select";
import Link from "next/link";
import OrderFilterBar from "./_components/order-filter";
import Pagination from "@/components/ui/pagination";

export const dynamic = "force-dynamic";
const ITEMS_PER_PAGE = 10;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status;
  const currentPage = Number(params.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const where: any = {
    OR: [
      { id: { contains: query } },
      // Search inside JSON field for customer name
      { shippingAddress: { contains: query } },
    ]
  };

  if (statusFilter) {
    where.status = statusFilter;
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, image: true } },
        _count: { select: { items: true } }
      },
      take: ITEMS_PER_PAGE,
      skip
    }),
    prisma.order.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(Number(p));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Orders</h1>
          <p className="text-sm opacity-60">Manage and track customer orders ({totalCount})</p>
        </div>
      </div>

      <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <OrderFilterBar />
      </div>

      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50 text-base-content/60 uppercase text-xs font-bold">
              <tr>
                <th className="pl-6">Order ID</th>
                <th>Customer</th>
                <th>Details</th>
                <th>Total</th>
                <th>Status</th>
                <th className="pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                let shipping = { fullName: "Unknown", city: "N/A" };
                try {
                  shipping = JSON.parse(order.shippingAddress as string);
                } catch (e) { }

                return (
                  <tr key={order.id} className="hover group transition-colors">
                    <td className="pl-6">
                      <Link href={`/dashboard/orders/${order.id}`} className="font-mono text-xs font-bold opacity-60 hover:text-primary hover:underline flex items-center gap-1">
                        #{order.id.slice(-6).toUpperCase()}
                        <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-8">
                            <span>{shipping.fullName?.[0] || "?"}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-sm">{shipping.fullName}</div>
                          <div className="text-xs opacity-50">{order.user?.email || "Guest User"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-xs opacity-70">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(order.createdAt)}</span>
                        <span className="flex items-center gap-1"><Package size={12} /> {order._count.items} Items</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold">{formatPrice(Number(order.totalAmount))}</div>
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mt-1 border ${order.paymentStatus === 'PAID' ? 'bg-success/10 text-success border-success/20' :
                          order.paymentStatus === 'FAILED' ? 'bg-error/10 text-error border-error/20' :
                            'bg-warning/10 text-warning-content border-warning/20'
                        }`}>
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td>
                      <OrderStatusSelect id={order.id} currentStatus={order.status} />
                    </td>
                    <td className="pr-6 text-right">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="btn btn-sm btn-ghost btn-square text-base-content/50 hover:text-primary hover:bg-primary/10"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 opacity-50">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-bold">No orders found</p>
                      <p className="text-sm">Wait for customers to place their first order.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pb-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
}