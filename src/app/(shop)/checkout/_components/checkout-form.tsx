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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { placeOrder } from "@/actions/place-order";
import {
  verifyPathaoLocation,
  getPublicCities,
  getPublicZones,
  getPublicAreas,
} from "@/actions/public-delivery";
import { calculateShipping } from "@/actions/delivery-actions";

const NEPAL_LOCATIONS: Record<string, string[]> = {
  Koshi: [
    "Bhojpur",
    "Dhankuta",
    "Ilam",
    "Jhapa",
    "Khotang",
    "Morang",
    "Okhaldhunga",
    "Panchthar",
    "Sankhuwasabha",
    "Solukhumbu",
    "Sunsari",
    "Taplejung",
    "Terhathum",
    "Udayapur",
  ],
  Madhesh: [
    "Bara",
    "Dhanusha",
    "Mahottari",
    "Parsa",
    "Rautahat",
    "Saptari",
    "Sarlahi",
    "Siraha",
  ],
  Bagmati: [
    "Bhaktapur",
    "Chitwan",
    "Dhading",
    "Dolakha",
    "Kathmandu",
    "Kavrepalanchok",
    "Lalitpur",
    "Makwanpur",
    "Nuwakot",
    "Ramechhap",
    "Rasuwa",
    "Sindhuli",
    "Sindhupalchok",
  ],
  Gandaki: [
    "Baglung",
    "Gorkha",
    "Kaski",
    "Lamjung",
    "Manang",
    "Mustang",
    "Myagdi",
    "Nawalpur",
    "Parbat",
    "Syangja",
    "Tanahun",
  ],
  Lumbini: [
    "Arghakhanchi",
    "Banke",
    "Bardiya",
    "Dang",
    "Gulmi",
    "Kapilvastu",
    "Parasi",
    "Palpa",
    "Pyuthan",
    "Rolpa",
    "Rukum East",
    "Rupandehi",
  ],
  Karnali: [
    "Dailekh",
    "Dolpa",
    "Humla",
    "Jajarkot",
    "Jumla",
    "Kalikot",
    "Mugu",
    "Salyan",
    "Surkhet",
    "Rukum West",
  ],
  Sudurpashchim: [
    "Achham",
    "Baitadi",
    "Bajhang",
    "Bajura",
    "Dadeldhura",
    "Darchula",
    "Doti",
    "Kailali",
    "Kanchanpur",
  ],
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
  deliveryPartner: z.enum(["STORE", "PATHAO"]).default("STORE"),
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
  id: "STORE" | "PATHAO";
  name: string;
  description: string;
  price: number;
  time: string;
  recommended?: boolean;
  isTest?: boolean; // ✅ Added field specifically for test mode badges
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

  // ✅ Safe boolean accessors with explicit fail-safe defaults (Default to Test Mode for security)
  const isCodEnabled = settings?.enableCod ?? true;
  const isEsewaEnabled = settings?.enableEsewa ?? false;
  const isKhaltiEnabled = settings?.enableKhalti ?? false;
  const isStoreDeliveryEnabled = settings?.enableStoreDelivery ?? true;
  const isPathaoEnabled = settings?.enablePathao ?? false;

  const isPathaoSandbox = settings?.pathaoSandbox ?? true;
  const isEsewaSandbox = settings?.esewaSandbox ?? true;
  const isKhaltiSandbox = settings?.khaltiSandbox ?? true;

  // Determine initial payment method based on settings priority
  const defaultPayment = isCodEnabled
    ? "COD"
    : isEsewaEnabled
      ? "ESEWA"
      : isKhaltiEnabled
        ? "KHALTI"
        : "";

  // Determine initial delivery partner
  const defaultPartner = isStoreDeliveryEnabled
    ? "STORE"
    : isPathaoEnabled
      ? "PATHAO"
      : "";

  // Determine standard shipping logic
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

  // Base shipping cost with free shipping logic applied
  const standardCost = Number(settings?.shippingCharge ?? 150);
  const freeThreshold = settings?.freeShippingThreshold
    ? Number(settings.freeShippingThreshold)
    : null;
  const isFreeShipping = freeThreshold !== null && subTotal >= freeThreshold;
  const finalStandardCost = isFreeShipping ? 0 : standardCost;

  // Pathao Logistics State
  const [verifyingLoc, setVerifyingLoc] = useState(false);
  const [pathaoStatus, setPathaoStatus] = useState<
    "MATCHED" | "UNMATCHED" | "PENDING"
  >("PENDING");
  const [pathaoCityId, setPathaoCityId] = useState<number | null>(null);
  const [pathaoZoneId, setPathaoZoneId] = useState<number | null>(null);
  const [pathaoAreaId, setPathaoAreaId] = useState<number | null>(null);

  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // ✅ Dynamically build delivery options based on exact state of settings
  useEffect(() => {
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
        price: 0,
        time: "1-2 Days",
        recommended: true,
        isTest: isPathaoSandbox,
      });
    }
    setDeliveryOptions(options);
  }, [
    isStoreDeliveryEnabled,
    isPathaoEnabled,
    finalStandardCost,
    isFreeShipping,
    isPathaoSandbox,
  ]);

  // Manual Selection Lists
  const [pCities, setPCities] = useState<any[]>([]);
  const [pZones, setPZones] = useState<any[]>([]);
  const [pAreas, setPAreas] = useState<any[]>([]);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(p);
  };

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
    reset,
    formState: { errors },
  } = form;
  const selectedPayment = watch("paymentMethod");
  const selectedPartner = watch("deliveryPartner");
  const selectedProvince = useWatch({ control, name: "province" });
  const districtOptions = selectedProvince
    ? NEPAL_LOCATIONS[selectedProvince] || []
    : [];

  const currentOption = deliveryOptions.find((o) => o.id === selectedPartner) ||
    deliveryOptions[0] || { price: 0 };

  // Final calculation
  const total = subTotal + currentOption.price;

  // Tax Calculation (INCLUSIVE Pricing)
  const taxRate = settings?.taxRate ? Number(settings.taxRate) : 0;
  let taxAmount = 0;

  if (taxRate > 0) {
    taxAmount = subTotal - subTotal / (1 + taxRate / 100);
  }

  const watchDistrict = useWatch({ control, name: "district" });
  const watchCity = useWatch({ control, name: "city" });
  const watchStreet = useWatch({ control, name: "street" });

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
        paymentMethod: defaultPayment as any,
        deliveryPartner: defaultPartner as any,
      });
    }
  }, [user, defaultAddress, reset, defaultPayment, defaultPartner]);

  // Auto-Verify Location & Zone Logic (Only if Pathao is enabled)
  useEffect(() => {
    if (isOrderPlaced || !isPathaoEnabled) return;

    const timer = setTimeout(async () => {
      if (watchDistrict && watchCity) {
        setVerifyingLoc(true);
        const res = await verifyPathaoLocation(watchDistrict, watchCity);

        if (res.matched && res.cityId) {
          setPathaoStatus("MATCHED");
          setPathaoCityId(res.cityId);
          const zones = await getPublicZones(res.cityId);
          setPZones(zones);

          const addressString =
            `${watchStreet} ${watchCity} ${watchDistrict}`.toLowerCase();
          const matchZone = zones.find((z: any) =>
            addressString.includes(z.zone_name.toLowerCase()),
          );
          if (matchZone) {
            setPathaoZoneId(matchZone.zone_id);
            const areas = await getPublicAreas(matchZone.zone_id);
            setPAreas(areas);
            const matchArea = areas.find((a: any) =>
              addressString.includes(a.area_name.toLowerCase()),
            );
            if (matchArea) setPathaoAreaId(matchArea.area_id);
          } else {
            setPathaoZoneId(null);
            setPathaoAreaId(null);
          }
        } else {
          setPathaoStatus("UNMATCHED");
          if (pCities.length === 0) {
            const cities = await getPublicCities();
            setPCities(cities);
          }
        }
        setVerifyingLoc(false);
      } else {
        setPathaoStatus("PENDING");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [watchDistrict, watchCity, watchStreet, isOrderPlaced, isPathaoEnabled]);

  useEffect(() => {
    if (isOrderPlaced || !isPathaoEnabled) return;
    if (pathaoZoneId) {
      if (pAreas.length === 0)
        getPublicAreas(pathaoZoneId).then(setPAreas).catch(console.error);
    } else {
      setPAreas([]);
      setPathaoAreaId(null);
    }
  }, [pathaoZoneId, isOrderPlaced, isPathaoEnabled]);

  useEffect(() => {
    if (isOrderPlaced || !isPathaoEnabled) return;

    if (pathaoCityId && pathaoZoneId) {
      setIsCalculatingShipping(true);
      calculateShipping({
        recipient_city: pathaoCityId,
        recipient_zone: pathaoZoneId,
        items: checkoutItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      })
        .then((res) => {
          if (res.success && res.cost) {
            setDeliveryOptions((prev) => {
              const others = prev.filter((o) => o.id !== "PATHAO");
              return [
                ...others,
                {
                  id: "PATHAO",
                  name: "Pathao",
                  description: isPathaoSandbox
                    ? "Test Mode Active"
                    : "Fast Delivery",
                  price: Number(res.cost),
                  time: "1-2 Days",
                  recommended: true,
                  isTest: isPathaoSandbox,
                },
              ];
            });
          }
        })
        .catch(console.error)
        .finally(() => setIsCalculatingShipping(false));
    } else {
      setDeliveryOptions((prev) => {
        const others = prev.filter((o) => o.id !== "PATHAO");
        return [
          ...others,
          {
            id: "PATHAO",
            name: "Pathao",
            description: isPathaoSandbox ? "Test Mode Active" : "Fast Delivery",
            price: 0,
            time: "1-2 Days",
            recommended: true,
            isTest: isPathaoSandbox,
          },
        ];
      });
    }
  }, [
    pathaoCityId,
    pathaoZoneId,
    checkoutItems,
    isOrderPlaced,
    isPathaoEnabled,
    isPathaoSandbox,
  ]);

  const handlePCityChange = async (cid: number) => {
    setPathaoCityId(cid);
    setPathaoZoneId(null);
    const zones = await getPublicZones(cid);
    setPZones(zones);
  };
  const handlePZoneChange = (zid: number) => {
    setPathaoZoneId(zid);
    setPathaoAreaId(null);
    setPAreas([]);
  };

  useEffect(() => {
    setMounted(true);
    if (!isOrderPlaced && items.length > 0 && checkoutIds.length === 0) {
      router.push("/cart");
    }
  }, [items.length, checkoutIds.length, router, isOrderPlaced]);

  const isPathaoInvalid =
    selectedPartner === "PATHAO" &&
    (!pathaoCityId || !pathaoZoneId || (pAreas.length > 0 && !pathaoAreaId));

  const hasNoDeliveryMethods = deliveryOptions.length === 0;
  const hasNoPaymentMethods =
    !isCodEnabled && !isEsewaEnabled && !isKhaltiEnabled;

  const onSubmit = async (data: CheckoutFormValues) => {
    if (hasNoDeliveryMethods || hasNoPaymentMethods) return;
    if (isPathaoInvalid && isPathaoEnabled)
      return toast.error(
        "Please verify or select your specific delivery location for Pathao.",
      );
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
      shippingCost: currentOption?.price || 0,
    };

    const result = await placeOrder(orderData);

    if (result.error) {
      toast.error(result.error);
      setIsProcessing(false);
      return;
    }

    if (result.success && result.orderId) {
      setIsOrderPlaced(true);
      if (data.paymentMethod === "COD")
        toast.success("Order placed successfully! 🎉");
      else toast.success("Order initiated! Redirecting to payment...");

      if ((result as any).isNewAccount)
        toast.success("Account created! Check email for login.", {
          duration: 6000,
        });

      checkoutItems.forEach((item) =>
        removeItem(item.productId, item.variantId),
      );
      setCheckoutIds([]);

      if (data.paymentMethod === "COD") router.push("/orders");
      else router.push(`/payment/${result.orderId}?auto=true`);
    }
  };

  if (!mounted) return null;
  if (isOrderPlaced) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold">Processing Order...</h2>
      </div>
    );
  }
  if (checkoutItems.length === 0 && !isProcessing) return null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
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

          {/* --- LOCATION CHECK UI (Pathao) --- */}
          {isPathaoEnabled && watchCity && watchDistrict && (
            <div className="mt-4 flex items-center justify-between bg-base-200/50 p-3 rounded-lg border border-base-200">
              <div className="flex items-center gap-2 text-sm">
                {verifyingLoc ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : (
                  <MapPin
                    size={16}
                    className={
                      pathaoStatus === "MATCHED"
                        ? "text-success"
                        : "text-warning"
                    }
                  />
                )}
                {verifyingLoc ? (
                  <span className="opacity-60">Checking coverage...</span>
                ) : pathaoStatus === "MATCHED" ? (
                  <span className="text-success font-medium">
                    Standard Delivery Available
                  </span>
                ) : (
                  <span className="text-warning font-medium">
                    Exact location not matched automatically
                  </span>
                )}
              </div>
            </div>
          )}

          {/* --- MANUAL FALLBACK SELECTORS --- */}
          {isPathaoEnabled &&
            (pathaoStatus === "UNMATCHED" ||
              (pathaoStatus === "MATCHED" && !pathaoAreaId)) &&
            selectedPartner === "PATHAO" && (
              <div className="mt-4 p-4 bg-warning/5 rounded-xl border border-warning/20 space-y-3">
                {pathaoStatus === "UNMATCHED" ? (
                  <p className="text-xs text-warning font-bold flex gap-2">
                    <AlertTriangle size={14} /> Please select closest location
                    for accurate delivery:
                  </p>
                ) : (
                  <p className="text-xs text-info font-bold flex gap-2">
                    <MapPin size={14} /> Please select your specific Area/Tole:
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pathaoStatus !== "MATCHED" && (
                    <>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={pathaoCityId || ""}
                        onChange={(e) =>
                          handlePCityChange(Number(e.target.value))
                        }
                      >
                        <option value="">Select City...</option>
                        {pCities.map((c: any) => (
                          <option key={c.city_id} value={c.city_id}>
                            {c.city_name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={pathaoZoneId || ""}
                        onChange={(e) =>
                          handlePZoneChange(Number(e.target.value))
                        }
                        disabled={!pathaoCityId}
                      >
                        <option value="">Select Zone...</option>
                        {pZones.map((z: any) => (
                          <option key={z.zone_id} value={z.zone_id}>
                            {z.zone_name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <select
                      className="select select-bordered select-sm w-full"
                      value={pathaoAreaId || ""}
                      onChange={(e) => setPathaoAreaId(Number(e.target.value))}
                      disabled={!pathaoZoneId}
                    >
                      <option value="">Select Area *</option>
                      {pAreas.map((a: any) => (
                        <option key={a.area_id} value={a.area_id}>
                          {a.area_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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
                        {/* ✅ Bright Test Mode Indicator for Delivery */}
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
                    ) : (
                      <p className="font-bold text-lg">
                        {formatPrice(option.price)}
                      </p>
                    )}
                    {isCalculatingShipping && option.id === "PATHAO" && (
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
                      {/* ✅ Bright Test Mode Indicator for eSewa */}
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
                      {/* ✅ Bright Test Mode Indicator for Khalti */}
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
              <span className="font-bold">
                {formatPrice(currentOption?.price || 0)}
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

            <div className="flex justify-between text-lg font-black mt-4">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              isProcessing ||
              (selectedPartner === "PATHAO" && isPathaoInvalid) ||
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
  );
}
