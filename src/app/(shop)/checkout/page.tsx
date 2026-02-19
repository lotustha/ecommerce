import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CheckoutForm from "./_components/checkout-form";
import { getPublicSettings } from "@/actions/public-settings";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();

  let user = null;
  let defaultAddress = null;

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });

    if (dbUser) {
      user = {
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
      };
      if (dbUser.addresses.length > 0) {
        defaultAddress = dbUser.addresses[0];
      }
    }
  }

  // Fetch Store settings for dynamic payment & shipping calculation rules
  const settings = await getPublicSettings();

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 md:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="btn btn-circle btn-ghost btn-sm">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-black tracking-tight">Checkout</h1>
      </div>

      <CheckoutForm
        user={user}
        defaultAddress={defaultAddress}
        settings={settings}
      />
    </div>
  );
}
