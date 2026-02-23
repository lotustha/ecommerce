import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, CreditCard, MapPin, Package, Phone, Receipt, Ticket, User, Mail } from "lucide-react";
import OrderStatusSelect from "../_components/status-select";
import DeliveryAssignment from "../_components/delivery-assignment";
import OrderPrintActions from "../_components/order-print-actions";
import PaymentStatusSelect from "../_components/payment-status-select"; // ✅ Imported restored component

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [order, settings, riders] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        rider: true,
        items: {
          include: {
            product: { select: { images: true } }
          }
        }
      }
    }),
    prisma.systemSetting.findUnique({ where: { id: "default" } }),
    prisma.user.findMany({ where: { role: "RIDER" }, select: { id: true, name: true } })
  ]);

  if (!order) notFound();

  let shippingAddress: any = {};
  try {
    shippingAddress = typeof order.shippingAddress === "string"
      ? JSON.parse(order.shippingAddress)
      : order.shippingAddress || {};
  } catch (e) { }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(Number(p));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  const discountAmount = Number(order.discount) || 0;
  const couponCode = (order as any).couponCode; // If your schema supports storing the specific code used

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-4 md:p-6 rounded-3xl border border-base-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders" className="btn btn-circle btn-ghost bg-base-200">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs opacity-60 flex items-center gap-1 mt-0.5">
              <Calendar size={12} /> {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <OrderStatusSelect id={order.id} currentStatus={order.status} />
          </div>
          <div className="border-l border-base-300 pl-3">
            <OrderPrintActions order={JSON.parse(JSON.stringify(order))} settings={JSON.parse(JSON.stringify(settings))} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Items, Summary, Logistics */}
        <div className="lg:col-span-2 space-y-6">

          {/* ITEMS CARD */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="card-title text-lg border-b border-base-200 pb-3 mb-4 flex items-center gap-2">
                <Package size={20} className="text-primary" /> Order Items ({order.items.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-base-200/50 text-xs uppercase opacity-60">
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => {
                      let imageUrl = "/placeholder.jpg";
                      try {
                        if (item.product?.images) {
                          const imgs = JSON.parse(item.product.images as string);
                          if (imgs.length > 0) imageUrl = imgs[0];
                        }
                      } catch (e) { }

                      return (
                        <tr key={item.id} className="border-b border-base-200/50 last:border-0 hover:bg-base-200/20 transition-colors">
                          <td>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg border border-base-300 overflow-hidden shrink-0 relative bg-base-200">
                                <Image src={imageUrl} alt={item.name} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-sm line-clamp-2">{item.name}</p>
                                {item.variantId && <p className="text-xs opacity-60 mt-0.5">Variant ID: {item.variantId.slice(-6)}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="text-center font-medium">{item.quantity}</td>
                          <td className="text-right whitespace-nowrap">{formatPrice(Number(item.price))}</td>
                          <td className="text-right font-black text-primary whitespace-nowrap">
                            {formatPrice(Number(item.price) * item.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PRICING SUMMARY */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="card-title text-lg border-b border-base-200 pb-3 mb-4 flex items-center gap-2">
                <Receipt size={20} className="text-primary" /> Payment Summary
              </h2>

              <div className="space-y-3 max-w-sm ml-auto w-full">
                <div className="flex justify-between text-sm">
                  <span className="opacity-70 font-medium">Subtotal</span>
                  <span className="font-bold">{formatPrice(Number(order.subTotal))}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="opacity-70 font-medium">Shipping Cost</span>
                  <span className="font-bold">{Number(order.shippingCost) === 0 ? "Free" : formatPrice(Number(order.shippingCost))}</span>
                </div>

                {/* ✅ DISCOUNT UI IDENTIFIER */}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm bg-success/10 text-success p-2.5 rounded-xl border border-success/20 mt-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <Ticket size={16} /> Discount Applied
                      {couponCode && <span className="badge badge-success text-white badge-xs py-2 uppercase tracking-wider">{couponCode}</span>}
                    </span>
                    <span className="font-black">- {formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="divider my-1 opacity-50"></div>

                <div className="flex justify-between items-center text-lg">
                  <span className="font-black text-base-content/80">Total</span>
                  <span className="font-black text-2xl text-primary">{formatPrice(Number(order.totalAmount))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LOGISTICS CARD */}
          <DeliveryAssignment order={JSON.parse(JSON.stringify(order))} riders={JSON.parse(JSON.stringify(riders))} />

        </div>

        {/* RIGHT COLUMN: Customer & Address */}
        <div className="space-y-6">

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="card-title text-lg border-b border-base-200 pb-3 mb-4 flex items-center gap-2">
                <User size={20} className="text-primary" /> Customer Info
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Name</p>
                    <p className="font-bold text-sm">{shippingAddress.fullName || order.user?.name || "Guest User"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Phone</p>
                    <p className="font-bold text-sm">{shippingAddress.phone || order.phone || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider">Email</p>
                    <p className="font-bold text-sm truncate">{shippingAddress.email || order.user?.email || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="card-title text-lg border-b border-base-200 pb-3 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-primary" /> Shipping Address
              </h2>
              <div className="bg-base-200/50 p-4 rounded-xl space-y-1.5 text-sm">
                <p className="font-bold text-base mb-2">{shippingAddress.fullName}</p>
                <p>{shippingAddress.street}</p>
                {shippingAddress.ward && <p>Ward No: {shippingAddress.ward}</p>}
                <p>{shippingAddress.city}, {shippingAddress.district}</p>
                <p>{shippingAddress.province}</p>
                <div className="mt-4 pt-4 border-t border-base-300">
                  <p className="text-xs opacity-60 font-bold uppercase mb-1">Pathao Mapped IDs</p>
                  <p className="font-mono text-xs">City: {(order as any).pathaoCityId || shippingAddress.logistics?.pathaoCityId || "N/A"}</p>
                  <p className="font-mono text-xs">Zone: {(order as any).pathaoZoneId || shippingAddress.logistics?.pathaoZoneId || "N/A"}</p>
                  <p className="font-mono text-xs">Area: {(order as any).pathaoAreaId || shippingAddress.logistics?.pathaoAreaId || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="card-title text-lg border-b border-base-200 pb-3 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-primary" /> Payment details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider mb-1">Method</p>
                  <span className="badge badge-neutral font-bold">{order.paymentMethod}</span>
                </div>
                {/* ✅ FIX: Replaced static badge with the interactive component */}
                <div>
                  <p className="text-[10px] uppercase font-bold opacity-50 tracking-wider mb-2">Status & Actions</p>
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
      </div>
    </div>
  );
}