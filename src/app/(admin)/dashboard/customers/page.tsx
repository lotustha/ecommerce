import { prisma } from "@/lib/db/prisma";
import { Mail, Calendar, ShoppingBag, Plus, Edit, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DeleteCustomerButton from "./_components/delete-button";
import CustomerFilterBar from "./_components/customer-filter";
import Pagination from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const currentPage = Number(params.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Build Where Clause
  const where: any = {
    role: "USER", // Explicitly filter for customers only
    OR: [{ name: { contains: query } }, { email: { contains: query } }],
  };

  // Fetch Data
  const [customers, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
        orders: {
          where: { paymentStatus: "PAID" },
          select: { totalAmount: true },
        },
        // ✅ Fetch Default Address
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
          <h1 className="text-3xl font-black tracking-tight">Customers</h1>
          <p className="text-sm opacity-60">
            View and manage your customer base ({totalCount})
          </p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="btn btn-primary rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Add Customer
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-between items-center bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <CustomerFilterBar />
      </div>

      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50 text-base-content/60 uppercase text-xs font-bold">
              <tr>
                <th className="pl-6">Customer</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th className="text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const totalSpent = customer.orders.reduce(
                  (acc, order) => acc + Number(order.totalAmount),
                  0,
                );
                const defaultAddress = customer.addresses[0];

                return (
                  <tr key={customer.id} className="hover group">
                    <td className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-10">
                            {customer.image ? (
                              <Image
                                src={customer.image}
                                alt={customer.name || ""}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <span>{customer.name?.[0] || "U"}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">
                            {customer.name || "Unknown"}
                          </div>
                          <div className="text-xs opacity-50 font-mono">
                            ID: {customer.id.slice(-4)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {defaultAddress ? (
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin
                            size={14}
                            className="opacity-50 text-primary"
                          />
                          {defaultAddress.city}, {defaultAddress.district}
                        </div>
                      ) : (
                        <span className="text-xs opacity-40 italic">
                          No address
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="opacity-50" />
                        {customer.email}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <Calendar size={14} />
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-ghost badge-sm gap-1">
                        <ShoppingBag size={12} /> {customer._count.orders}
                      </div>
                    </td>
                    <td className="font-mono font-bold text-success">
                      {formatPrice(totalSpent)}
                    </td>
                    <td className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/dashboard/customers/edit/${customer.id}`}
                          className="btn btn-ghost btn-xs btn-square text-info hover:bg-info/10"
                        >
                          <Edit size={16} />
                        </Link>
                        <DeleteCustomerButton id={customer.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 opacity-50">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-bold">No customers found</p>
                      <p className="text-sm">Try adjusting your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pb-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
}
