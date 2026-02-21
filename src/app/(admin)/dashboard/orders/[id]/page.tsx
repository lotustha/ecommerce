import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  Calendar,
  Mail,
  Phone,
  Truck,
  Wallet,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import DeliveryAssignment from "../_components/delivery-assignment";
import PaymentStatusSelect from "../_components/payment-status-select";
import PrintInvoiceButton from "../_components/print-invoice-button";
import { getAvailableRiders } from "@/actions/delivery-actions";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Fetch the order
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      user: { select: { name: true, email: true } },
      rider: { select: { name: true } },
    },
  });

  if (!order) notFound();

  // 2. Fetch settings
  const settings = await prisma.systemSetting.findUnique({
    where: { id: "default" },
  });

  // 3. Fetch riders
  const riders = await getAvailableRiders();

  const shipping = JSON.parse(order.shippingAddress as string);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(Number(p));
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

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/orders"
            className="btn btn-sm btn-ghost btn-circle"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              Order #{order.id.slice(-6).toUpperCase()}
              <span
                className={`badge font-bold ${
                  order.status === "DELIVERED"
                    ? "badge-success text-white"
                    : order.status === "CANCELLED"
                      ? "badge-error text-white"
                      : "badge-warning"
                }`}
              >
                {order.status}
              </span>
            </h1>
            <p className="text-sm opacity-60 flex items-center gap-2 mt-1">
              <Calendar size={14} /> Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* ✅ INVOICE BUTTON */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <PrintInvoiceButton
            order={JSON.parse(JSON.stringify(order))}
            settings={JSON.parse(JSON.stringify(settings))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="xl:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-200 bg-base-200/30 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Package size={18} className="text-primary" /> Order Items
              </h3>
              <span className="text-xs font-bold opacity-60">
                {order.items.length} Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="bg-base-100 text-xs uppercase opacity-60">
                    <th className="pl-6">Product</th>
                    <th className="text-right">Price</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right pr-6">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-base-200/30">
                      <td className="pl-6 font-medium">
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="text-right text-sm">
                        {formatPrice(Number(item.price))}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="pr-6 text-right font-bold">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="p-6 bg-base-200/30 border-t border-base-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Subtotal</span>
                <span className="font-medium">
                  {formatPrice(Number(order.subTotal))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Shipping</span>
                <span className="font-medium">
                  {formatPrice(Number(order.shippingCost))}
                </span>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-base-300 mt-2">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(Number(order.totalAmount))}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-base-200 bg-base-200/30 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Wallet size={18} className="text-primary" /> Payment Details
              </h3>
              {order.paymentStatus === "PAID" ? (
                <span className="badge badge-success badge-sm text-white">
                  Verified
                </span>
              ) : (
                <span className="badge badge-warning badge-sm">
                  Pending Verification
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 p-6 flex items-center gap-4 border-b sm:border-b-0 sm:border-r border-base-200">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm font-bold ${
                    order.paymentMethod === "ESEWA"
                      ? "bg-[#60bb46] text-white"
                      : order.paymentMethod === "KHALTI"
                        ? "bg-[#5c2d91] text-white"
                        : "bg-orange-500 text-white"
                  }`}
                >
                  {order.paymentMethod === "COD" ? (
                    <Truck size={24} />
                  ) : (
                    order.paymentMethod[0]
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase opacity-50 mb-1">
                    Method
                  </p>
                  <p className="font-black text-xl">{order.paymentMethod}</p>
                </div>
              </div>

              <div className="flex-1 p-6 flex flex-col justify-center gap-2">
                <p className="text-xs font-bold uppercase opacity-50">
                  Payment Status
                </p>
                <div className="w-full">
                  <PaymentStatusSelect
                    orderId={order.id}
                    currentStatus={order.paymentStatus}
                    currentPaymentMethod={order.paymentMethod}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* 1. LOGISTICS (Top) */}
          <DeliveryAssignment
            order={JSON.parse(JSON.stringify(order))}
            riders={JSON.parse(JSON.stringify(riders))}
          />

          {/* 2. CUSTOMER & ADDRESS */}
          <div className="card bg-base-100 border border-base-200 shadow-sm p-6 space-y-5">
            <h3 className="font-bold flex items-center gap-2 border-b pb-3 border-base-200">
              <ClipboardList size={18} className="text-primary" /> Customer
              Details
            </h3>

            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span>{shipping.fullName?.[0]}</span>
                </div>
              </div>
              <div>
                <p className="font-bold">{shipping.fullName}</p>
                <div className="flex items-center gap-2 text-xs opacity-60">
                  <Mail size={12} /> {shipping.email || order.user?.email}
                </div>
              </div>
            </div>

            <div className="bg-base-200/50 p-4 rounded-xl space-y-3 border border-base-200">
              <h4 className="text-xs font-bold uppercase opacity-50 flex items-center gap-1">
                <MapPin size={12} /> Shipping Address
              </h4>
              <div className="text-sm space-y-1">
                <p className="font-medium text-base-content/80">
                  {shipping.street}
                  {shipping.ward && `, Ward ${shipping.ward}`}
                </p>
                <p className="font-bold text-primary">
                  {shipping.city}, {shipping.district}
                </p>
                <p className="text-xs opacity-60 uppercase tracking-wide">
                  {shipping.province}
                </p>
              </div>

              <div className="divider my-1"></div>

              <div className="flex items-center gap-2 text-sm font-bold">
                <Phone size={14} className="opacity-50" />
                <span className="tracking-wide">{order.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
