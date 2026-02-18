import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, MapPin, Phone, Mail, Package, CreditCard,
  Calendar, CheckCircle2, Clock, Truck, XCircle, Wallet,
  ChevronRight, ExternalLink, RefreshCw
} from "lucide-react";
import { getPathaoOrderStatus } from "@/lib/delivery/external-apis"; // Import tracking helper

export const dynamic = "force-dynamic";

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
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
            select: { name: true, slug: true, images: true, category: { select: { name: true } } }
          }
        }
      }
    }
  });

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  const shippingAddress = JSON.parse(order.shippingAddress as string);

  // ✅ FETCH LIVE TRACKING INFO
  let courierStatus = null;
  if (order.deliveryType === "EXTERNAL" && order.courier === "Pathao" && order.trackingCode) {
    const pathaoInfo = await getPathaoOrderStatus(order.trackingCode);
    if (pathaoInfo) {
      courierStatus = pathaoInfo.order_status; // e.g. "Pending", "Delivered"
    }
  }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(p);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const steps = [
    { status: "PENDING", label: "Order Placed", icon: Clock },
    { status: "PROCESSING", label: "Processing", icon: Package },
    { status: "SHIPPED", label: "Shipped", icon: Truck },
    { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);
  const isCancelled = order.status === "CANCELLED";
  const isReturned = order.status === "RETURNED";

  const showPayNow = (order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED") &&
    (order.paymentMethod === "ESEWA" || order.paymentMethod === "KHALTI");

  return (
    <div className="min-h-screen bg-base-200/30 pb-20">
      <div className="max-w-5xl mx-auto py-10 px-4 md:px-8">

        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-sm text-base-content/60 mb-6">
          <Link href="/orders" className="hover:text-primary transition-colors">My Orders</Link>
          <ChevronRight size={14} />
          <span className="text-base-content font-medium">#{order.id.slice(-6).toUpperCase()}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              Order #{order.id.slice(-6).toUpperCase()}
              {isCancelled && <span className="badge badge-error text-white">Cancelled</span>}
              {isReturned && <span className="badge badge-warning text-white">Returned</span>}
            </h1>
            <p className="text-sm opacity-60 mt-1 flex items-center gap-2">
              <Calendar size={14} /> Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          {showPayNow && (
            <Link href={`/payment/${order.id}`} className="btn btn-primary rounded-xl shadow-lg shadow-primary/20 animate-pulse">
              <CreditCard size={18} /> Pay Now
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Main Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status Tracker */}
            <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <div className="card-body p-8">
                {!isCancelled && !isReturned ? (
                  <ul className="steps steps-vertical sm:steps-horizontal w-full">
                    {steps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      return (
                        <li key={step.status} className={`step ${isCompleted ? "step-primary" : ""}`}>
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-xs font-bold ${isCompleted ? "text-base-content" : "opacity-40"}`}>
                              {step.label}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-error/80">
                    <XCircle size={48} className="mb-2" />
                    <p className="font-bold text-lg">{isCancelled ? 'Order Cancelled' : 'Order Returned'}</p>
                    <p className="text-sm opacity-70">If you have questions, please contact support.</p>
                  </div>
                )}

                {/* External Tracking Link */}
                {order.trackingCode && order.deliveryType === 'EXTERNAL' && (
                  <div className="mt-8 pt-6 border-t border-base-200">
                    <div className="flex items-center justify-between bg-base-200/50 p-4 rounded-xl border border-base-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-base-100 rounded-full flex items-center justify-center border border-base-200">
                          <Truck className="text-primary" size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase opacity-60">Courier Tracking</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-lg">{order.trackingCode}</p>
                            {courierStatus && (
                              <span className="badge badge-sm badge-neutral">{courierStatus}</span>
                            )}
                          </div>
                          <p className="text-xs opacity-60">{order.courier || "Delivery Partner"}</p>
                        </div>
                      </div>
                      {order.courier === 'Pathao' ? (
                        <a href={`https://parcel.pathao.com/public-tracking?consignment_id=${order.trackingCode}`} target="_blank" className="btn btn-sm btn-outline">
                          Track <ExternalLink size={14} />
                        </a>
                      ) : (
                        <button className="btn btn-sm btn-disabled">Track</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <div className="card-body p-0">
                <div className="p-6 border-b border-base-200 bg-base-200/30 flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2">
                    <Package size={18} className="text-primary" /> Items ({order.items.length})
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
                    } catch (e) { }

                    return (
                      <div key={item.id} className="p-6 flex gap-4 sm:gap-6 items-center hover:bg-base-200/20 transition-colors">
                        <Link href={`/product/${item.product?.slug}`} className="shrink-0">
                          <div className="w-20 h-20 bg-base-200 rounded-2xl overflow-hidden border border-base-200 relative group">
                            <Image src={imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/product/${item.product?.slug}`} className="font-bold text-base hover:text-primary transition-colors line-clamp-2">
                            {item.name}
                          </Link>
                          <p className="text-xs text-base-content/50 mt-1">{item.product?.category?.name || "Product"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm sm:text-base">{formatPrice(Number(item.price) * item.quantity)}</p>
                          <p className="text-xs opacity-60 mt-1">{item.quantity} x {formatPrice(Number(item.price))}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Totals */}
                <div className="bg-base-200/30 p-6 space-y-3 text-sm border-t border-base-200">
                  <div className="flex justify-between">
                    <span className="opacity-70">Subtotal</span>
                    <span className="font-bold">{formatPrice(Number(order.subTotal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Shipping</span>
                    <span className="font-bold">{formatPrice(Number(order.shippingCost))}</span>
                  </div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount</span>
                      <span className="font-bold">-{formatPrice(Number(order.discount))}</span>
                    </div>
                  )}
                  <div className="divider my-2"></div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-black text-primary">{formatPrice(Number(order.totalAmount))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Info */}
          <div className="space-y-6">

            {/* Payment Status Card */}
            <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-base-200 bg-base-200/30">
                <h3 className="font-bold flex items-center gap-2">
                  <Wallet size={18} className="text-primary" /> Payment Info
                </h3>
              </div>
              <div className="card-body p-6 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase opacity-50 mb-1">Status</p>
                  <span className={`badge font-bold py-3 ${order.paymentStatus === 'PAID' ? 'badge-success text-white' : 'badge-warning text-warning-content'}`}>
                    {order.paymentStatus === 'PAID' ? <CheckCircle2 size={14} className="mr-1" /> : <Clock size={14} className="mr-1" />}
                    {order.paymentStatus}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase opacity-50 mb-1">Method</p>
                  <div className="flex items-center gap-2 font-bold">
                    {order.paymentMethod === 'ESEWA' && <span className="w-2 h-2 rounded-full bg-[#60bb46]"></span>}
                    {order.paymentMethod === 'KHALTI' && <span className="w-2 h-2 rounded-full bg-[#5c2d91]"></span>}
                    {order.paymentMethod === 'COD' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                    {order.paymentMethod}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-base-200 bg-base-200/30">
                <h3 className="font-bold flex items-center gap-2">
                  <MapPin size={18} className="text-primary" /> Delivery Address
                </h3>
              </div>
              <div className="card-body p-6 text-sm">
                <p className="font-bold text-base mb-1">{shippingAddress.fullName}</p>
                <p className="opacity-70 leading-relaxed mb-3">
                  {shippingAddress.street}, {shippingAddress.ward && `Ward ${shippingAddress.ward}, `}
                  <br />
                  {shippingAddress.city}, {shippingAddress.district}
                  <br />
                  {shippingAddress.province}
                </p>
                <div className="flex items-center gap-2 opacity-70">
                  <Phone size={14} /> {shippingAddress.phone}
                </div>
                {shippingAddress.email && (
                  <div className="flex items-center gap-2 opacity-70 mt-1">
                    <Mail size={14} /> {shippingAddress.email}
                  </div>
                )}
              </div>
            </div>

            {/* Help Card */}
            <div className="card bg-base-200/50 border border-base-200 border-dashed text-center">
              <div className="card-body p-6">
                <p className="text-sm font-bold opacity-60">Need help with this order?</p>
                <Link href="/contact" className="link link-primary text-sm font-bold no-underline hover:underline">
                  Contact Support
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}