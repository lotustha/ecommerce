import { prisma } from "@/lib/db/prisma";
import {
  DollarSign,
  CreditCard,
  Wallet,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import PaymentFilterBar from "./_components/payment-filter";
import Pagination from "@/components/ui/pagination";
import RefundButton from "./_components/refund-button";

export const dynamic = "force-dynamic";
const ITEMS_PER_PAGE = 10;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    method?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const methodFilter = params.method;
  const statusFilter = params.status;
  const currentPage = Number(params.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Build Where Clause
  const where: any = {
    OR: [
      { id: { contains: query } },
      { user: { name: { contains: query } } },
      { shippingAddress: { contains: query } },
    ],
  };

  if (methodFilter) where.paymentMethod = methodFilter;
  if (statusFilter) where.paymentStatus = statusFilter;

  // Fetch Data
  const [transactions, totalCount, stats] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const totalRevenue =
    stats.find((s) => s.paymentStatus === "PAID")?._sum.totalAmount || 0;
  const pendingAmount =
    stats.find((s) => s.paymentStatus === "UNPAID")?._sum.totalAmount || 0;
  const refundedAmount =
    stats.find((s) => s.paymentStatus === "REFUNDED")?._sum.totalAmount || 0;

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(Number(p));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Payments</h1>
          <p className="text-sm opacity-60">
            Transaction history and financial overview
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-success/10 text-success rounded-2xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium opacity-60">Total Revenue</p>
            <h3 className="text-2xl font-black">
              {formatPrice(Number(totalRevenue))}
            </h3>
          </div>
        </div>
        <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-warning/10 text-warning rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium opacity-60">Pending Payment</p>
            <h3 className="text-2xl font-black">
              {formatPrice(Number(pendingAmount))}
            </h3>
          </div>
        </div>
        <div className="bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-sm font-medium opacity-60">Refunded</p>
            <h3 className="text-2xl font-black">
              {formatPrice(Number(refundedAmount))}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <PaymentFilterBar />
      </div>

      {/* Transactions Table */}
      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50 text-base-content/60 uppercase text-xs font-bold">
              <tr>
                <th className="pl-6">Transaction ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const shipping = JSON.parse(tx.shippingAddress as string);
                return (
                  <tr key={tx.id} className="hover">
                    <td className="pl-6">
                      <Link
                        href={`/dashboard/orders`}
                        className="font-mono text-xs font-bold opacity-60 hover:text-primary hover:underline"
                      >
                        #{tx.id.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td>
                      <div className="font-bold text-sm">
                        {shipping.fullName || tx.user?.name || "Guest"}
                      </div>
                      <div className="text-xs opacity-50">
                        {tx.user?.email || "Unknown"}
                      </div>
                    </td>
                    <td className="text-sm opacity-70">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 font-medium">
                        {tx.paymentMethod === "ESEWA" && (
                          <span className="w-2 h-2 rounded-full bg-[#60bb46]"></span>
                        )}
                        {tx.paymentMethod === "KHALTI" && (
                          <span className="w-2 h-2 rounded-full bg-[#5c2d91]"></span>
                        )}
                        {tx.paymentMethod === "COD" && (
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        )}
                        {tx.paymentMethod}
                      </div>
                    </td>
                    <td className="font-bold font-mono">
                      {formatPrice(Number(tx.totalAmount))}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm font-bold py-3 gap-1 ${
                          tx.paymentStatus === "PAID"
                            ? "badge-success text-white"
                            : tx.paymentStatus === "FAILED"
                              ? "badge-error text-white"
                              : tx.paymentStatus === "REFUNDED"
                                ? "badge-neutral text-white"
                                : "badge-warning"
                        }`}
                      >
                        {tx.paymentStatus === "PAID" && (
                          <CheckCircle2 size={12} />
                        )}
                        {tx.paymentStatus === "FAILED" && (
                          <AlertTriangle size={12} />
                        )}
                        {tx.paymentStatus === "UNPAID" && <Clock size={12} />}
                        {tx.paymentStatus === "REFUNDED" && (
                          <ArrowUpRight size={12} />
                        )}
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td className="text-right pr-6">
                      {/* ✅ Only show Refund button if status is PAID */}
                      {tx.paymentStatus === "PAID" && (
                        <RefundButton
                          orderId={tx.id}
                          amount={formatPrice(Number(tx.totalAmount))}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 opacity-50">
                    <div className="flex flex-col items-center justify-center">
                      <Wallet size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold">No transactions found</p>
                      <p className="text-sm">Try adjusting your filters.</p>
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
