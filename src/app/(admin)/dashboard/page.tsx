import { prisma } from "@/lib/db/prisma";
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // 1. Fetch Stats
  const [orderCount, productCount, userCount, totalRevenue] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "PAID" }
    })
  ]);

  // 2. Fetch Recent Orders
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, image: true } }
    }
  });

  // 3. Fetch Recent Products
  const recentProducts = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: "desc" }
  });

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(Number(p));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  };

  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(Number(totalRevenue._sum.totalAmount || 0)),
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
      trend: "+12.5%"
    },
    {
      label: "Total Orders",
      value: orderCount,
      icon: ShoppingBag,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: "+5.2%"
    },
    {
      label: "Products",
      value: productCount,
      icon: Package,
      color: "text-warning",
      bg: "bg-warning/10",
      trend: "+2.1%"
    },
    {
      label: "Customers",
      value: userCount,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      trend: "+8.4%"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="text-sm opacity-60">Overview of your store's performance.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-outline">Last 7 Days</button>
          <button className="btn btn-sm btn-primary shadow-lg shadow-primary/20">Download Report</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
            <div className="card-body p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-base-content/60 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black">{stat.value}</h3>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs font-bold text-success bg-success/5 w-fit px-2 py-1 rounded-lg">
                <TrendingUp size={12} />
                {stat.trend} from last month
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
              <div className="p-6 border-b border-base-200 flex justify-between items-center">
                <h2 className="text-lg font-bold">Recent Orders</h2>
                <Link href="/dashboard/orders" className="btn btn-ghost btn-sm text-primary">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="text-xs uppercase bg-base-200/50 text-base-content/60">
                      <th className="pl-6 py-4">Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th className="pr-6 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover">
                        <td className="pl-6 font-mono text-xs font-bold opacity-60">#{order.id.slice(-6).toUpperCase()}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-neutral-content text-neutral-focus rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                                {order.user?.name?.[0] || "G"}
                              </div>
                            </div>
                            <div className="font-bold text-sm">{order.user?.name || "Guest"}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-sm font-bold ${order.status === 'DELIVERED' ? 'badge-success text-white' :
                              order.status === 'CANCELLED' ? 'badge-error text-white' :
                                'badge-warning'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="font-bold text-sm">{formatPrice(Number(order.totalAmount))}</td>
                        <td className="pr-6 text-right text-xs opacity-60">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 opacity-50">No recent orders</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right: New Products */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-0">
              <div className="p-6 border-b border-base-200">
                <h2 className="text-lg font-bold">New Products</h2>
              </div>
              <div className="divide-y divide-base-200">
                {recentProducts.map(product => {
                  let image = "/placeholder.jpg";
                  try {
                    if (product.images) {
                      const imgs = JSON.parse(product.images);
                      if (imgs.length > 0) image = imgs[0];
                    }
                  } catch (e) { }

                  return (
                    <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-base-200/30 transition-colors group">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-xl bg-base-200 border border-base-300">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <Image src={image} alt={product.name} width={48} height={48} className="object-cover rounded-xl" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{product.name}</p>
                        <p className="text-xs text-base-content/50">{formatPrice(Number(product.price))}</p>
                      </div>
                      <Link href={`/dashboard/products/edit/${product.id}`} className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  )
                })}
                {recentProducts.length === 0 && (
                  <div className="p-8 text-center opacity-50">No products found</div>
                )}
              </div>
              <div className="p-4 border-t border-base-200">
                <Link href="/dashboard/products" className="btn btn-block btn-outline btn-sm">View All Products</Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}