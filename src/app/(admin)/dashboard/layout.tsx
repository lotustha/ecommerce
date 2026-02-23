import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { logout } from "@/actions/logout";
import SidebarNav from "./_components/sidebar-nav"; // ✅ Import Client Component

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Intelligent Route Protection & Redirection
  if (!session) {
    redirect("/login");
  }

  // ✅ Auto-redirect users to their correct designated portal
  if (session.user.role === "RIDER") {
    redirect("/rider");
  }
  if (session.user.role === "USER") {
    redirect("/profile");
  }

  // At this point, only ADMIN and STAFF roles will render the dashboard below

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-base-100 border-r border-base-200 flex-shrink-0 hidden lg:flex flex-col fixed h-full">
        <div className="p-6 border-b border-base-200">
          <Link href="/" className="text-2xl font-black text-primary tracking-tight">
            Nepal E-com
            <span className="text-xs font-normal text-base-content/50 block">Admin Panel</span>
          </Link>
        </div>

        {/* ✅ Use Client Component for Active State */}
        <SidebarNav />

        <div className="p-4 border-t border-base-200 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="avatar">
              <div className="w-8 rounded-full bg-neutral text-neutral-content flex items-center justify-center font-bold">
                {session.user.name?.[0] || "A"}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{session.user.name}</p>
              <p className="text-xs text-base-content/50 truncate">Administrator</p>
            </div>
          </div>
          <form action={logout}>
            <button className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-error w-full hover:bg-error/10 rounded-xl transition-colors">
              <LogOut size={18} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 bg-base-100 border-b border-base-200 flex justify-between items-center sticky top-0 z-20">
          <span className="font-bold text-lg">Admin Panel</span>
          {/* Mobile Menu Trigger */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <Settings size={20} />
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><Link href="/">Back to Store</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/dashboard/orders">Orders</Link></li>
              <li><Link href="/dashboard/products">Products</Link></li>
            </ul>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}