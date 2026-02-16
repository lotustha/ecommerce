"use client"

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Package, Calendar, Clock, CheckCircle2, XCircle, MapPin, ArrowRight, CreditCard, Wallet } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface OrderListProps {
    orders?: any[];
}

export default function OrderList({ orders = [] }: OrderListProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // ✅ Handle URL Status Params (Success/Failure Toasts)
    useEffect(() => {
        const status = searchParams.get("status");
        if (status === "success") {
            toast.success("Payment successful! Order confirmed.", { duration: 5000 });
            // Clean URL
            router.replace("/orders");
        } else if (status === "failed") {
            toast.error("Payment failed. Please try again.", { duration: 5000 });
            router.replace("/orders");
        } else if (status === "error") {
            toast.error("An error occurred during payment verification.", { duration: 5000 });
            router.replace("/orders");
        }
    }, [searchParams, router]);

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR',
            maximumFractionDigits: 0,
        }).format(p);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const parseAddress = (jsonString: string) => {
        try {
            const address = JSON.parse(jsonString);
            return `${address.city}, ${address.street}`;
        } catch (e) {
            return "Address unavailable";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "text-warning bg-warning/10";
            case "PROCESSING": return "text-info bg-info/10";
            case "DELIVERED": return "text-success bg-success/10";
            case "CANCELLED": return "text-error bg-error/10";
            default: return "text-base-content/50 bg-base-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "DELIVERED": return <CheckCircle2 size={14} />;
            case "CANCELLED": return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const container = {
        hidden: { opacity: 1 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariant: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-base-200/50 rounded-full flex items-center justify-center mb-6"
                >
                    <Package size={48} className="opacity-20" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">No orders found</h2>
                <p className="text-base-content/60 mb-8 max-w-xs mx-auto">Looks like you haven't started your shopping journey yet.</p>
                <Link href="/search" className="btn btn-primary rounded-full px-8 shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <header className="mb-10 flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Your Orders</h1>
                    <p className="text-base-content/60">Check the status of recent orders</p>
                </div>
                <span className="text-sm font-medium bg-base-200 px-3 py-1 rounded-full">{orders.length} Total</span>
            </header>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                {orders.map((order) => {
                    // Check if Pay Now option should be available
                    // (If UNPAID or FAILED, and method is NOT COD)
                    const showPayNow = (order.paymentStatus === "UNPAID" || order.paymentStatus === "FAILED") &&
                        (order.paymentMethod === "ESEWA" || order.paymentMethod === "KHALTI");

                    return (
                        <motion.div
                            key={order.id}
                            variants={itemVariant}
                            className="group bg-base-100 border border-base-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Status Badge (Top Right) */}
                            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {order.status}
                            </div>

                            {/* Order Info */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 pr-32">
                                <div>
                                    <p className="text-xs text-base-content/40 font-bold uppercase tracking-wider mb-1">Order #{order.id.slice(-6).toUpperCase()}</p>
                                    <h3 className="text-2xl font-black text-primary">{formatPrice(order.totalAmount)}</h3>
                                    <div className="flex gap-3 mt-1">
                                        <p className="text-sm text-base-content/60 flex items-center gap-1">
                                            <Calendar size={14} /> {formatDate(order.createdAt)}
                                        </p>
                                        <p className={`text-sm flex items-center gap-1 font-bold ${order.paymentStatus === 'PAID' ? 'text-success' : 'text-warning'}`}>
                                            <Wallet size={14} /> {order.paymentStatus}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Items Grid */}
                            <div className="bg-base-200/30 rounded-2xl p-4 mb-4">
                                <div className="flex flex-wrap gap-4">
                                    {order.items.slice(0, 4).map((item: any) => {
                                        let imageUrl = "/placeholder.jpg";
                                        try {
                                            if (item.product?.images) {
                                                const imgs = typeof item.product.images === 'string'
                                                    ? JSON.parse(item.product.images)
                                                    : item.product.images;
                                                if (Array.isArray(imgs) && imgs.length > 0) imageUrl = imgs[0];
                                            }
                                        } catch (e) { }

                                        return (
                                            <div key={item.id} className="relative group/item">
                                                <div className="w-16 h-16 bg-base-100 rounded-xl overflow-hidden border border-base-200 shadow-sm">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-base-300 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-base-100">
                                                    {item.quantity}
                                                </div>

                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral text-neutral-content text-xs px-2 py-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                    {item.name}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {order.items.length > 4 && (
                                        <div className="w-16 h-16 bg-base-200 rounded-xl flex items-center justify-center text-xs font-bold text-base-content/50 border border-base-300 border-dashed">
                                            +{order.items.length - 4}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer / Address / Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-4">
                                <div className="flex items-center gap-2 text-sm text-base-content/70 bg-base-200/50 px-3 py-1.5 rounded-lg">
                                    <MapPin size={14} className="text-primary" />
                                    <span className="truncate max-w-[200px] sm:max-w-xs">
                                        {parseAddress(order.shippingAddress)}
                                    </span>
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    {/* ✅ PAY NOW BUTTON (If applicable) */}
                                    {showPayNow && (
                                        <Link href={`/payment/${order.id}`} className="btn btn-sm btn-error shadow-sm text-white flex-1 sm:flex-none">
                                            <CreditCard size={14} /> Pay Now
                                        </Link>
                                    )}

                                    <button className="btn btn-ghost btn-sm gap-1 group-hover:text-primary transition-colors flex-1 sm:flex-none">
                                        Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}