import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Package,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, slug: true, images: true },
          },
        },
      },
    },
  });

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const shippingAddress = JSON.parse(order.shippingAddress as string);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(p);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status Steps Logic
  const steps = [
    { status: "PENDING", label: "Order Placed", icon: Clock },
    { status: "PROCESSING", label: "Processing", icon: Package },
    { status: "SHIPPED", label: "Shipped", icon: Truck },
    { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === "CANCELLED";

  const showPayNow =
    (order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED") &&
    (order.paymentMethod === "ESEWA" || order.paymentMethod === "KHALTI");

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/orders" className="btn btn-circle btn-ghost btn-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            Order #{order.id.slice(-6).toUpperCase()}
            {isCancelled && (
              <span className="badge badge-error text-white">Cancelled</span>
            )}
          </h1>
          <p className="text-sm opacity-60 flex items-center gap-2">
            <Calendar size={14} /> Placed on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Tracker */}
          {!isCancelled && (
            <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <div className="card-body p-6">
                <ul className="steps steps-vertical sm:steps-horizontal w-full">
                  {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    return (
                      <li
                        key={step.status}
                        className={`step ${isCompleted ? "step-primary" : ""}`}
                      >
                        <span
                          className={`text-xs font-bold mt-2 ${isCompleted ? "text-base-content" : "opacity-40"}`}
                        >
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 border-b border-base-200 bg-base-200/30">
                <h3 className="font-bold flex items-center gap-2">
                  <Package size={18} /> Items ({order.items.length})
                </h3>
              </div>
              <div className="divide-y divide-base-200">
                {order.items.map((item) => {
                  let imageUrl = "/placeholder.jpg";
                  try {
                    if (item.product?.images) {
                      const imgs = JSON.parse(item.product.images);
                      if (imgs.length > 0) imageUrl = imgs[0];
                    }
                  } catch (e) {}

                  return (
                    <div
                      key={item.id}
                      className="p-4 flex gap-4 items-start hover:bg-base-200/20 transition-colors"
                    >
                      <div className="w-20 h-20 bg-base-200 rounded-xl overflow-hidden shrink-0 border border-base-200 relative">
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <Link
                            href={`/product/${item.product?.slug}`}
                            className="font-bold hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <p className="font-bold text-sm">
                            {formatPrice(Number(item.price) * item.quantity)}
                          </p>
                        </div>
                        <p className="text-xs opacity-60 mt-1">
                          Unit Price: {formatPrice(Number(item.price))}
                        </p>
                        <div className="badge badge-sm mt-2">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Info */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard size={20} /> Payment
              </h3>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm opacity-70">Total Amount</span>
                <span className="font-black text-xl text-primary">
                  {formatPrice(Number(order.totalAmount))}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm mb-2">
                <span className="opacity-70">Method</span>
                <span className="font-bold">{order.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center text-sm mb-6">
                <span className="opacity-70">Status</span>
                <span
                  className={`badge font-bold ${order.paymentStatus === "PAID" ? "badge-success text-white" : "badge-warning text-warning-content"}`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              {showPayNow && (
                <Link
                  href={`/payment/${order.id}`}
                  className="btn btn-primary btn-block shadow-lg shadow-primary/20"
                >
                  <Wallet size={18} /> Pay Now
                </Link>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin size={20} /> Delivery
              </h3>
              <div className="space-y-3 text-sm">
                <div className="font-bold text-base">
                  {shippingAddress.fullName}
                </div>
                <div className="flex items-start gap-3 opacity-80">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {shippingAddress.street},{" "}
                    {shippingAddress.ward && `Ward ${shippingAddress.ward}, `}
                    {shippingAddress.city}, {shippingAddress.district},{" "}
                    {shippingAddress.province}
                  </span>
                </div>
                <div className="flex items-center gap-3 opacity-80">
                  <Phone size={16} /> {shippingAddress.phone}
                </div>
                {shippingAddress.email && (
                  <div className="flex items-center gap-3 opacity-80">
                    <Mail size={16} /> {shippingAddress.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Need Help */}
          <div className="card bg-base-200/50 border border-base-200 border-dashed text-center">
            <div className="card-body p-6">
              <p className="text-sm font-bold opacity-60">
                Need help with this order?
              </p>
              <Link
                href="/contact"
                className="link link-primary text-sm font-bold no-underline hover:underline"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
