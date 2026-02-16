import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, AlertCircle, Wallet } from "lucide-react";
import PaymentButton from "./[id]/_components/payment-button";

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

  // If already paid, redirect to orders
  if (order.paymentStatus === "PAID") {
    redirect(`/orders`);
  }

  const shippingAddress = JSON.parse(order.shippingAddress as string);

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <div className="card bg-base-100 shadow-xl border border-base-200 text-center p-8">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Wallet size={40} />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-2">Complete Payment</h1>
        <p className="text-base-content/60 mb-8">
          Order <strong>#{order.id.slice(-6).toUpperCase()}</strong> has been
          placed.
          <br />
          Please complete the payment to confirm your order.
        </p>

        {/* Order Summary */}
        <div className="bg-base-200/50 p-6 rounded-2xl text-left mb-8 space-y-3">
          <div className="flex justify-between">
            <span className="opacity-70">Payment Method</span>
            <span className="font-bold">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Total Amount</span>
            <span className="font-bold text-lg text-primary">
              Rs. {Number(order.totalAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Action */}
        <PaymentButton
          orderId={order.id}
          amount={Number(order.totalAmount)}
          method={order.paymentMethod}
          customer={{
            name: shippingAddress.fullName,
            email: session.user.email || "",
            phone: order.phone,
          }}
        />

        <div className="mt-6 text-xs text-base-content/40">
          Secure payment processing powered by{" "}
          {order.paymentMethod === "ESEWA" ? "eSewa" : "Khalti"}.
        </div>
      </div>
    </div>
  );
}
