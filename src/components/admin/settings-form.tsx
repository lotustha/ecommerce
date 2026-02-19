"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SettingsFormSchema,
  SettingsFormValues,
} from "@/lib/validators/settings-schema";
import { updateSettings } from "@/actions/settings-actions";
import { useState, useTransition, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  Save,
  Store,
  CreditCard,
  ShieldCheck,
  Settings as SettingsIcon,
  Truck,
  Cpu,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  FileText,
  Wallet,
  MapPin,
  Phone,
  Mail,
  Hash,
  Percent,
  Facebook,
  Instagram,
  Globe,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function SettingsForm({ initialData }: { initialData?: any }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("general");

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsFormSchema) as any,
    defaultValues: {
      // Branding
      appName: initialData?.appName || "Nepal E-com",
      storeLogo: initialData?.storeLogo || "",

      // Localization
      currency: initialData?.currency || "NPR",
      taxRate: Number(initialData?.taxRate) || 0,

      // --- LOGISTICS ---
      enableStoreDelivery: initialData?.enableStoreDelivery ?? true,
      shippingCharge: Number(initialData?.shippingCharge) || 150,
      freeShippingThreshold: initialData?.freeShippingThreshold
        ? Number(initialData.freeShippingThreshold)
        : undefined,

      enablePathao: initialData?.enablePathao ?? false,
      pathaoSandbox: initialData?.pathaoSandbox ?? true,
      pathaoClientId: initialData?.pathaoClientId || "",
      pathaoClientSecret: initialData?.pathaoClientSecret || "",
      pathaoUsername: initialData?.pathaoUsername || "",
      pathaoPassword: initialData?.pathaoPassword || "",
      shippingMarkup: Number(initialData?.shippingMarkup) || 0,
      deliveryPartners: initialData?.deliveryPartners || "Pathao, Upaya",

      // Store Info
      storeName: initialData?.storeName || "Nepal E-com",
      storeTaxId: initialData?.storeTaxId || "",
      storeDescription: initialData?.storeDescription || "",
      storeAddress: initialData?.storeAddress || "",
      storePhone: initialData?.storePhone || "",
      storeEmail: initialData?.storeEmail || "",

      // Socials
      socialFacebook: initialData?.socialFacebook || "",
      socialInstagram: initialData?.socialInstagram || "",
      socialTiktok: initialData?.socialTiktok || "",
      socialTwitter: initialData?.socialTwitter || "",

      // --- PAYMENTS ---
      enableCod: initialData?.enableCod ?? true,

      enableEsewa: initialData?.enableEsewa ?? false,
      esewaSandbox: initialData?.esewaSandbox ?? true,
      esewaId: initialData?.esewaId || "",
      esewaSecret: initialData?.esewaSecret || "",

      enableKhalti: initialData?.enableKhalti ?? false,
      khaltiSandbox: initialData?.khaltiSandbox ?? true,
      khaltiSecret: initialData?.khaltiSecret || "",

      sctPayKey: initialData?.sctPayKey || "",
      enableSctPay: initialData?.enableSctPay ?? false,

      // AI & Legal
      aiOpenAiKey: initialData?.aiOpenAiKey || "",
      aiGeminiKey: initialData?.aiGeminiKey || "",
      crawlerApiKey: initialData?.crawlerApiKey || "",
      privacyPolicy: initialData?.privacyPolicy || "",
      termsAndConditions: initialData?.termsAndConditions || "",
    },
  });

  useEffect(() => {
    if (initialData) form.reset(initialData);
  }, [initialData, form]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          form.setValue("storeLogo", result, { shouldDirty: true });
        };
        reader.readAsDataURL(file);
      }
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const onSubmit = (data: SettingsFormValues) => {
    startTransition(async () => {
      const result = await updateSettings(data);
      if (result.error) toast.error(result.error);
      else toast.success(result.success ?? "Settings updated successfully");
    });
  };

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "store", label: "Store Info", icon: Store },
    { id: "shipping", label: "Logistics", icon: Truck },
    { id: "payment", label: "Payments", icon: CreditCard },
    { id: "ai", label: "AI & Automation", icon: Cpu },
    { id: "legal", label: "Legal", icon: ShieldCheck },
  ];

  const currentLogo = form.watch("storeLogo");

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            System Settings
          </h1>
          <p className="text-sm opacity-60">Configure your store globally</p>
        </div>
        <button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isPending}
          className="btn btn-primary rounded-xl shadow-lg"
        >
          {isPending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Save size={18} />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ul className="menu bg-base-100 rounded-box border border-base-200 p-2 gap-1 sticky top-24">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? "active font-bold" : ""}
                >
                  <tab.icon size={18} /> {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <form className="space-y-6">
            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-6 space-y-6">
                  <h2 className="card-title text-sm opacity-60 uppercase border-b pb-2">
                    Application Config
                  </h2>

                  {/* Logo Upload */}
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Store Logo
                    </label>
                    <div className="flex items-start gap-6">
                      <div
                        {...getRootProps()}
                        className={`w-32 h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all overflow-hidden bg-base-200/50 ${
                          isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-base-300 hover:border-primary/50"
                        }`}
                      >
                        <input {...getInputProps()} />
                        {currentLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={currentLogo}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center opacity-40">
                            <ImageIcon size={24} />
                            <span className="text-[10px] mt-1 font-bold">
                              Upload
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm opacity-60 mb-2">
                          Upload your store logo. Used in navbar and invoices.
                        </p>
                        {currentLogo && (
                          <button
                            type="button"
                            onClick={() => form.setValue("storeLogo", "")}
                            className="btn btn-xs btn-ghost text-error"
                          >
                            <Trash2 size={14} /> Remove Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label font-bold text-sm">
                        App Name
                      </label>
                      <input
                        {...form.register("appName")}
                        className="input input-bordered"
                        placeholder="Nepal E-com"
                      />
                      {form.formState.errors.appName && (
                        <span className="text-error text-xs">
                          {form.formState.errors.appName.message}
                        </span>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label font-bold text-sm">
                        Currency Symbol
                      </label>
                      <input
                        {...form.register("currency")}
                        className="input input-bordered"
                        placeholder="NPR, $, etc."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STORE INFO TAB */}
            {activeTab === "store" && (
              <div className="space-y-6">
                {/* 1. Identity & Tax */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-content/5">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Store size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Identity & Tax</h2>
                        <p className="text-xs opacity-60">
                          Legal name and registration details.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Store Name
                        </label>
                        <input
                          {...form.register("storeName")}
                          className="input input-bordered"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Store Tagline
                        </label>
                        <input
                          {...form.register("storeDescription")}
                          className="input input-bordered"
                          placeholder="Best electronics in Nepal"
                        />
                      </div>

                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          VAT / PAN Number
                        </label>
                        <label className="input input-bordered flex items-center gap-2">
                          <Hash size={16} className="opacity-50" />
                          <input
                            {...form.register("storeTaxId")}
                            className="grow"
                            placeholder="e.g. 601234567"
                          />
                        </label>
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Tax Rate (%)
                        </label>
                        <label className="input input-bordered flex items-center gap-2">
                          <Percent size={16} className="opacity-50" />
                          <input
                            type="number"
                            {...form.register("taxRate")}
                            className="grow"
                            step="0.01"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Contact & Location */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-content/5">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">
                          Contact Information
                        </h2>
                        <p className="text-xs opacity-60">
                          Where customers can reach you.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Physical Address
                        </label>
                        <input
                          {...form.register("storeAddress")}
                          className="input input-bordered w-full"
                          placeholder="New Road, Kathmandu"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label font-bold text-sm">
                            Support Phone
                          </label>
                          <label className="input input-bordered flex items-center gap-2">
                            <Phone size={16} className="opacity-50" />
                            <input
                              {...form.register("storePhone")}
                              className="grow"
                            />
                          </label>
                        </div>
                        <div className="form-control">
                          <label className="label font-bold text-sm">
                            Support Email
                          </label>
                          <label className="input input-bordered flex items-center gap-2">
                            <Mail size={16} className="opacity-50" />
                            <input
                              {...form.register("storeEmail")}
                              className="grow"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Social Media */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-content/5">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                        <Globe size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Social Media</h2>
                        <p className="text-xs opacity-60">
                          Connect with your audience.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Facebook
                        </label>
                        <label className="input input-bordered flex items-center gap-2">
                          <Facebook size={16} className="text-blue-600" />
                          <input
                            {...form.register("socialFacebook")}
                            className="grow"
                            placeholder="https://facebook.com/..."
                          />
                        </label>
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Instagram
                        </label>
                        <label className="input input-bordered flex items-center gap-2">
                          <Instagram size={16} className="text-pink-600" />
                          <input
                            {...form.register("socialInstagram")}
                            className="grow"
                            placeholder="https://instagram.com/..."
                          />
                        </label>
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          TikTok
                        </label>
                        <label className="input input-bordered flex items-center gap-2">
                          <span className="font-bold text-xs w-4 text-center">
                            TT
                          </span>
                          <input
                            {...form.register("socialTiktok")}
                            className="grow"
                            placeholder="https://tiktok.com/@..."
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOGISTICS TAB */}
            {activeTab === "shipping" && (
              <div className="space-y-6">
                {/* 1. Internal / Store Delivery */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="card-title text-sm opacity-60 uppercase flex items-center gap-2">
                        <Truck size={16} /> Store Delivery
                      </h2>
                      <input
                        type="checkbox"
                        {...form.register("enableStoreDelivery")}
                        className="toggle toggle-primary toggle-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Standard Shipping Charge
                        </label>
                        <input
                          type="number"
                          {...form.register("shippingCharge")}
                          className="input input-bordered"
                          disabled={!form.watch("enableStoreDelivery")}
                        />
                        <label className="label">
                          <span className="label-text-alt opacity-60">
                            Flat rate for manual delivery
                          </span>
                        </label>
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Free Shipping Threshold
                        </label>
                        <input
                          type="number"
                          {...form.register("freeShippingThreshold")}
                          className="input input-bordered"
                          placeholder="e.g. 5000"
                          disabled={!form.watch("enableStoreDelivery")}
                        />
                        <label className="label">
                          <span className="label-text-alt opacity-60">
                            Free shipping if order &gt; this
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Pathao Integration */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="card-title text-sm opacity-60 uppercase flex items-center gap-2">
                        <Globe size={16} /> Pathao Logistics
                      </h2>
                      <input
                        type="checkbox"
                        {...form.register("enablePathao")}
                        className="toggle toggle-error toggle-sm"
                      />
                    </div>

                    {form.watch("enablePathao") && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              {...form.register("pathaoSandbox")}
                              className="checkbox checkbox-warning checkbox-sm"
                            />
                            <span className="label-text font-bold text-sm">
                              Enable Sandbox Mode (Test)
                            </span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-control">
                            <label className="label font-bold text-sm">
                              Client ID
                            </label>
                            <input
                              type="password"
                              {...form.register("pathaoClientId")}
                              className="input input-bordered font-mono text-sm"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label font-bold text-sm">
                              Client Secret
                            </label>
                            <input
                              type="password"
                              {...form.register("pathaoClientSecret")}
                              className="input input-bordered font-mono text-sm"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label font-bold text-sm">
                              Username / Email
                            </label>
                            <input
                              {...form.register("pathaoUsername")}
                              className="input input-bordered font-mono text-sm"
                            />
                          </div>
                          <div className="form-control">
                            <label className="label font-bold text-sm">
                              Password
                            </label>
                            <input
                              type="password"
                              {...form.register("pathaoPassword")}
                              className="input input-bordered font-mono text-sm"
                            />
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="label font-bold text-sm">
                            Shipping Markup
                          </label>
                          <input
                            type="number"
                            {...form.register("shippingMarkup")}
                            className="input input-bordered"
                          />
                          <label className="label">
                            <span className="label-text-alt opacity-60">
                              Add extra amount to Pathao API rates
                              (Profit/Handling)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === "payment" && (
              <div className="space-y-6">
                {/* 1. COD */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Truck size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold">Cash On Delivery</h3>
                          <p className="text-xs opacity-60">
                            Collect cash upon delivery
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        {...form.register("enableCod")}
                        className="toggle toggle-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. eSewa */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                          <Wallet size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold">eSewa</h3>
                          <p className="text-xs opacity-60">
                            Digital Wallet Payment
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        {...form.register("enableEsewa")}
                        className="toggle toggle-success"
                      />
                    </div>

                    {form.watch("enableEsewa") && (
                      <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              {...form.register("esewaSandbox")}
                              className="checkbox checkbox-warning checkbox-sm"
                            />
                            <span className="label-text font-bold text-sm">
                              Enable Sandbox Mode
                            </span>
                          </label>
                        </div>
                        <div className="form-control">
                          <label className="label font-bold text-sm">
                            Merchant ID (SCD)
                          </label>
                          <input
                            {...form.register("esewaId")}
                            className="input input-bordered font-mono"
                            placeholder="EPAYTEST"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label font-bold text-sm">
                            Secret Key
                          </label>
                          <input
                            type="password"
                            {...form.register("esewaSecret")}
                            className="input input-bordered font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Khalti */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold">Khalti</h3>
                          <p className="text-xs opacity-60">
                            Digital Wallet & Banking
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        {...form.register("enableKhalti")}
                        className="toggle toggle-secondary"
                      />
                    </div>

                    {form.watch("enableKhalti") && (
                      <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="form-control">
                          <label className="label cursor-pointer justify-start gap-4">
                            <input
                              type="checkbox"
                              {...form.register("khaltiSandbox")}
                              className="checkbox checkbox-warning checkbox-sm"
                            />
                            <span className="label-text font-bold text-sm">
                              Enable Sandbox Mode
                            </span>
                          </label>
                        </div>
                        <div className="form-control">
                          <label className="label font-bold text-sm">
                            Live Secret Key
                          </label>
                          <input
                            type="password"
                            {...form.register("khaltiSecret")}
                            className="input input-bordered font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI & AUTOMATION TAB */}
            {activeTab === "ai" && (
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-6 space-y-4">
                  <h2 className="card-title text-sm opacity-60 uppercase border-b pb-2 flex items-center gap-2">
                    <Cpu size={16} /> AI Configuration
                  </h2>
                  <p className="text-xs opacity-60">
                    Configure API keys to enable smart features like product
                    crawling, description generation, and auto-categorization.
                  </p>

                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      {...form.register("aiOpenAiKey")}
                      className="input input-bordered font-mono"
                      placeholder="sk-..."
                    />
                  </div>

                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Google Gemini API Key
                    </label>
                    <input
                      type="password"
                      {...form.register("aiGeminiKey")}
                      className="input input-bordered font-mono"
                      placeholder="AIza..."
                    />
                  </div>

                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Crawler / Proxy Key
                    </label>
                    <input
                      type="password"
                      {...form.register("crawlerApiKey")}
                      className="input input-bordered font-mono"
                      placeholder="Optional"
                    />
                    <label className="label">
                      <span className="label-text-alt opacity-60">
                        Used for scraping product data from external URLs.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* LEGAL TAB */}
            {activeTab === "legal" && (
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-6 space-y-4">
                  <h2 className="card-title text-sm opacity-60 uppercase border-b pb-2">
                    Legal Documents
                  </h2>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Privacy Policy
                    </label>
                    <textarea
                      {...form.register("privacyPolicy")}
                      className="textarea textarea-bordered h-48 font-mono text-xs"
                      placeholder="HTML or Markdown content..."
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Terms & Conditions
                    </label>
                    <textarea
                      {...form.register("termsAndConditions")}
                      className="textarea textarea-bordered h-48 font-mono text-xs"
                      placeholder="HTML or Markdown content..."
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
