import { prisma } from "@/lib/db/prisma";
import { Plus, Edit, Ticket, CheckCircle2, Clock, Ban } from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/ui/pagination";
import CouponFilterBar from "./_components/coupon-filter";

export const dynamic = "force-dynamic";
const ITEMS_PER_PAGE = 10;

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "";
  const currentPage = Number(params.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const now = new Date();

  // Build Where Clause
  const where: any = {};

  if (query) {
    where.code = { contains: query };
  }

  if (statusFilter === "ACTIVE") {
    where.isActive = true;
    where.OR = [{ expiresAt: { gte: now } }, { expiresAt: null }];
  } else if (statusFilter === "INACTIVE") {
    where.isActive = false;
  } else if (statusFilter === "EXPIRED") {
    where.expiresAt = { lt: now };
  }

  const [coupons, totalCount] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { id: "desc" },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.coupon.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Coupons & Offers
          </h1>
          <p className="text-sm opacity-60">
            Manage your store's promotional codes ({totalCount})
          </p>
        </div>
        <Link
          href="/dashboard/coupons/new"
          className="btn btn-primary rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Create Coupon
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <CouponFilterBar />
      </div>

      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50 text-base-content/60 uppercase text-xs font-bold">
              <tr>
                <th className="pl-6">Code</th>
                <th>Discount</th>
                <th>Rules</th>
                <th>Usage</th>
                <th>Status</th>
                <th className="text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const isExpired =
                  coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

                return (
                  <tr key={coupon.id} className="hover">
                    <td className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                          <Ticket size={20} />
                        </div>
                        <span className="font-mono font-black text-lg tracking-widest">
                          {coupon.code}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-success text-base">
                        {coupon.type === "PERCENTAGE"
                          ? `${coupon.value}% OFF`
                          : `Rs. ${coupon.value} OFF`}
                      </div>
                      {coupon.type === "PERCENTAGE" && coupon.maxDiscount && (
                        <div className="text-xs opacity-50">
                          Up to Rs. {Number(coupon.maxDiscount)}
                        </div>
                      )}
                    </td>
                    <td>
                      {coupon.minOrder ? (
                        <span className="text-sm">
                          Min order:{" "}
                          <strong>Rs. {Number(coupon.minOrder)}</strong>
                        </span>
                      ) : (
                        <span className="text-xs opacity-50 italic">
                          No minimum
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="badge badge-neutral font-bold">
                        {coupon.usedCount} times
                      </div>
                    </td>
                    <td>
                      {!coupon.isActive ? (
                        <span className="badge badge-sm badge-error text-white gap-1 py-3">
                          <Ban size={12} /> Disabled
                        </span>
                      ) : isExpired ? (
                        <span className="badge badge-sm badge-warning gap-1 py-3">
                          <Clock size={12} /> Expired
                        </span>
                      ) : (
                        <span className="badge badge-sm badge-success text-white gap-1 py-3">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td className="text-right pr-6">
                      <Link
                        href={`/dashboard/coupons/edit/${coupon.id}`}
                        className="btn btn-ghost btn-sm btn-square text-info hover:bg-info/10"
                      >
                        <Edit size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 opacity-50">
                    <div className="flex flex-col items-center justify-center">
                      <Ticket size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold">No coupons found</p>
                      <p className="text-sm">
                        Create your first discount code to boost sales!
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
