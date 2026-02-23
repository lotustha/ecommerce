import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut, Bike } from "lucide-react";
import { logout } from "@/actions/logout";

export const metadata = {
    title: "Rider Dashboard | Nepal E-com",
    description: "Mobile dashboard for delivery riders",
};

export default async function RiderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // 1. Secure the Rider Route
    if (!session) {
        redirect("/login");
    }

    // 2. Ensure only Riders can access this layout
    if (session.user.role !== "RIDER") {
        if (session.user.role === "ADMIN" || session.user.role === "STAFF") redirect("/dashboard");
        if (session.user.role === "USER") redirect("/profile");
    }

    return (
        <div className="min-h-screen bg-base-200 flex flex-col font-sans">
            {/* Mobile Friendly Header */}
            <header className="bg-base-100 border-b border-base-200 p-4 sticky top-0 z-50 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Bike size={24} />
                    </div>
                    <div>
                        <h1 className="font-black text-lg leading-none">Rider App</h1>
                        <p className="text-xs opacity-60 font-medium">{session.user.name}</p>
                    </div>
                </div>

                <form action={logout}>
                    <button className="btn btn-square btn-ghost text-error">
                        <LogOut size={20} />
                    </button>
                </form>
            </header>

            {/* Main Content Area (Constrained for mobile readability) */}
            <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-10">
                {children}
            </main>
        </div>
    );
}