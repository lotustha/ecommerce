"use client"

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Package, Calendar, ChevronRight, Clock, CheckCircle2, XCircle, MapPin, ArrowRight } from "lucide-react";

interface OrderListProps {
    orders?: any[]; // Made optional to handle potential undefined
}

// ✅ Fix: Default orders to [] if undefined
export default function OrderList({ orders = [] }: OrderListProps) {
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

    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
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

    // Safe check for length now that we have a default value
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
                {orders.map((order) => (
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                            <div>
                                <p className="text-xs text-base-content/40 font-bold uppercase tracking-wider mb-1">Order #{order.id.slice(-6)}</p>
                                <h3 className="text-2xl font-black text-primary">{formatPrice(order.totalAmount)}</h3>
                                <p className="text-sm text-base-content/60 mt-1 flex items-center gap-2">
                                    <Calendar size={14} /> {formatDate(order.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="bg-base-200/30 rounded-2xl p-4 mb-4">
                            <div className="flex flex-wrap gap-4">
                                {order.items.slice(0, 4).map((item: any, i: number) => {
                                    let imageUrl = "/placeholder.jpg";
                                    try {
                                        if (item.product?.images) {
                                            const imgs = JSON.parse(item.product.images);
                                            if (imgs.length > 0) imageUrl = imgs[0];
                                        }
                                    } catch (e) { }

                                    return (
                                        <div key={item.id} className="relative group/item">
                                            <div className="w-16 h-16 bg-base-100 rounded-xl overflow-hidden border border-base-200 shadow-sm">
                                                <Image src={imageUrl} alt={item.name} fill className="object-cover" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-base-300 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-base-100">
                                                {item.quantity}
                                            </div>

                                            {/* Tooltip on hover */}
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

                        {/* Footer / Address */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 text-sm text-base-content/70 bg-base-200/50 px-3 py-1.5 rounded-lg">
                                <MapPin size={14} className="text-primary" />
                                <span className="truncate max-w-[200px] sm:max-w-xs">{JSON.parse(order.shippingAddress).city}, {JSON.parse(order.shippingAddress).street}</span>
                            </div>

                            <button className="btn btn-ghost btn-sm gap-1 group-hover:text-primary transition-colors">
                                View Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}