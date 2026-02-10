"use client"

import { useCartStore } from "@/store/cart-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, MapPin, Phone, User, Truck, CreditCard, CheckCircle2, Wallet } from "lucide-react";
import { toast } from "react-hot-toast";
import { placeOrder } from "@/actions/place-order"; // ✅ Import Action

// --- VALIDATION SCHEMA ---
const CheckoutSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    province: z.string().min(1, "Province is required"),
    city: z.string().min(1, "City is required"),
    street: z.string().min(1, "Street address is required"),
    paymentMethod: z.enum(["COD", "ESEWA", "KHALTI"], {
        message: "Please select a payment method",
    }),
});

type CheckoutFormValues = z.infer<typeof CheckoutSchema>;

export default function CheckoutPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Store Data
    const items = useCartStore((state) => state.items);
    const checkoutIds = useCartStore((state) => state.checkoutIds);
    const removeItem = useCartStore((state) => state.removeItem); // To clear specific items
    const setCheckoutIds = useCartStore((state) => state.setCheckoutIds);

    // Filter only selected items
    const checkoutItems = items.filter((item) =>
        checkoutIds.includes(`${item.productId}-${item.variantId ?? 'base'}`)
    );

    // Calculations
    const subTotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = 150; // Flat rate for now
    const total = subTotal + shippingCost;

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('en-NP', {
            style: 'currency',
            currency: 'NPR',
            maximumFractionDigits: 0,
        }).format(p);
    };

    // Form Setup
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CheckoutFormValues>({
        resolver: zodResolver(CheckoutSchema),
        defaultValues: {
            paymentMethod: "COD",
        },
    });

    const selectedPayment = watch("paymentMethod");

    useEffect(() => {
        setMounted(true);
        if (items.length > 0 && checkoutIds.length === 0) {
            router.push("/cart");
        }
    }, [items.length, checkoutIds.length, router]);

    const onSubmit = async (data: CheckoutFormValues) => {
        setIsProcessing(true);

        // 1. Prepare data for server action
        const orderData = {
            ...data,
            items: checkoutItems.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity
            }))
        };

        // 2. Call Server Action
        const result = await placeOrder(orderData);

        if (result.error) {
            toast.error(result.error);
            setIsProcessing(false);
            return;
        }

        if (result.success) {
            toast.success("Order placed successfully! 🎉");

            // 3. Clear checkout items from cart
            checkoutItems.forEach(item => {
                removeItem(item.productId, item.variantId);
            });
            setCheckoutIds([]); // Clear selection

            // 4. Redirect to Orders Page
            router.refresh(); // Refresh to update server components
            router.push("/orders");
        }
    };

    if (!mounted) return null;

    if (checkoutItems.length === 0) return null;

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 md:px-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/cart" className="btn btn-circle btn-ghost btn-sm">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black tracking-tight">Checkout</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* --- LEFT COLUMN: Forms (Span 7) --- */}
                <div className="lg:col-span-7 space-y-8">

                    {/* 1. Delivery Address */}
                    <section className="bg-base-100 rounded-[2rem] border border-base-200 p-6 md:p-8 shadow-sm">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <span className="bg-primary/10 text-primary w-8 h-8 flex items-center justify-center rounded-full text-sm">1</span>
                            Delivery Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Full Name</span>
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3.5 top-3.5 text-base-content/40" />
                                    <input
                                        {...register("fullName")}
                                        type="text"
                                        placeholder="Enter your name"
                                        className={`input input-bordered w-full pl-10 rounded-xl ${errors.fullName ? "input-error" : ""}`}
                                    />
                                </div>
                                {errors.fullName && <span className="text-error text-xs mt-1 ml-1">{errors.fullName.message}</span>}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Phone Number</span>
                                </label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3.5 top-3.5 text-base-content/40" />
                                    <input
                                        {...register("phone")}
                                        type="tel"
                                        placeholder="98XXXXXXXX"
                                        className={`input input-bordered w-full pl-10 rounded-xl ${errors.phone ? "input-error" : ""}`}
                                    />
                                </div>
                                {errors.phone && <span className="text-error text-xs mt-1 ml-1">{errors.phone.message}</span>}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Province</span>
                                </label>
                                <select
                                    {...register("province")}
                                    className={`select select-bordered w-full rounded-xl ${errors.province ? "select-error" : ""}`}
                                >
                                    <option value="">Select Province</option>
                                    <option value="Koshi">Koshi</option>
                                    <option value="Madhesh">Madhesh</option>
                                    <option value="Bagmati">Bagmati</option>
                                    <option value="Gandaki">Gandaki</option>
                                    <option value="Lumbini">Lumbini</option>
                                    <option value="Karnali">Karnali</option>
                                    <option value="Sudurpashchim">Sudurpashchim</option>
                                </select>
                                {errors.province && <span className="text-error text-xs mt-1 ml-1">{errors.province.message}</span>}
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">City</span>
                                </label>
                                <input
                                    {...register("city")}
                                    type="text"
                                    placeholder="Kathmandu"
                                    className={`input input-bordered w-full rounded-xl ${errors.city ? "input-error" : ""}`}
                                />
                                {errors.city && <span className="text-error text-xs mt-1 ml-1">{errors.city.message}</span>}
                            </div>

                            <div className="form-control md:col-span-2">
                                <label className="label">
                                    <span className="label-text font-medium">Street Address / Landmark</span>
                                </label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3.5 top-3.5 text-base-content/40" />
                                    <input
                                        {...register("street")}
                                        type="text"
                                        placeholder="Near Durbar Square, House No. 123"
                                        className={`input input-bordered w-full pl-10 rounded-xl ${errors.street ? "input-error" : ""}`}
                                    />
                                </div>
                                {errors.street && <span className="text-error text-xs mt-1 ml-1">{errors.street.message}</span>}
                            </div>
                        </div>
                    </section>

                    {/* 2. Payment Method */}
                    <section className="bg-base-100 rounded-[2rem] border border-base-200 p-6 md:p-8 shadow-sm">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                            <span className="bg-primary/10 text-primary w-8 h-8 flex items-center justify-center rounded-full text-sm">2</span>
                            Payment Method
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* COD */}
                            <div
                                onClick={() => setValue("paymentMethod", "COD")}
                                className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedPayment === "COD" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-base-200 hover:border-base-300"}`}
                            >
                                <Truck size={32} className={selectedPayment === "COD" ? "text-primary" : "text-base-content/40"} />
                                <span className="font-bold text-sm">Cash on Delivery</span>
                                {selectedPayment === "COD" && <div className="badge badge-primary badge-xs">Selected</div>}
                            </div>

                            {/* eSewa */}
                            <div
                                onClick={() => setValue("paymentMethod", "ESEWA")}
                                className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedPayment === "ESEWA" ? "border-success bg-success/5 ring-1 ring-success" : "border-base-200 hover:border-base-300"}`}
                            >
                                <Wallet size={32} className="text-success" />
                                <span className="font-bold text-sm text-success">eSewa</span>
                                {selectedPayment === "ESEWA" && <div className="badge badge-success badge-xs text-white">Selected</div>}
                            </div>

                            {/* Khalti */}
                            <div
                                onClick={() => setValue("paymentMethod", "KHALTI")}
                                className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedPayment === "KHALTI" ? "border-info bg-info/5 ring-1 ring-info" : "border-base-200 hover:border-base-300"}`}
                            >
                                <Wallet size={32} className="text-info" />
                                <span className="font-bold text-sm text-info">Khalti</span>
                                {selectedPayment === "KHALTI" && <div className="badge badge-info badge-xs text-white">Selected</div>}
                            </div>
                        </div>
                        {errors.paymentMethod && <span className="text-error text-xs mt-2 block text-center">{errors.paymentMethod.message}</span>}
                    </section>
                </div>

                {/* --- RIGHT COLUMN: Order Summary (Span 5) --- */}
                <div className="lg:col-span-5 lg:sticky lg:top-24">
                    <div className="bg-base-100 border border-base-200 rounded-[2rem] p-6 md:p-8 shadow-xl">
                        <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                        {/* Item List */}
                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-base-200 pr-2">
                            {checkoutItems.map((item) => (
                                <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 items-start">
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-base-200 shrink-0 border border-base-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill className="object-cover" />
                                        <span className="absolute bottom-0 right-0 bg-base-300 text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">x{item.quantity}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold line-clamp-2 leading-tight">{item.name}</p>
                                        <p className="text-xs text-base-content/50 mt-0.5">{item.categoryName}</p>
                                    </div>
                                    <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="divider my-2"></div>

                        {/* Calculations */}
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-base-content/70">Subtotal</span>
                                <span className="font-bold">{formatPrice(subTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-base-content/70">Shipping</span>
                                <span className="font-bold">{formatPrice(shippingCost)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-black mt-4">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(total)}</span>
                            </div>
                        </div>

                        {/* Place Order Button */}
                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="btn btn-primary btn-block rounded-xl h-14 text-lg shadow-xl shadow-primary/25 hover:scale-[1.02] transition-transform"
                        >
                            {isProcessing ? (
                                <span className="loading loading-spinner"></span>
                            ) : (
                                <>
                                    Place Order <CheckCircle2 size={20} className="ml-2" />
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-base-content/40 mt-4">
                            By placing an order, you agree to our <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link>.
                        </p>
                    </div>
                </div>

            </form>
        </div>
    );
}