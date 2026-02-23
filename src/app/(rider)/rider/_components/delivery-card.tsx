"use client"

import { useState, useTransition } from "react";
import { MapPin, Phone, Banknote, CheckCircle2, Navigation, Package, Loader2 } from "lucide-react";
import { markAsDelivered } from "@/actions/rider-actions";
import { toast } from "react-hot-toast";

interface DeliveryCardProps {
    order: any;
}

export default function DeliveryCard({ order }: DeliveryCardProps) {
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

    let shipping: any = {};
    try {
        shipping = JSON.parse(order.shippingAddress as string);
    } catch (e) { }

    const isCOD = order.paymentMethod === "COD" && order.paymentStatus !== "PAID";
    const amountToCollect = isCOD ? Number(order.totalAmount) : 0;

    const handleComplete = () => {
        // We use standard browser confirm for quick mobile interactions
        if (!confirm(`Confirm delivery to ${shipping.fullName}? \n\n${amountToCollect > 0 ? `DID YOU COLLECT RS. ${amountToCollect}?` : 'Package is PRE-PAID.'}`)) return;

        startTransition(async () => {
            const res = await markAsDelivered(order.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(res.success ?? "Order marked as delivered", { icon: '🎉' });
            }
        });
    };

    const mapQuery = encodeURIComponent(`${shipping.street}, ${shipping.city}, ${shipping.district}`);

    return (
        <div className="bg-base-100 rounded-3xl shadow-sm border border-base-200 overflow-hidden transition-all">

            {/* Top Section: Quick Info */}
            <div className="p-5 border-b border-base-200">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1 block">Order #{order.id.slice(-6).toUpperCase()}</span>
                        <h3 className="font-black text-lg leading-tight text-base-content">{shipping.fullName}</h3>
                        <p className="text-sm font-medium opacity-70 mt-0.5">{shipping.phone}</p>
                    </div>

                    {/* Huge Call Button for Drivers */}
                    <a
                        href={`tel:${shipping.phone}`}
                        className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
                    >
                        <Phone fill="currentColor" size={20} />
                    </a>
                </div>

                <div className="flex items-start gap-3 bg-base-200/50 p-3 rounded-2xl">
                    <MapPin className="text-primary mt-0.5 shrink-0" size={18} />
                    <p className="text-sm font-medium leading-snug pr-2">
                        {shipping.street} {shipping.ward ? `(W-${shipping.ward})` : ''}
                        <br />
                        <span className="opacity-70">{shipping.city}, {shipping.district}</span>
                    </p>
                </div>
            </div>

            {/* Middle Section: Financials & Details Toggle */}
            <div className="p-5 bg-base-50 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-1">
                        <Banknote size={12} /> Cash to Collect
                    </span>
                    {amountToCollect > 0 ? (
                        <span className="text-2xl font-black text-error">Rs. {amountToCollect.toLocaleString()}</span>
                    ) : (
                        <span className="text-xl font-black text-success uppercase">Pre-Paid</span>
                    )}
                </div>

                <button onClick={() => setIsOpen(!isOpen)} className="btn btn-sm btn-ghost text-xs">
                    {isOpen ? 'Hide Items' : `View Items (${order.items.length})`}
                </button>
            </div>

            {/* Expanded Items List */}
            {isOpen && (
                <div className="px-5 pb-5 pt-2 border-t border-base-200 bg-base-200/20">
                    <ul className="space-y-2">
                        {order.items.map((item: any) => (
                            <li key={item.id} className="flex gap-3 items-center text-sm">
                                <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                                    <Package size={14} className="opacity-50" />
                                </div>
                                <span className="flex-1 font-medium truncate">{item.name}</span>
                                <span className="font-bold opacity-70">x{item.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 flex gap-3 bg-base-100">
                <a
                    href={`https://maps.google.com/?q=${mapQuery}`}
                    target="_blank"
                    className="btn flex-1 bg-base-200 hover:bg-base-300 border-none text-base-content rounded-2xl h-14"
                >
                    <Navigation size={18} /> Map
                </a>

                <button
                    onClick={handleComplete}
                    disabled={isPending}
                    className="btn flex-[2] btn-primary rounded-2xl h-14 text-white shadow-xl shadow-primary/20 font-black text-base"
                >
                    {isPending ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20} /> Mark Delivered</>}
                </button>
            </div>
        </div>
    );
}