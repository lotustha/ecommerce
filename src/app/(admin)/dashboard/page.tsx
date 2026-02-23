import { prisma } from "@/lib/db/prisma";
import { Package, ShoppingCart, Users, Banknote, TrendingUp, TrendingDown, CheckCircle, Clock, Truck, Download } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // 1. Fetch High-Level Stats
  const [totalOrders, totalProducts, totalUsers, totalRevenueAgg] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalAmount: true }
    })
  ]);

  const totalRevenue = Number(totalRevenueAgg._sum.totalAmount || 0);

  // 2. Fetch Last 30 Days Data for Chart
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      paymentStatus: "PAID"
    },
    select: { createdAt: true, totalAmount: true }
  });

  // Aggregate Revenue by Day
  const revenueByDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    revenueByDay[d.toISOString().split('T')[0]] = 0; // Initialize last 30 days with 0
  }

  recentOrders.forEach(order => {
    const dateStr = order.createdAt.toISOString().split('T')[0];
    if (revenueByDay[dateStr] !== undefined) {
      revenueByDay[dateStr] += Number(order.totalAmount);
    }
  });

  // Format data for chart (Reverse so oldest is left, newest is right)
  const chartData = Object.entries(revenueByDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount
    }));

  const maxRevenueDay = Math.max(...chartData.map(d => d.amount), 1); // Prevent div by 0

  // 3. Fetch Top Selling Products
  const topItems = await prisma.orderItem.groupBy({
    by: ['productId', 'name'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5
  });

  // 4. Fetch Order Status Distribution
  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    _count: { status: true }
  });

  const getStatusCount = (status: string) => statusCounts.find(s => s.status === status)?._count.status || 0;
  const pendingCount = getStatusCount("PENDING");
  const shippingCount = getStatusCount("SHIPPED") + getStatusCount("READY_TO_SHIP");
  const deliveredCount = getStatusCount("DELIVERED");

  // Formatters
  const formatPrice = (p: number) => new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(p);

  return (
    <div className="space-y-8 pb-20">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dashboard Overview</h1>
          <p className="text-sm opacity-60">Your business at a glance</p>
        </div>
        <a href="/api/admin/export-orders" download className="btn btn-primary rounded-xl shadow-lg shadow-primary/20 gap-2">
          <Download size={18} /> Export CSV
        </a>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Revenue", value: formatPrice(totalRevenue), icon: Banknote, color: "text-success", bg: "bg-success/10" },
          { title: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-primary", bg: "bg-primary/10" },
          { title: "Active Products", value: totalProducts.toLocaleString(), icon: Package, color: "text-info", bg: "bg-info/10" },
          { title: "Customers", value: totalUsers.toLocaleString(), icon: Users, color: "text-warning", bg: "bg-warning/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-bold opacity-50 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-2xl font-black">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* REVENUE CHART (Dependency-Free CSS Bar Chart) */}
        <div className="lg:col-span-2 bg-base-100 p-6 md:p-8 rounded-3xl border border-base-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> 30-Day Revenue</h3>
              <p className="text-xs opacity-60">Paid orders over the last 30 days</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold opacity-50 uppercase tracking-widest block">Period Total</span>
              <span className="font-black text-xl text-primary">{formatPrice(chartData.reduce((acc, curr) => acc + curr.amount, 0))}</span>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-1 sm:gap-2 h-[250px] relative mt-auto pt-4 border-b border-base-300 group">
            {/* Y-Axis Lines (Decorative) */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-dashed border-base-content w-full h-0"></div>
              <div className="border-t border-dashed border-base-content w-full h-0"></div>
              <div className="border-t border-dashed border-base-content w-full h-0"></div>
            </div>

            {/* Chart Bars */}
            {chartData.map((data, i) => {
              const heightPercent = (data.amount / maxRevenueDay) * 100;
              return (
                <div key={i} className="relative flex-1 flex flex-col justify-end h-full group/bar">
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-base-content text-base-100 text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    {data.date}: {formatPrice(data.amount)}
                  </div>
                  {/* Bar */}
                  <div
                    className="bg-primary hover:bg-primary-focus transition-all rounded-t-sm"
                    style={{ height: `${Math.max(heightPercent, 2)}%`, opacity: heightPercent === 0 ? 0.2 : 1 }}
                  ></div>
                </div>
              )
            })}
          </div>

          {/* X-Axis Labels (Show sparse labels so it doesn't crowd) */}
          <div className="flex justify-between mt-3 text-[10px] font-bold opacity-40 uppercase">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[15]?.date}</span>
            <span>{chartData[29]?.date}</span>
          </div>
        </div>

        {/* SIDEBAR: Order Status & Top Products */}
        <div className="space-y-6">

          {/* Order Fulfillment Status */}
          <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Fulfillment Pipeline</h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1 font-bold">
                  <span className="flex items-center gap-1.5"><Clock size={16} className="text-warning" /> Pending</span>
                  <span>{pendingCount}</span>
                </div>
                <progress className="progress progress-warning w-full bg-base-200" value={pendingCount} max={totalOrders || 1}></progress>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 font-bold">
                  <span className="flex items-center gap-1.5"><Truck size={16} className="text-info" /> Shipping</span>
                  <span>{shippingCount}</span>
                </div>
                <progress className="progress progress-info w-full bg-base-200" value={shippingCount} max={totalOrders || 1}></progress>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 font-bold">
                  <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-success" /> Delivered</span>
                  <span>{deliveredCount}</span>
                </div>
                <progress className="progress progress-success w-full bg-base-200" value={deliveredCount} max={totalOrders || 1}></progress>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
              Top Products
              <Link href="/dashboard/products" className="text-xs font-bold text-primary hover:underline">View All</Link>
            </h3>
            <div className="space-y-4">
              {topItems.map((item, i) => (
                <div key={item.productId} className="flex items-center justify-between gap-3 p-3 bg-base-200/50 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-base-100 flex items-center justify-center text-xs font-bold shrink-0 border border-base-300">
                      {i + 1}
                    </div>
                    <p className="text-sm font-bold truncate">{item.name}</p>
                  </div>
                  <span className="badge badge-primary font-bold shrink-0">{item._sum.quantity} Sold</span>
                </div>
              ))}
              {topItems.length === 0 && (
                <p className="text-sm opacity-50 text-center py-4">No sales data yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}