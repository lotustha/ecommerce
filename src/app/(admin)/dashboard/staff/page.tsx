import { prisma } from "@/lib/db/prisma";
import { Mail, Calendar, Plus, Edit, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import DeleteStaffButton from "./_components/delete-button";
import StaffFilterBar from "./_components/staff-filter";
import Pagination from "@/components/ui/pagination";

export const dynamic = "force-dynamic";
const ITEMS_PER_PAGE = 10;

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const roleFilter = params.role;
  const currentPage = Number(params.page) || 1;
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const where: any = {
    role: roleFilter ? roleFilter : { in: ["ADMIN", "STAFF", "RIDER"] },
    OR: [{ name: { contains: query } }, { email: { contains: query } }],
  };

  const [staff, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Staff Management
          </h1>
          <p className="text-sm opacity-60">
            Manage administrators, staff, and riders ({totalCount})
          </p>
        </div>
        <Link
          href="/dashboard/staff/new"
          className="btn btn-primary rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Add Staff
        </Link>
      </div>

      <div className="flex justify-between items-center bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <StaffFilterBar />
      </div>

      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50 text-base-content/60 uppercase text-xs font-bold">
              <tr>
                <th className="pl-6">Staff Member</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Joined</th>
                <th className="text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((user) => (
                <tr key={user.id} className="hover">
                  <td className="pl-6">
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name || ""}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <span>{user.name?.[0] || "U"}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">
                          {user.name || "Unknown"}
                        </div>
                        <div className="text-xs opacity-50 font-mono">
                          ID: {user.id.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm font-bold gap-1 py-3 ${
                        user.role === "ADMIN"
                          ? "badge-error text-white"
                          : user.role === "STAFF"
                            ? "badge-info text-white"
                            : "badge-warning text-white"
                      }`}
                    >
                      <Shield size={12} /> {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={14} className="opacity-50" />
                      {user.email}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm opacity-70">
                      <Calendar size={14} />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="text-right pr-6">
                    {/* Actions are now always visible */}
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/staff/edit/${user.id}`}
                        className="btn btn-ghost btn-xs btn-square text-info hover:bg-info/10"
                      >
                        <Edit size={16} />
                      </Link>
                      <DeleteStaffButton
                        id={user.id}
                        name={user.name || "Staff"}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 opacity-50">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-bold">No staff found</p>
                      <p className="text-sm">
                        Adjust filters or add new staff.
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
