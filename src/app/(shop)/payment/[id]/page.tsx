import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import PaymentInteraction from "./_components/payment-interaction"; // ✅ Updated Import

export const dynamic = "force-dynamic";

interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  if (order.paymentStatus === "PAID") {
    redirect(`/orders`);
  }

  const shippingAddress = JSON.parse(order.shippingAddress as string);
  const totalAmount = Number(order.totalAmount);

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <div className="card bg-base-100 shadow-xl border border-base-200 text-center p-8">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Wallet size={40} />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-2">Complete Payment</h1>
        <p className="text-base-content/60 mb-8">
          Order <strong>#{order.id.slice(-6).toUpperCase()}</strong>
          <br />
          Please select a payment method to proceed.
        </p>

        {/* ✅ New Interaction Component */}
        <PaymentInteraction
          orderId={order.id}
          amount={totalAmount}
          initialMethod={order.paymentMethod}
          customer={{
            name: shippingAddress.fullName,
            email: session.user.email || "",
            phone: order.phone,
          }}
        />

        <div className="mt-6 text-xs text-base-content/40">
          Secure payment processing via SSL.
        </div>
      </div>
    </div>
  );
}
