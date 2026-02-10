"use client"

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { ShoppingCart, X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { createPortal } from "react-dom";

export default function CartDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const items = useCartStore((state) => state.items);
    const totalItems = useCartStore((state) => state.getTotalItems());
    const subTotal = useCartStore((state) => state.getSubTotal());
    const removeItem = useCartStore((state) => state.removeItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR',
            maximumFractionDigits: 0,
        }).format(p);
    };

    const handleRemove = (productId: string, variantId: string | null) => {
        removeItem(productId, variantId);
        toast.success("Item removed", {
            position: "bottom-center",
            icon: '🗑️',
            style: {
                borderRadius: '20px',
                background: '#333',
                color: '#fff',
                fontSize: '12px'
            },
        });
    };

    if (!mounted) {
        return (
            <button className="btn btn-ghost btn-circle">
                <ShoppingCart className="h-5 w-5" />
            </button>
        );
    }

    const drawerContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999]"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed top-0 right-0 h-screen w-full md:w-[400px] bg-base-100 shadow-2xl z-[10000] flex flex-col"
                    >
                        {/* Minimal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-base-100">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                Your Cart
                                <span className="text-xs font-normal bg-base-200 px-2 py-0.5 rounded-full text-base-content/60">
                                    {totalItems}
                                </span>
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="btn btn-sm btn-circle btn-ghost hover:bg-base-200 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                                    <div className="w-20 h-20 bg-base-200/50 rounded-full flex items-center justify-center mb-2">
                                        <ShoppingBag size={32} className="opacity-40" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Your cart is empty</h3>
                                        <p className="text-sm text-base-content/60 max-w-[200px] mx-auto mt-1">Looks like you haven't added anything yet.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="btn btn-primary btn-sm rounded-full px-6 mt-2"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        key={`${item.productId}-${item.variantId}`}
                                        className="flex gap-4 group"
                                    >
                                        {/* Modern Image Container */}
                                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-base-200 shrink-0 border border-base-200">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.image || "/placeholder.jpg"}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Details Column */}
                                        <div className="flex-1 flex flex-col justify-between py-0.5">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <Link
                                                        href={`/product/${item.productId}`}
                                                        onClick={() => setIsOpen(false)}
                                                        className="font-semibold text-sm hover:text-primary transition-colors line-clamp-2 leading-tight"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    <p className="text-xs text-base-content/40 mt-1 font-medium">{item.categoryName}</p>
                                                </div>
                                                <p className="font-bold text-sm text-right">{formatPrice(item.price * item.quantity)}</p>
                                            </div>

                                            <div className="flex items-end justify-between mt-2">
                                                {/* Pill Quantity Selector */}
                                                <div className="flex items-center bg-base-200 rounded-full h-8 px-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.variantId ?? null, item.quantity - 1)}
                                                        className="w-7 h-full flex items-center justify-center hover:text-primary transition-colors disabled:opacity-30"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.variantId ?? null, item.quantity + 1)}
                                                        className="w-7 h-full flex items-center justify-center hover:text-primary transition-colors disabled:opacity-30"
                                                        disabled={item.quantity >= item.stock}
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>

                                                {/* Remove Icon Button */}
                                                <button
                                                    onClick={() => handleRemove(item.productId, item.variantId ?? null)}
                                                    className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-error hover:bg-base-200"
                                                    title="Remove Item"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 bg-base-100/80 backdrop-blur-xl border-t border-base-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-medium text-base-content/60">Subtotal</span>
                                    <span className="text-xl font-black">{formatPrice(subTotal)}</span>
                                </div>
                                <div className="space-y-3">
                                    <Link
                                        href="/checkout"
                                        onClick={() => setIsOpen(false)}
                                        className="btn btn-primary btn-block rounded-full h-12 text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                                    >
                                        Checkout
                                    </Link>
                                    <Link
                                        href="/cart"
                                        onClick={() => setIsOpen(false)}
                                        className="btn btn-ghost btn-block btn-xs text-base-content/40 font-normal hover:bg-transparent hover:text-base-content"
                                    >
                                        View detailed cart
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn btn-ghost btn-circle group hover:bg-base-200 transition-colors"
                >
                    <ShoppingCart className="h-5 w-5 group-hover:text-primary transition-colors" />
                    <AnimatePresence>
                        {totalItems > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-0 right-0 bg-primary text-primary-content text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-base-100 shadow-sm"
                            >
                                {totalItems}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
            {createPortal(drawerContent, document.body)}
        </>
    );
}