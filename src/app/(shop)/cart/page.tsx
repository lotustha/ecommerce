"use client"

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { Trash2, Minus, Plus, ArrowRight, ArrowLeft, ShoppingBag, Tag, Truck, FileText, XCircle, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const [mounted, setMounted] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const router = useRouter();

    const items = useCartStore((state) => state.items);
    const removeItem = useCartStore((state) => state.removeItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const clearCart = useCartStore((state) => state.clearCart);
    const setCheckoutIds = useCartStore((state) => state.setCheckoutIds); // ✅ Get action

    // Helper to generate unique key for items
    const getItemKey = (productId: string, variantId: string | null | undefined) =>
        `${productId}-${variantId ?? 'base'}`;

    useEffect(() => {
        setMounted(true);
        // Select all items by default when cart loads
        const allItemKeys = new Set(items.map(item => getItemKey(item.productId, item.variantId)));
        setSelectedItems(allItemKeys);
    }, [items.length]);

    // -- SELECTION LOGIC --
    const toggleItem = (key: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedItems(newSelected);
    };

    const toggleAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set()); // Deselect all
        } else {
            const allItemKeys = new Set(items.map(item => getItemKey(item.productId, item.variantId)));
            setSelectedItems(allItemKeys); // Select all
        }
    };

    const isAllSelected = items.length > 0 && selectedItems.size === items.length;

    // -- CALCULATIONS BASED ON SELECTION --
    const selectedCartItems = items.filter(item =>
        selectedItems.has(getItemKey(item.productId, item.variantId))
    );

    const subTotal = selectedCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingEstimate = selectedCartItems.length > 0 ? 150 : 0;
    const total = subTotal + shippingEstimate;

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR',
            maximumFractionDigits: 0,
        }).format(p);
    };

    const handleRemove = (productId: string, variantId: string | null) => {
        removeItem(productId, variantId);
        toast.success("Item removed");

        // Also remove from selection state
        const key = getItemKey(productId, variantId);
        if (selectedItems.has(key)) {
            const newSelected = new Set(selectedItems);
            newSelected.delete(key);
            setSelectedItems(newSelected);
        }
    };

    // ✅ Handle Checkout Logic
    const handleCheckout = () => {
        if (selectedCartItems.length === 0) return;

        // Convert Set to Array and save to store
        setCheckoutIds(Array.from(selectedItems));

        // Navigate to checkout
        router.push("/checkout");
    };

    if (!mounted) return null;

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <ShoppingBag size={40} className="opacity-30" />
                </div>
                <h1 className="text-3xl font-black mb-2">Your Cart is Empty</h1>
                <p className="text-base-content/60 mb-8 max-w-md">
                    Looks like you haven't added anything yet. Explore our categories to find something you love.
                </p>
                <Link href="/search" className="btn btn-primary btn-lg rounded-full px-8 shadow-lg hover:scale-105 transition-transform">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 md:px-8">
            <h1 className="text-4xl font-black mb-10 flex items-center gap-3 tracking-tight">
                Shopping Cart
                <span className="text-xl font-medium text-base-content/40 bg-base-200 px-3 py-1 rounded-full">
                    {items.length} items
                </span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* --- LEFT: Cart Items List (Span 8) --- */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Select All Header */}
                    <div className="flex items-center justify-between bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer label p-0 gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary rounded-lg"
                                    checked={isAllSelected}
                                    onChange={toggleAll}
                                />
                                <span className="font-bold text-sm">Select All ({items.length} items)</span>
                            </label>
                        </div>
                        <button
                            onClick={clearCart}
                            className="btn btn-ghost text-error btn-xs hover:bg-error/10 gap-1"
                        >
                            <Trash2 size={14} /> Remove All
                        </button>
                    </div>

                    <div className="bg-base-100 rounded-3xl shadow-sm border border-base-200 overflow-hidden">
                        {items.map((item, index) => {
                            const itemKey = getItemKey(item.productId, item.variantId);
                            const isSelected = selectedItems.has(itemKey);

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    key={itemKey}
                                    className={`flex gap-4 p-4 sm:p-6 ${index !== items.length - 1 ? 'border-b border-base-200' : ''} group relative transition-colors ${!isSelected ? 'bg-base-200/30 opacity-80' : ''}`}
                                >
                                    {/* Checkbox */}
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary rounded-lg"
                                            checked={isSelected}
                                            onChange={() => toggleItem(itemKey)}
                                        />
                                    </div>

                                    {/* Image - Reduced Size */}
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-base-200 rounded-2xl overflow-hidden flex-shrink-0 border border-base-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.image || "/placeholder.jpg"}
                                            alt={item.name}
                                            className={`w-full h-full object-cover transition-all ${!isSelected ? 'grayscale opacity-70' : ''}`}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-base sm:text-lg leading-tight truncate pr-2">
                                                    <Link href={`/product/${item.productId}`} className="hover:text-primary transition-colors">
                                                        {item.name}
                                                    </Link>
                                                </h3>
                                                <p className="text-xs sm:text-sm text-base-content/50 mt-1 font-medium bg-base-200 inline-block px-2 py-0.5 rounded-lg">
                                                    {item.categoryName}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.productId, item.variantId ?? null)}
                                                className="btn btn-circle btn-ghost btn-sm text-base-content/30 hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
                                                title="Remove item"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-3">
                                            {/* Quantity Pill */}
                                            <div className={`flex items-center bg-base-200 rounded-full h-9 px-1 border border-base-200 w-fit ${!isSelected ? 'opacity-50 pointer-events-none' : ''}`}>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.variantId ?? null, item.quantity - 1)}
                                                    className="w-8 h-full flex items-center justify-center hover:bg-base-300 rounded-full transition-colors disabled:opacity-30"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center font-bold tabular-nums text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.variantId ?? null, item.quantity + 1)}
                                                    className="w-8 h-full flex items-center justify-center hover:bg-base-300 rounded-full transition-colors disabled:opacity-30"
                                                    disabled={item.quantity >= item.stock}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            {/* Price */}
                                            <div className="text-left sm:text-right">
                                                <div className={`font-black text-lg ${isSelected ? 'text-primary' : 'text-base-content/50'}`}>
                                                    {formatPrice(item.price * item.quantity)}
                                                </div>
                                                {item.quantity > 1 && (
                                                    <div className="text-[10px] text-base-content/50 font-medium">{formatPrice(item.price)} each</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* --- RIGHT: Order Summary (Span 4) --- */}
                <div className="lg:col-span-4 lg:sticky lg:top-24">
                    <div className="bg-base-100 border border-base-200 rounded-[2rem] p-8 shadow-xl relative overflow-hidden transition-all">
                        {/* Decorative background gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                            Summary
                            <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {selectedCartItems.length} selected
                            </span>
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-base-content/70">
                                <span className="flex items-center gap-2 text-sm"><ShoppingBag size={16} /> Subtotal</span>
                                <span className="font-bold text-base-content">{formatPrice(subTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base-content/70">
                                <span className="flex items-center gap-2 text-sm"><Truck size={16} /> Shipping Estimate</span>
                                <span className="font-bold text-base-content">
                                    {selectedCartItems.length > 0 ? formatPrice(shippingEstimate) : 'Rs. 0'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-base-content/70">
                                <span className="flex items-center gap-2 text-sm"><FileText size={16} /> Tax</span>
                                <span className="font-bold text-base-content text-xs bg-base-200 px-2 py-1 rounded">Calculated later</span>
                            </div>
                        </div>

                        <div className="divider my-2"></div>

                        <div className="flex justify-between items-end mb-8">
                            <span className="font-bold text-lg flex items-center gap-2">Total</span>
                            <div className="text-right">
                                <span className="font-black text-3xl text-primary block">{formatPrice(total)}</span>
                                <span className="text-xs text-base-content/40">Includes all taxes</span>
                            </div>
                        </div>

                        {/* Coupon Code Input */}
                        <div className="form-control mb-8">
                            <label className="label pl-1">
                                <span className="label-text font-bold text-xs uppercase tracking-wider opacity-50 flex items-center gap-1">Promo Code</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter code"
                                    className="input input-bordered w-full rounded-xl focus:outline-none focus:border-primary pl-10 bg-base-200/50 focus:bg-base-100 transition-colors"
                                />
                                <Tag size={16} className="absolute left-3.5 top-3.5 text-base-content/30" />
                                <button className="absolute right-1.5 top-1.5 btn btn-sm btn-neutral rounded-lg">Apply</button>
                            </div>
                        </div>

                        {/* ✅ UPDATED CHECKOUT BUTTON */}
                        <button
                            onClick={handleCheckout}
                            disabled={selectedCartItems.length === 0}
                            className={`btn btn-primary btn-block rounded-xl h-14 text-lg shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform flex items-center justify-between px-6 ${selectedCartItems.length === 0 ? 'btn-disabled opacity-50 shadow-none' : ''}`}
                        >
                            <span>Checkout ({selectedCartItems.length})</span>
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <ArrowRight size={20} />
                            </div>
                        </button>

                        <div className="mt-6 text-center">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-base-content/50 hover:text-primary transition-colors group">
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* Security badge below summary */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-base-content/40">
                        <CreditCard size={14} />
                        <span>Secure Checkout Guaranteed</span>
                    </div>
                </div>

            </div>
        </div>
    );
}