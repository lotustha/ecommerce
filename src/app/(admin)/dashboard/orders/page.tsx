import { prisma } from "@/lib/db/prisma";
import { Package, Calendar, Eye, ArrowUpRight } from "lucide-react";
import OrderStatusSelect from "./_components/status-select";
import Link from "next/link";
import OrderFilterBar from "./_components/order-filter";
import Pagination from "@/components/ui/pagination";
import OrderPrintActions from "./_components/order-print-actions"; // ✅ Added Print Actions Component

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
    ],
  };

  if (statusFilter) {
    where.status = statusFilter;
  }

  // ✅ Sequentially fetch Settings and Orders to prevent connection pooling limits,
  // and include Product Images for the new Visual Items Column
  const [orders, totalCount, settings] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, image: true } },
        items: {
          include: {
            product: { select: { images: true } }, // Fetch images to display in table
          },
        },
      },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.order.count({ where }),
    prisma.systemSetting.findUnique({ where: { id: "default" } }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(Number(p));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Orders</h1>
          <p className="text-sm opacity-60">
            Manage and track customer orders ({totalCount})
          </p>
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
                <th>Items</th>
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
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-mono text-xs font-bold opacity-60 hover:text-primary hover:underline flex items-center gap-1"
                      >
                        #{order.id.slice(-6).toUpperCase()}
                        <ArrowUpRight
                          size={10}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </Link>
                      <div className="text-[10px] opacity-50 mt-1 flex items-center gap-1">
                        <Calendar size={10} /> {formatDate(order.createdAt)}
                      </div>
                    </td>

                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-8">
                            <span>{shipping.fullName?.[0] || "?"}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {shipping.fullName}
                          </div>
                          <div className="text-xs opacity-50">
                            {order.user?.email || "Guest User"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ✅ VISUAL ITEMS COLUMN */}
                    <td className="max-w-[200px]">
                      <div className="flex -space-x-2 overflow-hidden mb-1.5">
                        {order.items.slice(0, 3).map((item) => {
                          let imageUrl = "/placeholder.jpg";
                          try {
                            const imgs = item.product?.images
                              ? JSON.parse(item.product.images)
                              : [];
                            if (imgs.length > 0) imageUrl = imgs[0];
                          } catch (e) { }
                          return (
                            <div
                              key={item.id}
                              className="inline-block h-8 w-8 rounded-full ring-2 ring-base-100 bg-base-200 overflow-hidden shrink-0 tooltip"
                              data-tip={item.name}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          );
                        })}
                        {order.items.length > 3 && (
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-base-100 bg-base-200 text-[10px] font-bold shrink-0 text-base-content/60">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="text-xs opacity-60 truncate font-medium">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </div>
                    </td>

                    <td>
                      <div className="font-bold">
                        {formatPrice(Number(order.totalAmount))}
                      </div>
                      <div
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit mt-1 border ${order.paymentStatus === "PAID"
                            ? "bg-success/10 text-success border-success/20"
                            : order.paymentStatus === "FAILED"
                              ? "bg-error/10 text-error border-error/20"
                              : "bg-warning/10 text-warning-content border-warning/20"
                          }`}
                      >
                        {order.paymentMethod}
                      </div>
                    </td>

                    <td>
                      <OrderStatusSelect
                        id={order.id}
                        currentStatus={order.status}
                      />
                    </td>

                    {/* ✅ UPDATED ACTIONS: Print Options + View Details */}
                    <td className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <OrderPrintActions
                          order={JSON.parse(JSON.stringify(order))}
                          settings={JSON.parse(JSON.stringify(settings))}
                        />

                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="btn btn-sm btn-ghost btn-square text-base-content/50 hover:text-primary hover:bg-primary/10"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 opacity-50">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-bold">No orders found</p>
                      <p className="text-sm">
                        Wait for customers to place their first order.
                      </p>
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
