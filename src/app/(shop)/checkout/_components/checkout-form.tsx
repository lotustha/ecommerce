"use client";

import { useCartStore } from "@/store/cart-store";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MapPin,
  User,
  Truck,
  CheckCircle2,
  Wallet,
  AlertTriangle,
  Loader2,
  Clock,
  Zap,
  FileText,
  RefreshCcw
} from "lucide-react";
import { toast } from "react-hot-toast";
import { placeOrder } from "@/actions/place-order";
import {
  verifyPathaoLocation,
  getPublicCities,
  getPublicZones,
  getPublicAreas,
  getPublicNcmBranches,
} from "@/actions/public-delivery";
import { calculateShipping } from "@/actions/delivery-actions";
import { verifyCoupon } from "@/actions/coupon-actions";

const NEPAL_LOCATIONS: Record<string, string[]> = {
  Koshi: ["Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"],
  Madhesh: ["Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi", "Siraha"],
  Bagmati: ["Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"],
  Gandaki: ["Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahun"],
  Lumbini: ["Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu", "Parasi", "Palpa", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"],
  Karnali: ["Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu", "Salyan", "Surkhet", "Rukum West"],
  Sudurpashchim: ["Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"],
};

const CheckoutSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().min(1, "Municipality/City is required"),
  ward: z.coerce.number().min(1, "Ward No. is required"),
  street: z.string().min(1, "Street/Tole is required"),
  paymentMethod: z.enum(["COD", "ESEWA", "KHALTI"]),
  deliveryPartner: z.enum(["STORE", "PATHAO", "NCM"]).default("STORE"),
});

type CheckoutFormValues = z.infer<typeof CheckoutSchema>;

interface CheckoutFormProps {
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  defaultAddress?: any;
  settings?: any;
}

interface DeliveryOption {
  id: "STORE" | "PATHAO" | "NCM";
  name: string;
  description: string;
  price: number;
  time: string;
  recommended?: boolean;
  isTest?: boolean;
}

export default function CheckoutForm({
  user,
  defaultAddress,
  settings,
}: CheckoutFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  // Safe boolean accessors
  const isCodEnabled = settings?.enableCod ?? true;
  const isEsewaEnabled = settings?.enableEsewa ?? false;
  const isKhaltiEnabled = settings?.enableKhalti ?? false;

  const isStoreDeliveryEnabled = settings?.enableStoreDelivery ?? true;
  const isPathaoEnabled = settings?.enablePathao ?? false;
  const isNcmEnabled = settings?.enableNcm ?? false;

  const isPathaoSandbox = settings?.pathaoSandbox ?? true;
  const isNcmSandbox = settings?.ncmSandbox ?? true;
  const isEsewaSandbox = settings?.esewaSandbox ?? true;
  const isKhaltiSandbox = settings?.khaltiSandbox ?? true;

  const defaultPayment = isCodEnabled ? "COD" : isEsewaEnabled ? "ESEWA" : isKhaltiEnabled ? "KHALTI" : "";
  const defaultPartner = isStoreDeliveryEnabled ? "STORE" : isPathaoEnabled ? "PATHAO" : isNcmEnabled ? "NCM" : "";

  // 1. Initialize Form BEFORE extracting watches to prevent 'used before declaration' errors
  const form = useForm<CheckoutFormValues>({
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
      paymentMethod: defaultPayment as any,
      deliveryPartner: defaultPartner as any,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = form;

  // 2. Extract Watch Variables early
  const selectedPayment = watch("paymentMethod");
  const selectedPartner = watch("deliveryPartner");
  const selectedProvince = useWatch({ control, name: "province" });
  const watchDistrict = useWatch({ control, name: "district" });
  const watchCity = useWatch({ control, name: "city" });
  const watchStreet = useWatch({ control, name: "street" });

  const districtOptions = selectedProvince ? NEPAL_LOCATIONS[selectedProvince] || [] : [];

  const items = useCartStore((state) => state.items);
  const checkoutIds = useCartStore((state) => state.checkoutIds);
  const removeItem = useCartStore((state) => state.removeItem);
  const setCheckoutIds = useCartStore((state) => state.setCheckoutIds);

  const checkoutItems = useMemo(
    () =>
      items.filter((item) =>
        checkoutIds.includes(`${item.productId}-${item.variantId ?? "base"}`),
      ),
    [items, checkoutIds],
  );

  const subTotal = checkoutItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const standardCost = Number(settings?.shippingCharge ?? 150);
  const freeThreshold = Number(settings?.freeShippingThreshold || 0);
  const isFreeShipping = freeThreshold > 0 && subTotal >= freeThreshold;
  const finalStandardCost = isFreeShipping ? 0 : standardCost;

  // Pathao Logistics State
  const [isPathaoLoading, setIsPathaoLoading] = useState(false);
  const [pathaoStatus, setPathaoStatus] = useState<"MATCHED" | "UNMATCHED" | "PENDING">("PENDING");
  const [pathaoCityId, setPathaoCityId] = useState<number | null>(null);
  const [pathaoZoneId, setPathaoZoneId] = useState<number | null>(null);
  const [pathaoAreaId, setPathaoAreaId] = useState<number | null>(null);
  const [isZoneAligned, setIsZoneAligned] = useState(false);
  const [isAreaAligned, setIsAreaAligned] = useState(false);

  // NCM Logistics State
  const [ncmBranches, setNcmBranches] = useState<any[]>([]);
  const [ncmBranch, setNcmBranch] = useState<string>("");
  const [isLoadingNcm, setIsLoadingNcm] = useState(false);

  const [pathaoCalculatedCost, setPathaoCalculatedCost] = useState<number | null>(null);
  const [ncmCalculatedCost, setNcmCalculatedCost] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const deliveryOptions: DeliveryOption[] = useMemo(() => {
    const options: DeliveryOption[] = [];

    if (isStoreDeliveryEnabled) {
      options.push({
        id: "STORE",
        name: "Standard Delivery",
        description: isFreeShipping ? "Free Delivery!" : "Store Courier",
        price: finalStandardCost,
        time: "3-5 Days",
      });
    }

    if (isPathaoEnabled) {
      options.push({
        id: "PATHAO",
        name: "Pathao",
        description: isPathaoSandbox ? "Test Mode Active" : "Fast Delivery",
        price: pathaoCalculatedCost ?? 0,
        time: "1-2 Days",
        recommended: true,
        isTest: isPathaoSandbox,
      });
    }

    if (isNcmEnabled) {
      options.push({
        id: "NCM",
        name: "Nepal Can Move",
        description: isNcmSandbox ? "Test Mode Active" : "Nationwide Delivery",
        price: ncmCalculatedCost ?? 0,
        time: "2-4 Days",
        isTest: isNcmSandbox,
      });
    }

    return options;
  }, [isStoreDeliveryEnabled, isPathaoEnabled, isNcmEnabled, finalStandardCost, isFreeShipping, isPathaoSandbox, isNcmSandbox, pathaoCalculatedCost, ncmCalculatedCost]);

  // Manual Selection Lists
  const [pCities, setPCities] = useState<any[]>([]);
  const [pZones, setPZones] = useState<any[]>([]);
  const [pAreas, setPAreas] = useState<any[]>([]);

  const handlePCityChange = async (cityId: number) => {
    setPathaoCityId(cityId);
    setPathaoZoneId(null);
    setPathaoAreaId(null);
    setIsZoneAligned(false);
    setIsAreaAligned(false);
    setPZones([]);
    setPAreas([]);
    if (cityId) {
      const zones = await getPublicZones(cityId);
      setPZones(zones || []);
    }
  };

  const handlePZoneChange = async (zoneId: number) => {
    setPathaoZoneId(zoneId);
    setPathaoAreaId(null);
    setIsAreaAligned(false);
    setPAreas([]);
    if (zoneId) {
      const areas = await getPublicAreas(zoneId);
      setPAreas(areas || []);
    }
  };

  // ✅ Smart Auto-Match for BOTH Zone and Area based on Street and City (Pathao)
  useEffect(() => {
    if (!isPathaoEnabled || !watchStreet) return;

    const streetLower = watchStreet.toLowerCase();
    const cityLower = (watchCity || "").toLowerCase();
    const districtLower = (watchDistrict || "").toLowerCase();
    const combined = `${districtLower} ${cityLower} ${streetLower}`;

    let zoneChangedLocal = false;

    // 1. Try to auto-match the Zone
    if (pZones.length > 0) {
      const matchedZone = pZones.find((z: any) => {
        const zName = z.zone_name.toLowerCase();
        return combined.includes(zName) || zName.includes(streetLower) || streetLower.includes(zName);
      });

      if (matchedZone) {
        if (pathaoZoneId !== matchedZone.zone_id) {
          setPathaoZoneId(matchedZone.zone_id);
          getPublicAreas(matchedZone.zone_id).then(res => setPAreas(res || []));
          setPathaoAreaId(null);
          zoneChangedLocal = true;
          toast.success(`Matched Zone: ${matchedZone.zone_name}`, {
            id: 'auto-zone',
            position: "bottom-center"
          });
        }
        setIsZoneAligned(true);
      } else {
        setIsZoneAligned(false);
      }
    }

    // 2. Try to auto-match the Area 
    if (!zoneChangedLocal && pAreas.length > 0) {
      const matchedArea = pAreas.find((a: any) => {
        const aName = a.area_name.toLowerCase();
        return combined.includes(aName) || aName.includes(streetLower) || streetLower.includes(aName);
      });

      if (matchedArea) {
        if (pathaoAreaId !== matchedArea.area_id) {
          setPathaoAreaId(matchedArea.area_id);
          toast.success(`Matched Area: ${matchedArea.area_name}`, {
            id: 'auto-area',
            position: "bottom-center"
          });
        }
        setIsAreaAligned(true);
      } else {
        setIsAreaAligned(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchStreet, watchCity, watchDistrict, pZones.length, pAreas.length, isPathaoEnabled]);

  // --- ✅ ROBUST NCM LOADER ---
  const loadNcmBranches = async () => {
    setIsLoadingNcm(true);
    try {
      const data = await getPublicNcmBranches();
      let branches: any[] = [];

      // Extremely defensive parsing for NCM API structures
      if (Array.isArray(data)) {
        branches = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        branches = data.data;
      } else if (data && typeof data === 'object') {
        branches = Object.values(data);
      }

      setNcmBranches(Array.isArray(branches) ? branches : []);

      if (!branches || branches.length === 0) {
        toast.error("NCM branches could not be loaded. Please try again or contact support.", { id: "ncm-empty" });
      }
    } catch (e) {
      console.error("NCM Fetch Error:", e);
      toast.error("Failed to connect to NCM.", { id: "ncm-err" });
    } finally {
      setIsLoadingNcm(false);
    }
  };

  useEffect(() => {
    if (isPathaoEnabled) {
      getPublicCities().then(res => setPCities(res || []));
    }
  }, [isPathaoEnabled]);

  // ✅ Auto-load NCM branches when switching to NCM tab
  useEffect(() => {
    if (isNcmEnabled && selectedPartner === "NCM" && ncmBranches.length === 0) {
      loadNcmBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNcmEnabled, selectedPartner, ncmBranches.length]);

  // ✅ Location Verifier (Pathao API City Search)
  useEffect(() => {
    if (!isPathaoEnabled || !watchDistrict || !watchCity) return;
    const verify = async () => {
      setIsPathaoLoading(true);
      const res = await verifyPathaoLocation(watchDistrict, watchCity);
      if (res.matched && res.cityId) {
        setPathaoStatus("MATCHED");
        if (pathaoCityId !== res.cityId) {
          setPathaoCityId(res.cityId);
          const zones = await getPublicZones(res.cityId);
          setPZones(zones || []);
          setPathaoZoneId(null);
          setPathaoAreaId(null);
          setPAreas([]);
        }
      } else {
        setPathaoStatus("UNMATCHED");
        if (pathaoCityId !== null) {
          setPathaoCityId(null);
          setPathaoZoneId(null);
          setPathaoAreaId(null);
          setIsZoneAligned(false);
          setIsAreaAligned(false);
        }
      }
      setIsPathaoLoading(false);
    };
    const timer = setTimeout(verify, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchDistrict, watchCity, isPathaoEnabled]);

  useEffect(() => {
    if (selectedPartner === "PATHAO" && pathaoCityId && pathaoZoneId) {
      setIsCalculatingShipping(true);
      calculateShipping({
        provider: "PATHAO",
        recipient_city: pathaoCityId,
        recipient_zone: pathaoZoneId,
        items: checkoutItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
      }).then(res => {
        if (res.success) {
          setPathaoCalculatedCost(res.cost || 0);
        }
        setIsCalculatingShipping(false);
      });
    } else if (selectedPartner === "NCM" && ncmBranch) {
      setIsCalculatingShipping(true);
      calculateShipping({
        provider: "NCM",
        ncm_destination: ncmBranch,
        items: checkoutItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
      }).then(res => {
        if (res.success) {
          setNcmCalculatedCost(res.cost || 0);
        }
        setIsCalculatingShipping(false);
      });
    } else {
      setPathaoCalculatedCost(null);
      setNcmCalculatedCost(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartner, pathaoCityId, pathaoZoneId, ncmBranch, checkoutItems]);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(p);
  };

  const currentOption = deliveryOptions.find((o) => o.id === selectedPartner) || deliveryOptions[0] || { price: 0 };

  const total = subTotal + currentOption.price;

  const taxRate = settings?.taxRate ? Number(settings.taxRate) : 0;
  let taxAmount = 0;
  if (taxRate > 0) {
    taxAmount = subTotal - subTotal / (1 + taxRate / 100);
  }

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discountAmount: number } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    setIsApplyingCoupon(true);
    const res = await verifyCoupon(couponInput, subTotal);
    if (res.error) {
      toast.error(res.error);
      setAppliedCoupon(null);
    } else if (res.success && res.discountAmount && res.code) {
      toast.success("Coupon applied successfully! 🎉");
      setAppliedCoupon({ code: res.code, discountAmount: res.discountAmount });
    }
    setIsApplyingCoupon(false);
  };

  useEffect(() => {
    setMounted(true);
    if (!isOrderPlaced && items.length > 0 && checkoutIds.length === 0) {
      router.push("/cart");
    }
  }, [items.length, checkoutIds.length, router, isOrderPlaced]);

  const isPathaoInvalid = selectedPartner === "PATHAO" && (!pathaoCityId || !pathaoZoneId || (pAreas.length > 0 && !pathaoAreaId));
  const isNcmInvalid = selectedPartner === "NCM" && !ncmBranch;
  const hasNoDeliveryMethods = deliveryOptions.length === 0;
  const hasNoPaymentMethods = !isCodEnabled && !isEsewaEnabled && !isKhaltiEnabled;

  const discountTotal = appliedCoupon?.discountAmount || 0;
  const finalCalculatedTotal = Math.max(0, subTotal + currentOption.price - discountTotal);

  const onSubmit = async (data: CheckoutFormValues) => {
    if (hasNoDeliveryMethods || hasNoPaymentMethods) return;
    if (isPathaoInvalid && isPathaoEnabled) return toast.error("Please verify or select your specific delivery location for Pathao.");
    if (isNcmInvalid && isNcmEnabled) return toast.error("Please select a destination branch for NCM.");

    setIsProcessing(true);

    const orderData = {
      ...data,
      items: checkoutItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      pathaoCityId: pathaoCityId || null,
      pathaoZoneId: pathaoZoneId || null,
      pathaoAreaId: pathaoAreaId || null,
      ncmBranch: ncmBranch || null,
      shippingCost: currentOption?.price || 0,
      couponCode: appliedCoupon?.code || null,
    };

    const result = await placeOrder(orderData);

    if (result.error) {
      toast.error(result.error);
      setIsProcessing(false);
      return;
    }

    if (result.success) {
      setIsOrderPlaced(true);

      if (data.paymentMethod === "COD") {
        toast.success("Order placed successfully! 🎉");
      } else {
        toast.success("Order initiated! Redirecting to payment...");
      }

      if ((result as any).isNewAccount) {
        toast.success("Account created! Check email for login.", { duration: 6000 });
      }

      // ✅ FIX: Standard soft navigation instead of window.location, allowing React to transition gracefully.
      if (data.paymentMethod === "COD") {
        router.push("/orders");
      } else if ((result as any).orderId) {
        router.push(`/payment/${(result as any).orderId}?auto=true`);
      } else {
        router.push("/orders");
      }

      // ✅ FIX: Delay the clearance of the Cart store state by 2 seconds.
      // If we clear it immediately, the component instantly re-evaluates its state 
      // and causes a massive UI layout shift behind our loading overlay.
      setTimeout(() => {
        checkoutItems.forEach((item) => removeItem(item.productId, item.variantId));
        setCheckoutIds([]);
      }, 2000);

    } else {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  if (checkoutItems.length === 0 && !isProcessing && !isOrderPlaced) return null;

  return (
    <div className="w-full">
      {/* ✅ Beautiful Full-Screen Modal Overlay 
        This is better than an absolute overlay because it completely blocks 
        the user from clicking the navbar or footer while the redirect happens.
      */}
      {isOrderPlaced && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-base-200/80 backdrop-blur-md px-4">
          <div className="bg-base-100 p-10 rounded-[2rem] shadow-2xl border border-base-200 flex flex-col items-center text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
            <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
            <h2 className="text-2xl font-black mb-2 animate-pulse">Securing your order...</h2>
            <p className="text-base-content/60 font-medium">Please do not close this window or click back.</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`grid grid-cols-1 lg:grid-cols-12 gap-10 items-start ${isOrderPlaced ? 'opacity-50 pointer-events-none blur-sm transition-all duration-500' : ''}`}
      >
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-base-100 rounded-4xl border border-base-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <span className="bg-primary/10 text-primary w-8 h-8 flex items-center justify-center rounded-full text-sm">
                1
              </span>
              Contact & Delivery
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label text-xs font-bold text-base-content/60 uppercase">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3.5 top-3.5 text-base-content/40"
                    />
                    <input
                      {...register("fullName")}
                      type="text"
                      className={`input input-bordered w-full pl-10 rounded-xl ${errors.fullName ? "input-error" : ""}`}
                    />
                  </div>
                  {errors.fullName && (
                    <span className="text-error text-xs mt-1">
                      {errors.fullName.message}
                    </span>
                  )}
                </div>
                <div className="form-control">
                  <label className="label text-xs font-bold text-base-content/60 uppercase">
                    Mobile Number
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    className="input input-bordered w-full rounded-xl"
                  />
                  {errors.phone && (
                    <span className="text-error text-xs mt-1">
                      {errors.phone.message}
                    </span>
                  )}
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label text-xs font-bold text-base-content/60 uppercase">
                    Email Address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className="input input-bordered w-full rounded-xl"
                    readOnly={!!user?.email}
                  />
                  {errors.email && (
                    <span className="text-error text-xs mt-1">
                      {errors.email.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="divider text-xs text-base-content/30 font-medium">
                SHIPPING ADDRESS
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label text-xs font-bold text-base-content/60 uppercase">
                    Province
                  </label>
                  <select
                    {...register("province")}
                    className={`select select-bordered w-full rounded-xl ${errors.province ? "select-error" : ""}`}
                    onChange={(e) => {
                      register("province").onChange(e);
                      setValue("district", "");
                    }}
                  >
                    <option value="">Select Province</option>
                    {Object.keys(NEPAL_LOCATIONS).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.province && (
                    <span className="text-error text-xs mt-1">
                      {errors.province.message}
                    </span>
                  )}
                </div>
                <div className="form-control">
                  <label className="label text-xs font-bold text-base-content/60 uppercase">
                    District
                  </label>
                  <select
                    {...register("district")}
                    className={`select select-bordered w-full rounded-xl ${errors.district ? "select-error" : ""}`}
                    disabled={!selectedProvince}
                  >
                    <option value="">Select District</option>
                    {districtOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <span className="text-error text-xs mt-1">
                      {errors.district.message}
                    </span>
                  )}
                </div>
                <div className="form-control">
                  <label className="label text-xs font-bold text-base-content/60 uppercase">
                    Municipality / City
                  </label>
                  <input
                    {...register("city")}
                    type="text"
                    className="input input-bordered w-full rounded-xl"
                  />
                  {errors.city && (
                    <span className="text-error text-xs mt-1">
                      {errors.city.message}
                    </span>
                  )}
                </div>
                <div className="form-control">
                  <label className="label text-xs font-bold text-base-content/60 uppercase">
                    Ward No
                  </label>
                  <input
                    {...register("ward")}
                    type="number"
                    className="input input-bordered w-full rounded-xl"
                  />
                  {errors.ward && (
                    <span className="text-error text-xs mt-1">
                      {errors.ward.message}
                    </span>
                  )}
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label text-xs font-bold text-base-content/60 uppercase">
                    Street / Tole
                  </label>
                  <input
                    {...register("street")}
                    type="text"
                    className="input input-bordered w-full rounded-xl"
                  />
                  {errors.street && (
                    <span className="text-error text-xs mt-1">
                      {errors.street.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* --- PATHAO ROUTING SELECTORS --- */}
            {isPathaoEnabled && selectedPartner === "PATHAO" && (
              <div className="mt-4 p-5 bg-base-200/50 rounded-xl border border-base-200 space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-base-300 pb-2">
                  <p className="text-xs font-bold flex gap-2 uppercase tracking-wider opacity-70">
                    <MapPin size={14} /> Pathao Routing Details
                  </p>
                  {isPathaoLoading && <span className="text-[10px] font-bold text-primary flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Checking</span>}
                </div>

                {/* Only show selectors if they are NOT aligned */}
                {(pathaoStatus !== "MATCHED" || !isZoneAligned || !isAreaAligned) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pathaoStatus !== "MATCHED" && (
                      <div className="form-control">
                        <select
                          className="select select-bordered select-sm w-full font-medium"
                          value={pathaoCityId || ""}
                          onChange={(e) => handlePCityChange(Number(e.target.value))}
                        >
                          <option value="">Select City *</option>
                          {pCities.map((c: any) => (
                            <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(!isZoneAligned || pathaoStatus !== "MATCHED") && (
                      <div className="form-control">
                        <select
                          className="select select-bordered select-sm w-full font-medium"
                          value={pathaoZoneId || ""}
                          onChange={(e) => handlePZoneChange(Number(e.target.value))}
                          disabled={!pathaoCityId}
                        >
                          <option value="">Select Zone *</option>
                          {pZones.map((z: any) => (
                            <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(!isAreaAligned || pathaoStatus !== "MATCHED") && (
                      <div className="form-control md:col-span-2">
                        <select
                          className="select select-bordered select-sm w-full font-medium"
                          value={pathaoAreaId || ""}
                          onChange={(e) => setPathaoAreaId(Number(e.target.value))}
                          disabled={!pathaoZoneId}
                        >
                          <option value="">Select Area *</option>
                          {pAreas.map((a: any) => (
                            <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {pathaoCityId && pathaoZoneId && pathaoAreaId ? (
                  <p className="text-xs text-success font-bold flex items-center gap-1 mt-2">
                    <CheckCircle2 size={14} /> Routing automatically configured for delivery.
                  </p>
                ) : (
                  <p className="text-[10px] opacity-60 text-warning flex items-center gap-1 mt-2">
                    <AlertTriangle size={12} /> Please ensure all routing options are selected.
                  </p>
                )}
              </div>
            )}

            {/* --- NCM BRANCH SELECTOR --- */}
            {isNcmEnabled && selectedPartner === "NCM" && (
              <div className="mt-4 p-5 bg-base-200/50 rounded-xl border border-base-200 space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center border-b border-base-300 pb-2">
                  <p className="text-xs font-bold flex gap-2 uppercase tracking-wider opacity-70">
                    <Truck size={14} /> NCM Delivery Routing
                  </p>
                  <button
                    type="button"
                    onClick={loadNcmBranches}
                    disabled={isLoadingNcm}
                    className="text-[10px] text-info flex items-center gap-1 hover:underline disabled:opacity-50 font-bold"
                  >
                    <RefreshCcw size={10} className={isLoadingNcm ? "animate-spin" : ""} /> Refresh List
                  </button>
                </div>

                <select
                  className="select select-bordered select-sm w-full font-medium"
                  value={ncmBranch}
                  onChange={(e) => setNcmBranch(e.target.value)}
                  disabled={isLoadingNcm}
                >
                  <option value="">{isLoadingNcm ? "Loading branches..." : "Select Destination Branch *"}</option>
                  {ncmBranches.map((b: any, idx: number) => {
                    const val = b.branch_name || b.name || b.id || `Branch ${idx}`;
                    return <option key={idx} value={val}>{val}</option>;
                  })}
                </select>

                {ncmBranch ? (
                  <p className="text-xs text-success font-bold flex items-center gap-1 mt-2">
                    <CheckCircle2 size={12} /> Branch selected.
                  </p>
                ) : (
                  <p className="text-[10px] opacity-60 text-warning flex items-center gap-1 mt-2">
                    <AlertTriangle size={12} /> Please select the NCM branch closest to your location.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* 2. Delivery Method */}
          <section className="bg-base-100 rounded-4xl border border-base-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <span className="bg-primary/10 text-primary w-8 h-8 flex items-center justify-center rounded-full text-sm">
                2
              </span>
              Delivery Method
            </h2>

            {hasNoDeliveryMethods ? (
              <div className="alert alert-warning text-sm rounded-xl">
                <AlertTriangle size={18} />
                <span>
                  No delivery options are currently available. Please contact
                  support.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {deliveryOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setValue("deliveryPartner", option.id as any)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all hover:border-primary/50 flex items-center justify-between group ${selectedPartner === option.id ? "border-primary bg-primary/5" : "border-base-200"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedPartner === option.id ? "bg-primary text-white" : "bg-base-200 text-base-content/40"}`}
                      >
                        <Truck size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base flex items-center gap-2">
                          {option.name}
                          {option.recommended && (
                            <span className="badge badge-sm badge-accent text-white gap-1">
                              <Zap size={10} /> Recommended
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 text-xs opacity-60 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {option.time}
                          </span>
                          <span>•</span>
                          {/* Bright Test Mode Indicator for Delivery */}
                          <span
                            className={
                              option.isTest
                                ? "text-warning font-bold flex items-center gap-1"
                                : ""
                            }
                          >
                            {option.isTest && <AlertTriangle size={12} />}
                            {option.description}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {option.id === "PATHAO" && option.price === 0 ? (
                        <span className="text-xs text-warning font-bold flex items-center gap-1">
                          <AlertTriangle size={10} /> Check Location
                        </span>
                      ) : option.id === "NCM" && option.price === 0 ? (
                        <span className="text-xs text-warning font-bold flex items-center gap-1">
                          <AlertTriangle size={10} /> Select Branch
                        </span>
                      ) : (
                        <p className={`font-bold text-lg ${option.price === 0 ? 'text-success' : ''}`}>
                          {option.price === 0 ? "Free" : formatPrice(option.price)}
                        </p>
                      )}
                      {isCalculatingShipping && (option.id === "PATHAO" || option.id === "NCM") && (
                        <p className="text-[10px] opacity-60 flex items-center justify-end gap-1">
                          <Loader2 size={10} className="animate-spin" />{" "}
                          Calculating...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Payment Method */}
          <section className="bg-base-100 rounded-4xl border border-base-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <span className="bg-primary/10 text-primary w-8 h-8 flex items-center justify-center rounded-full text-sm">
                3
              </span>
              Payment Method
            </h2>

            {hasNoPaymentMethods ? (
              <div className="alert alert-warning text-sm rounded-xl">
                <AlertTriangle size={18} />
                <span>
                  No payment methods are currently available. Please contact
                  support.
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {isCodEnabled && (
                    <div
                      onClick={() => setValue("paymentMethod", "COD")}
                      className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${selectedPayment === "COD" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-base-200 hover:border-base-300"}`}
                    >
                      <Truck
                        size={32}
                        className={
                          selectedPayment === "COD"
                            ? "text-primary"
                            : "text-base-content/40"
                        }
                      />
                      <span className="font-bold text-sm">COD</span>
                    </div>
                  )}
                  {isEsewaEnabled && (
                    <div
                      onClick={() => setValue("paymentMethod", "ESEWA")}
                      className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${selectedPayment === "ESEWA" ? "border-success bg-success/5 ring-1 ring-success" : "border-base-200 hover:border-base-300"}`}
                    >
                      <Wallet size={32} className="text-success" />
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">eSewa</span>
                        {isEsewaSandbox && (
                          <span className="badge badge-warning text-warning-content badge-xs py-2 mt-1.5 gap-1 shadow-sm border-none font-bold uppercase">
                            <AlertTriangle size={10} /> Test
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {isKhaltiEnabled && (
                    <div
                      onClick={() => setValue("paymentMethod", "KHALTI")}
                      className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${selectedPayment === "KHALTI" ? "border-info bg-info/5 ring-1 ring-info" : "border-base-200 hover:border-base-300"}`}
                    >
                      <Wallet size={32} className="text-info" />
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">Khalti</span>
                        {isKhaltiSandbox && (
                          <span className="badge badge-warning text-warning-content badge-xs py-2 mt-1.5 gap-1 shadow-sm border-none font-bold uppercase">
                            <AlertTriangle size={10} /> Test
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors.paymentMethod && (
                  <span className="text-error text-xs mt-2 block text-center">
                    Please select a valid payment method
                  </span>
                )}
              </>
            )}
          </section>
        </div>

        {/* --- RIGHT COLUMN: Order Summary --- */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-base-100 border border-base-200 rounded-4xl p-6 md:p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {checkoutItems.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-4 items-start"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-base-200 shrink-0 border border-base-200">
                    <Image
                      src={item.image || "/placeholder.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute bottom-0 right-0 bg-base-300 text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                      x{item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold line-clamp-2 leading-tight">
                      {item.name}
                    </p>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      {item.categoryName}
                    </p>
                  </div>
                  <p className="text-sm font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="divider my-2"></div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Subtotal</span>
                <span className="font-bold">{formatPrice(subTotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-base-content/70 flex items-center gap-1">
                  Shipping{" "}
                  {isCalculatingShipping && (
                    <Loader2 size={10} className="animate-spin" />
                  )}
                </span>
                <span className={`font-bold ${(currentOption?.price || 0) === 0 ? 'text-success' : ''}`}>
                  {(currentOption?.price || 0) === 0 ? "Free" : formatPrice(currentOption?.price || 0)}
                </span>
              </div>

              {/* Tax Breakdown UI */}
              {taxRate > 0 && (
                <div className="flex justify-between items-center text-base-content/50 pt-2 border-t border-base-200 border-dashed mt-2">
                  <span className="flex items-center gap-2 text-xs">
                    <FileText size={14} /> Includes {taxRate}% VAT
                  </span>
                  <span className="font-medium text-xs">
                    {formatPrice(taxAmount)}
                  </span>
                </div>
              )}

              {/* ✅ Coupon Code UI */}
              <div className="pt-4 border-t border-base-200 mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo Code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon || isApplyingCoupon}
                    className="input input-sm h-10 input-bordered w-full rounded-xl font-bold uppercase tracking-widest focus:border-primary"
                  />
                  {appliedCoupon ? (
                    <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="btn btn-sm h-10 btn-error text-white rounded-xl">Remove</button>
                  ) : (
                    <button type="button" onClick={handleApplyCoupon} disabled={!couponInput || isApplyingCoupon} className="btn btn-sm h-10 btn-neutral rounded-xl px-5">
                      {isApplyingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                    </button>
                  )}
                </div>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-success mt-3 text-sm font-bold bg-success/10 p-2 rounded-lg border border-success/20">
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} /> Code {appliedCoupon.code}</span>
                  <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-black mt-4 pt-4 border-t border-base-200">
                <span>Total</span>
                <span className="text-primary">{formatPrice(finalCalculatedTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isProcessing ||
                (selectedPartner === "PATHAO" && isPathaoInvalid) ||
                (selectedPartner === "NCM" && isNcmInvalid) ||
                hasNoDeliveryMethods ||
                hasNoPaymentMethods
              }
              className="btn btn-primary btn-block rounded-xl h-14 text-lg shadow-xl shadow-primary/25 disabled:opacity-50 disabled:bg-base-300 disabled:text-base-content/40"
            >
              {isProcessing ? (
                <span className="loading loading-spinner"></span>
              ) : selectedPayment === "COD" ? (
                "Place Order"
              ) : (
                `Pay with ${selectedPayment || "Card"}`
              )}
            </button>
            <p className="text-xs text-center text-base-content/40 mt-4">
              By placing an order, you agree to our Terms.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}