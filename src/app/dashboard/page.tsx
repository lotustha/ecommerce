import { auth } from "@/auth";
import { logout } from "@/actions/logout";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <form action={logout}>
            <button className="btn btn-error btn-outline">Sign Out</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">User Profile</h2>
              <div className="avatar placeholder mb-4">
                <div className="bg-neutral text-neutral-content rounded-full w-16">
                  <span className="text-xl">
                    {session.user?.name?.[0] || "U"}
                  </span>
                </div>
              </div>
              <p>
                <strong>Name:</strong> {session.user?.name}
              </p>
              <p>
                <strong>Email:</strong> {session.user?.email}
              </p>
              <p>
                <strong>Role:</strong>{" "}
                <span className="badge badge-accent">{session.user?.role}</span>
              </p>
              <p>
                <strong>ID:</strong>{" "}
                <span className="text-xs text-gray-400">
                  {session.user?.id}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions (Placeholder) */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Quick Actions</h2>
              <div className="flex flex-col gap-2 mt-4">
                <button className="btn btn-primary">View Orders</button>
                <button className="btn btn-secondary">Edit Profile</button>
                {session.user?.role === "ADMIN" && (
                  <button className="btn btn-warning">Go to Admin Panel</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
