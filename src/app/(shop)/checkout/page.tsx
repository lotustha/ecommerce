import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CheckoutForm from "./_components/checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/checkout");
    }

    // Fetch User with Default Address
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            addresses: {
                where: { isDefault: true },
                take: 1
            }
        }
    });

    const defaultAddress = user?.addresses[0] || null;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 md:px-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/cart" className="btn btn-circle btn-ghost btn-sm">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black tracking-tight">Checkout</h1>
            </div>

            <CheckoutForm
                user={{
                    name: user?.name,
                    email: user?.email,
                    phone: user?.phone
                }}
                defaultAddress={defaultAddress}
            />
        </div>
    );
}