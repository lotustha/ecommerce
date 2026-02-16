import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/shop/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            addresses: true
        }
    });

    if (!user) {
        // Should theoretically not happen if session exists
        redirect("/login");
    }

    return (
        <div className="py-10 px-4">
            <ProfileForm initialData={user} />
        </div>
    );
}