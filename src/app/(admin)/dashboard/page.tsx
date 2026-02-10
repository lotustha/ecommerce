import { prisma } from "@/lib/db/prisma";
import { DollarSign, ShoppingBag, Package, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // 1. Fetch Stats
  const [orderCount, productCount, userCount, totalRevenue] = await Promise.all(
    [
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID" }, // Only count paid orders for revenue
      }),
    ],
  );

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(Number(p));
  };

  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(Number(totalRevenue._sum.totalAmount || 0)),
      icon: DollarSign,
      color: "text-success bg-success/10",
    },
    {
      label: "Total Orders",
      value: orderCount,
      icon: ShoppingBag,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Products",
      value: productCount,
      icon: Package,
      color: "text-warning bg-warning/10",
    },
    {
      label: "Customers",
      value: userCount,
      icon: Users,
      color: "text-purple-500 bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tight">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-base-content/60">
                {stat.label}
              </p>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-base-100 p-8 rounded-3xl border border-base-200 shadow-sm min-h-[300px]">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <p>Order chart coming soon...</p>
          </div>
        </div>
        <div className="bg-base-100 p-8 rounded-3xl border border-base-200 shadow-sm min-h-[300px]">
          <h2 className="text-xl font-bold mb-4">Top Products</h2>
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <p>Sales chart coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
