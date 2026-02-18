"use client"

import { useCartStore } from "@/store/cart-store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Phone, User, Truck, CreditCard, CheckCircle2, Wallet, Mail, Building } from "lucide-react";
import { toast } from "react-hot-toast";
import { placeOrder } from "@/actions/place-order";

// --- NEPAL LOCATIONS DATA ---
const NEPAL_LOCATIONS: Record<string, string[]> = {
  "Koshi": ["Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"],
  "Madhesh": ["Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi", "Siraha"],
  "Bagmati": ["Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"],
  "Gandaki": ["Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahun"],
  "Lumbini": ["Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu", "Parasi", "Palpa", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"],
  "Karnali": ["Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu", "Salyan", "Surkhet", "Rukum West"],
  "Sudurpashchim": ["Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"],
}

const CheckoutSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().min(1, "Municipality/City is required"),
  ward: z.coerce.number().min(1, "Ward No. is required"),
  street: z.string().min(1, "Street/Tole is required"),
  paymentMethod: z.enum(["COD", "ESEWA", "KHALTI"], {
    error: "Please select a payment method",
  }),
});

type CheckoutFormValues = z.infer<typeof CheckoutSchema>;

interface CheckoutFormProps {
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  defaultAddress?: {
    province: string;
    district: string;
    city: string;
    ward: number | null;
    street: string;
    phone?: string | null;
  } | null;
}

export default function CheckoutForm({ user, defaultAddress }: CheckoutFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const items = useCartStore((state) => state.items);
  const checkoutIds = useCartStore((state) => state.checkoutIds);
  const removeItem = useCartStore((state) => state.removeItem);
  const setCheckoutIds = useCartStore((state) => state.setCheckoutIds);

  const checkoutItems = items.filter((item) =>
    checkoutIds.includes(`${item.productId}-${item.variantId ?? 'base'}`)
  );

  const subTotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCost = 150;
  const total = subTotal + shippingCost;

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(p);
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(CheckoutSchema) as any,
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: defaultAddress?.phone || user?.phone || "",
      province: defaultAddress?.province || "",
      district: defaultAddress?.district || "",
      city: defaultAddress?.city || "",
      ward: defaultAddress?.ward || undefined,
      street: defaultAddress?.street || "",
      paymentMethod: "COD",
    },
  });

  useEffect(() => {
    if (user || defaultAddress) {
      reset({
        fullName: user?.name || "",
        email: user?.email || "",
        phone: defaultAddress?.phone || user?.phone || "",
        province: defaultAddress?.province || "",
        district: defaultAddress?.district || "",
        city: defaultAddress?.city || "",
        ward: defaultAddress?.ward || undefined,
        street: defaultAddress?.street || "",
        paymentMethod: "COD",
      });
    }
  }, [user, defaultAddress, reset]);

  const selectedPayment = watch("paymentMethod");
  const selectedProvince = useWatch({ control, name: "province" });
  const districtOptions = selectedProvince ? NEPAL_LOCATIONS[selectedProvince] || [] : [];

  useEffect(() => {
    setMounted(true);
    if (!isOrderPlaced && items.length > 0 && checkoutIds.length === 0) {
      router.push("/cart");
    }
  }, [items.length, checkoutIds.length, router, isOrderPlaced]);

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsProcessing(true);

    const orderData = {
      ...data,
      items: checkoutItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }))
    };

    const result = await placeOrder(orderData);

    if (result.error) {
      toast.error(result.error);
      setIsProcessing(false);
      return;
    }

    if (result.success && result.orderId) {
      setIsOrderPlaced(true);

      if (data.paymentMethod === "COD") {
        toast.success("Order placed successfully! 🎉");
      } else {
        toast.success("Order initiated! Redirecting to payment...");
      }

      if ((result as any).isNewAccount) {
        toast.success("Account created! Check your email for login details.", { duration: 6000 });
      }

      checkoutItems.forEach(item => {
        removeItem(item.productId, item.variantId);
      });
      setCheckoutIds([]);

      if (data.paymentMethod === "COD") {
        router.replace("/orders");
      } else {
        // ✅ FIX: Added auto=true to bypass redundant selection
        router.replace(`/payment/${result.orderId}?auto=true`);
      }
    }
  };

  if (!mounted) return null;
  if (checkoutItems.length === 0 && !isProcessing && !isOrderPlaced) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <div className="lg:col-span-7 space-y-8">
        <section className="bg-base-100 rounded-[2rem] border border-base-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <span className="bg-primary/10 text-primary w-8 h-8 flex items-center justify-center rounded-full text-sm">1</span>
            Contact & Delivery
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/60 uppercase">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-3.5 text-base-content/40" />
                  <input {...register("fullName")} type="text" className={`input input-bordered w-full pl-10 rounded-xl ${errors.fullName ? "input-error" : ""}`} />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/60 uppercase">Mobile Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-3.5 text-base-content/40" />
                  <input {...register("phone")} type="tel" className={`input input-bordered w-full pl-10 rounded-xl ${errors.phone ? "input-error" : ""}`} />
                </div>
              </div>

              <div className="form-control md:col-span-2">
                <label className="label text-xs font-bold text-base-content/60 uppercase">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-3.5 text-base-content/40" />
                  <input {...register("email")} type="email" className={`input input-bordered w-full pl-10 rounded-xl ${errors.email ? "input-error" : ""}`} readOnly={!!user?.email} />
                </div>
              </div>
            </div>

            <div className="divider text-xs text-base-content/30 font-medium">SHIPPING ADDRESS</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/60 uppercase">Province</label>
                <select {...register("province")} className="select select-bordered w-full rounded-xl" onChange={(e) => { register("province").onChange(e); setValue("district", ""); }}>
                  <option value="">Select Province</option>
                  {Object.keys(NEPAL_LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/60 uppercase">District</label>
                <select {...register("district")} className="select select-bordered w-full rounded-xl" disabled={!selectedProvince}>
                  <option value="">Select District</option>
                  {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/60 uppercase">Municipality / City</label>
                <div className="relative">
                  <Building size={18} className="absolute left-3.5 top-3.5 text-base-content/40" />
                  <input {...register("city")} type="text" className="input input-bordered w-full pl-10 rounded-xl" />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold text-base-content/60 uppercase">Ward No</label>
                <input {...register("ward")} type="number" className="input input-bordered w-full rounded-xl" />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label text-xs font-bold text-base-content/60 uppercase">Street / Tole</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-3.5 text-base-content/40" />
                  <input {...register("street")} type="text" className="input input-bordered w-full pl-10 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-base-100 rounded-[2rem] border border-base-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <span className="bg-primary/10 text-primary w-8 h-8 flex items-center justify-center rounded-full text-sm">2</span>
            Payment Method
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div onClick={() => setValue("paymentMethod", "COD")} className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedPayment === "COD" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-base-200 hover:border-base-300"}`}>
              <Truck size={32} className={selectedPayment === "COD" ? "text-primary" : "text-base-content/40"} />
              <span className="font-bold text-sm">COD</span>
            </div>
            <div onClick={() => setValue("paymentMethod", "ESEWA")} className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedPayment === "ESEWA" ? "border-success bg-success/5 ring-1 ring-success" : "border-base-200 hover:border-base-300"}`}>
              <Wallet size={32} className="text-success" />
              <span className="font-bold text-sm">eSewa</span>
            </div>
            <div onClick={() => setValue("paymentMethod", "KHALTI")} className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${selectedPayment === "KHALTI" ? "border-info bg-info/5 ring-1 ring-info" : "border-base-200 hover:border-base-300"}`}>
              <Wallet size={32} className="text-info" />
              <span className="font-bold text-sm">Khalti</span>
            </div>
          </div>
        </section>
      </div>

      <div className="lg:col-span-5 lg:sticky lg:top-24">
        <div className="bg-base-100 border border-base-200 rounded-[2rem] p-6 md:p-8 shadow-xl">
          <h2 className="text-xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
            {checkoutItems.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 items-start">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-base-200 shrink-0 border border-base-200">
                  <img src={item.image || "/placeholder.jpg"} alt={item.name} className="w-full h-full object-cover" />
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

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm"><span className="text-base-content/70">Subtotal</span><span className="font-bold">{formatPrice(subTotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-base-content/70">Shipping</span><span className="font-bold">{formatPrice(shippingCost)}</span></div>
            <div className="flex justify-between text-lg font-black mt-4"><span>Total</span><span className="text-primary">{formatPrice(total)}</span></div>
          </div>

          <button type="submit" disabled={isProcessing} className="btn btn-primary btn-block rounded-xl h-14 text-lg shadow-xl shadow-primary/25">
            {isProcessing ? <span className="loading loading-spinner"></span> : selectedPayment === "COD" ? "Place Order" : `Pay with ${selectedPayment}`}
          </button>
        </div>
      </div>
    </form>
  );
}