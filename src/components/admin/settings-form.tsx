"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SettingsFormSchema,
  SettingsFormValues,
} from "@/lib/validators/settings-schema";
import { updateSettings } from "@/actions/settings-actions";
import { useState, useTransition, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Save, Store, Truck, CreditCard, Sparkles, UploadCloud, Info, Globe, Percent, LayoutTemplate, Mail, Server, Zap, AtSign, Key, Check, User } from "lucide-react"
import { useDropzone } from "react-dropzone"


export default function SettingsForm({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("general");

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsFormSchema) as any,
    defaultValues: {
      // General
      appName: initialData?.appName || "Nepal E-com",
      storeName: initialData?.storeName || "",
      storeSubtitle: initialData?.storeSubtitle || "",
      storeEmail: initialData?.storeEmail || "",
      storePhone: initialData?.storePhone || "",
      storeAddress: initialData?.storeAddress || "",
      storeTaxId: initialData?.storeTaxId || "",
      storeLogo: initialData?.storeLogo || "",
      currency: initialData?.currency || "NPR",
      taxRate: initialData?.taxRate ? Number(initialData.taxRate) : 0,

      // Socials
      socialFacebook: initialData?.socialFacebook || "",
      socialInstagram: initialData?.socialInstagram || "",
      socialTwitter: initialData?.socialTwitter || "",
      socialTiktok: initialData?.socialTiktok || "",

      // Logistics
      shippingCharge: initialData?.shippingCharge
        ? Number(initialData.shippingCharge)
        : 150,
      shippingMarkup: initialData?.shippingMarkup
        ? Number(initialData.shippingMarkup)
        : 0,
      freeShippingThreshold: initialData?.freeShippingThreshold
        ? Number(initialData.freeShippingThreshold)
        : undefined,
      enableStoreDelivery: initialData?.enableStoreDelivery ?? true,

      // Pathao
      enablePathao: initialData?.enablePathao ?? false,
      pathaoSandbox: initialData?.pathaoSandbox ?? true,
      pathaoClientId: initialData?.pathaoClientId || "",
      pathaoClientSecret: initialData?.pathaoClientSecret || "",
      pathaoUsername: initialData?.pathaoUsername || "",
      pathaoPassword: initialData?.pathaoPassword || "",

      // NCM
      enableNcm: initialData?.enableNcm ?? false,
      ncmSandbox: initialData?.ncmSandbox ?? true,
      ncmToken: initialData?.ncmToken || "",
      ncmOriginBranch: initialData?.ncmOriginBranch || "TINKUNE",

      // Payments
      enableCod: initialData?.enableCod ?? true,
      enableEsewa: initialData?.enableEsewa ?? false,
      esewaSandbox: initialData?.esewaSandbox ?? true,
      esewaId: initialData?.esewaId || "",
      esewaSecret: initialData?.esewaSecret || "",
      enableKhalti: initialData?.enableKhalti ?? false,
      khaltiSandbox: initialData?.khaltiSandbox ?? true,
      khaltiSecret: initialData?.khaltiSecret || "",

      // AI Integrations
      aiGeminiKey: initialData?.aiGeminiKey || "",
      aiOpenAiKey: initialData?.aiOpenAiKey || "",
      crawlerApiKey: initialData?.crawlerApiKey || "",

      // CMS
      heroTitle: initialData?.heroTitle || "Spring Collection 2025",
      heroSubtitle: initialData?.heroSubtitle || "Elevate Your Everyday Style",
      heroImage: initialData?.heroImage || "",

      // EMAIL
      mailProvider: initialData?.mailProvider || "SMTP",
      storeEmailFrom: initialData?.storeEmailFrom || "orders@store.com",
      smtpHost: initialData?.smtpHost || "",
      smtpPort: initialData?.smtpPort ? Number(initialData.smtpPort) : 465,
      smtpUser: initialData?.smtpUser || "",
      smtpPassword: initialData?.smtpPassword || "",
      resendApiKey: initialData?.resendApiKey || "",
    },
  });

  // Logo Upload Handler
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () =>
          form.setValue("storeLogo", reader.result as string, {
            shouldDirty: true,
          });
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
    { id: "general", label: "Store Details", icon: Store },
    { id: "storefront", label: "Storefront CMS", icon: LayoutTemplate },
    { id: "logistics", label: "Logistics", icon: Truck },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "email", label: "Email config", icon: Mail },
    { id: "integrations", label: "Integrations", icon: Sparkles }
  ];

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 pb-20 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm sticky top-0 z-20">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Settings</h1>
          <p className="text-sm opacity-60">
            Manage your store configurations globally.
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary rounded-xl shadow-lg w-full sm:w-auto"
        >
          {isPending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Save size={18} />
          )}
          Save Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200/50 p-2 overflow-x-auto whitespace-nowrap scrollbar-hide rounded-2xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`tab tab-lg transition-all rounded-xl ${activeTab === t.id ? "bg-base-100 shadow-sm font-bold text-primary" : "font-medium opacity-70 hover:opacity-100"}`}
          >
            <t.icon size={16} className="mr-2" /> {t.label}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT: GENERAL --- */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Store Name
                    </label>
                    <input
                      {...form.register("storeName")}
                      className="input input-bordered"
                      placeholder="e.g. Nepal E-com"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      App Internal Name
                    </label>
                    <input
                      {...form.register("appName")}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label font-bold text-sm">
                      Store Subtitle / Tagline
                    </label>
                    <input
                      {...form.register("storeSubtitle")}
                      className="input input-bordered"
                      placeholder="Your trusted destination..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4">Contact Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Support Email
                    </label>
                    <input
                      {...form.register("storeEmail")}
                      className="input input-bordered"
                      placeholder="support@domain.com"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Support Phone
                    </label>
                    <input
                      {...form.register("storePhone")}
                      className="input input-bordered"
                      placeholder="+977..."
                    />
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label font-bold text-sm">
                      Physical Address
                    </label>
                    <input
                      {...form.register("storeAddress")}
                      className="input input-bordered"
                      placeholder="Kathmandu, Nepal"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      PAN / VAT Number
                    </label>
                    <input
                      {...form.register("storeTaxId")}
                      className="input input-bordered"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6 flex flex-col items-center text-center">
                <h2 className="text-lg font-bold mb-4 w-full text-left">
                  Store Logo
                </h2>
                <div
                  {...getRootProps()}
                  className={`relative w-40 h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"
                    }`}
                >
                  <input {...getInputProps()} />
                  {form.watch("storeLogo") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.watch("storeLogo") || ""}
                      alt="Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center opacity-40">
                      <UploadCloud size={32} />
                      <span className="text-xs mt-2 font-bold">
                        Upload Logo
                      </span>
                    </div>
                  )}
                </div>
                {form.watch("storeLogo") && (
                  <button
                    type="button"
                    onClick={() =>
                      form.setValue("storeLogo", "", { shouldDirty: true })
                    }
                    className="btn btn-xs btn-ghost text-error mt-4"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4">Financials</h2>
                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Tax Rate (VAT %)
                  </label>
                  <div className="relative">
                    <Percent
                      className="absolute left-3 top-3 text-base-content/40"
                      size={18}
                    />
                    <input
                      type="number"
                      {...form.register("taxRate")}
                      className="input input-bordered w-full pl-10"
                      placeholder="13"
                    />
                  </div>
                  <label className="label">
                    <span className="label-text-alt opacity-60">
                      Inclusive tax percentage to show on receipts
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: LOGISTICS --- */}
      {activeTab === "logistics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6 space-y-4">
                <h2 className="text-lg font-bold border-b border-base-200 pb-3">
                  Standard Shipping
                </h2>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      {...form.register("enableStoreDelivery")}
                      className="toggle toggle-success toggle-sm"
                    />
                    <span className="label-text font-bold">
                      Enable Internal Delivery
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Flat Rate Charge
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <span className="opacity-50 text-xs font-bold">NRP</span>
                      <input
                        type="number"
                        {...form.register("shippingCharge")}
                        className="grow"
                      />
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Free Shipping Threshold
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <span className="opacity-50 text-xs font-bold">NRP</span>
                      <input
                        type="number"
                        {...form.register("freeShippingThreshold")}
                        className="grow"
                        placeholder="e.g. 5000"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* NEPAL CAN MOVE */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-base-200 pb-3">
                  <h2 className="card-title text-sm opacity-60 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={16} className="text-error" /> Nepal Can Move
                    (NCM)
                  </h2>
                  <input
                    type="checkbox"
                    {...form.register("enableNcm")}
                    className="toggle toggle-error toggle-sm"
                  />
                </div>

                {form.watch("enableNcm") && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          {...form.register("ncmSandbox")}
                          className="checkbox checkbox-warning checkbox-sm"
                        />
                        <span className="label-text font-bold text-sm">
                          Enable Sandbox Mode (Test Environment)
                        </span>
                      </label>
                    </div>

                    <div className="alert alert-info bg-info/10 text-info-content text-xs p-3 rounded-xl border border-info/20 flex gap-2">
                      <Info size={16} className="shrink-0 text-info" />
                      <span className="leading-relaxed">
                        <strong>Webhook Setup Required:</strong> Go to the NCM
                        Vendor Portal and set your Webhook URL to:
                        <br />
                        <span className="font-mono bg-base-100 px-2 py-1 rounded mt-1 inline-block select-all text-primary border border-base-200">
                          https://yourdomain.com/api/webhooks/ncm
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          NCM API Token
                        </label>
                        <input
                          type="password"
                          {...form.register("ncmToken")}
                          className="input input-bordered font-mono text-sm"
                          placeholder="Paste your API token key here"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Default Origin Branch
                        </label>
                        <input
                          {...form.register("ncmOriginBranch")}
                          placeholder="e.g. TINKUNE"
                          className="input input-bordered font-mono text-sm uppercase"
                        />
                        <label className="label">
                          <span className="label-text-alt opacity-60">
                            The branch where you drop off packages
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-base-200 pb-3">
                  <h2 className="card-title text-sm opacity-60 uppercase tracking-widest flex items-center gap-2">
                    <Truck size={16} className="text-info" /> Pathao Logistics
                  </h2>
                  <input
                    type="checkbox"
                    {...form.register("enablePathao")}
                    className="toggle toggle-info toggle-sm"
                  />
                </div>

                {form.watch("enablePathao") && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
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

                    {!form.watch("pathaoSandbox") && (
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
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: PAYMENTS --- */}
      {activeTab === "payments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-base-200 pb-3">
                  <h2 className="card-title text-sm opacity-60 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={16} className="text-[#60bb46]" /> eSewa
                    Integration
                  </h2>
                  <input
                    type="checkbox"
                    {...form.register("enableEsewa")}
                    className="toggle toggle-success toggle-sm"
                  />
                </div>

                {form.watch("enableEsewa") && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          {...form.register("esewaSandbox")}
                          className="checkbox checkbox-warning checkbox-sm"
                        />
                        <span className="label-text font-bold text-sm">
                          Enable eSewa Sandbox Mode (EPAYTEST)
                        </span>
                      </label>
                    </div>

                    {!form.watch("esewaSandbox") && (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="form-control">
                          <label className="label font-bold text-sm">
                            Merchant ID / Product Code
                          </label>
                          <input
                            {...form.register("esewaId")}
                            className="input input-bordered font-mono text-sm"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label font-bold text-sm">
                            Secret Key
                          </label>
                          <input
                            type="password"
                            {...form.register("esewaSecret")}
                            className="input input-bordered font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-base-200 pb-3">
                  <h2 className="card-title text-sm opacity-60 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={16} className="text-[#5c2d91]" /> Khalti
                    Integration
                  </h2>
                  <input
                    type="checkbox"
                    {...form.register("enableKhalti")}
                    className="toggle toggle-primary toggle-sm"
                  />
                </div>

                {form.watch("enableKhalti") && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-4">
                        <input
                          type="checkbox"
                          {...form.register("khaltiSandbox")}
                          className="checkbox checkbox-warning checkbox-sm"
                        />
                        <span className="label-text font-bold text-sm">
                          Enable Khalti Sandbox Mode
                        </span>
                      </label>
                    </div>

                    {!form.watch("khaltiSandbox") && (
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Secret Key
                        </label>
                        <input
                          type="password"
                          {...form.register("khaltiSecret")}
                          className="input input-bordered font-mono text-sm"
                          placeholder="Live Secret Key"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4">Cash on Delivery</h2>
                <div className="form-control">
                  <label className="label cursor-pointer justify-between p-4 bg-base-200/50 rounded-xl border border-base-200 hover:border-primary transition-colors">
                    <span className="label-text font-bold">
                      Enable COD Checkout
                    </span>
                    <input
                      type="checkbox"
                      {...form.register("enableCod")}
                      className="toggle toggle-primary"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: EMAIL CONFIG --- */}
      {activeTab === "email" && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-base-content/5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Email Configuration</h2>
                  <p className="text-sm opacity-60 mt-1">Manage how your store sends receipts and notifications.</p>
                </div>
              </div>

              {/* Global Setting */}
              <div className="form-control mb-10 max-w-md">
                <label className="label font-bold text-sm">Sender Email Address (From)</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                  <input type="email" {...form.register("storeEmailFrom")} className="input input-bordered w-full pl-12 rounded-xl h-12" placeholder="orders@yourdomain.com" />
                </div>
                <label className="label"><span className="label-text-alt opacity-60">Customers will see emails coming from this address.</span></label>
              </div>

              {/* Provider Selection */}
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-60">Select Email Provider</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

                {/* SMTP Card */}
                <div
                  onClick={() => form.setValue("mailProvider", "SMTP", { shouldDirty: true })}
                  className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all flex gap-5 items-start group ${form.watch("mailProvider") === "SMTP" ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" : "border-base-200 hover:border-base-300 bg-base-50"}`}
                >
                  <div className={`p-4 rounded-xl transition-colors ${form.watch("mailProvider") === "SMTP" ? "bg-primary text-white" : "bg-base-200 text-base-content/60 group-hover:bg-base-300"}`}>
                    <Server size={28} />
                  </div>
                  <div className="flex-1 pr-6">
                    <h4 className="font-bold text-lg mb-1 text-base-content">Standard SMTP</h4>
                    <p className="text-sm opacity-70 leading-relaxed">Use your existing cPanel, Gmail, Outlook, or AWS SES email server credentials.</p>
                  </div>
                  {form.watch("mailProvider") === "SMTP" && (
                    <div className="absolute top-5 right-5 bg-primary text-white rounded-full p-1 shadow-sm">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* RESEND Card */}
                <div
                  onClick={() => form.setValue("mailProvider", "RESEND", { shouldDirty: true })}
                  className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all flex gap-5 items-start group ${form.watch("mailProvider") === "RESEND" ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" : "border-base-200 hover:border-base-300 bg-base-50"}`}
                >
                  <div className={`p-4 rounded-xl transition-colors ${form.watch("mailProvider") === "RESEND" ? "bg-primary text-white" : "bg-base-200 text-base-content/60 group-hover:bg-base-300"}`}>
                    <Zap size={28} />
                  </div>
                  <div className="flex-1 pr-6">
                    <h4 className="font-bold text-lg mb-1 text-base-content">Resend API</h4>
                    <p className="text-sm opacity-70 leading-relaxed">Modern, developer-friendly email API designed for high deliverability at scale.</p>
                  </div>
                  {form.watch("mailProvider") === "RESEND" && (
                    <div className="absolute top-5 right-5 bg-primary text-white rounded-full p-1 shadow-sm">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}
                </div>

              </div>

              <div className="divider opacity-30"></div>

              {/* Provider Specific Settings */}
              <div className="bg-base-200/40 p-6 md:p-8 rounded-[2rem] border border-base-200 shadow-inner">
                {form.watch("mailProvider") === "SMTP" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 border-b border-base-300 pb-3">
                      <Server size={22} className="text-primary" />
                      <h3 className="font-bold text-xl">SMTP Credentials</h3>
                    </div>

                    <div className="alert alert-info bg-info/10 border-info/20 text-info-content rounded-2xl p-5 flex gap-4 shadow-sm">
                      <Info size={24} className="shrink-0 text-info mt-1" />
                      <div>
                        <p className="font-bold text-base mb-1">Using a free Gmail account?</p>
                        <p className="opacity-90 text-sm leading-relaxed">
                          You cannot use your standard password here. Go to your Google Account Settings &rarr; Security &rarr; 2-Step Verification &rarr; <strong>App Passwords</strong> to generate a secure 16-character code, then paste it in the password field below.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="form-control">
                        <label className="label font-bold text-sm">SMTP Host</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                          <input {...form.register("smtpHost")} className="input input-bordered w-full pl-12 rounded-xl h-12 font-mono text-sm shadow-sm focus:border-primary" placeholder="smtp.gmail.com" />
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label font-bold text-sm">SMTP Port</label>
                        <div className="relative">
                          <input type="number" {...form.register("smtpPort")} className="input input-bordered w-full rounded-xl h-12 font-mono text-sm shadow-sm focus:border-primary" placeholder="465" />
                        </div>
                        <label className="label"><span className="label-text-alt opacity-60 font-medium">Commonly 465 (SSL) or 587 (TLS)</span></label>
                      </div>

                      <div className="form-control">
                        <label className="label font-bold text-sm">SMTP Username</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                          <input {...form.register("smtpUser")} className="input input-bordered w-full pl-12 rounded-xl h-12 font-mono text-sm shadow-sm focus:border-primary" placeholder="your.email@gmail.com" />
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label font-bold text-sm">SMTP Password / App Password</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                          <input type="password" {...form.register("smtpPassword")} className="input input-bordered w-full pl-12 rounded-xl h-12 font-mono text-sm shadow-sm focus:border-primary" placeholder="••••••••••••••••" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {form.watch("mailProvider") === "RESEND" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3 border-b border-base-300 pb-3">
                      <Zap size={22} className="text-primary" />
                      <h3 className="font-bold text-xl">Resend Integration</h3>
                    </div>

                    <p className="text-base opacity-80 leading-relaxed">
                      To start sending highly deliverable emails, get your API key from the <a href="https://resend.com" target="_blank" className="text-primary font-bold hover:underline">Resend Dashboard</a> and paste it below.
                    </p>

                    <div className="form-control max-w-xl">
                      <label className="label font-bold text-sm">Resend API Key</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                        <input type="password" {...form.register("resendApiKey")} className="input input-bordered w-full pl-12 rounded-xl h-12 font-mono text-sm shadow-sm focus:border-primary" placeholder="re_123456789..." />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: INTEGRATIONS --- */}
      {activeTab === "integrations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-200">

          {/* AI Keys */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-accent" /> AI Generation Keys
              </h2>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label font-bold text-sm">Google Gemini API Key</label>
                  <input type="password" {...form.register("aiGeminiKey")} className="input input-bordered font-mono text-sm" placeholder="AIzaSy..." />
                  <label className="label"><span className="label-text-alt opacity-60">Used for Product Magic Fill</span></label>
                </div>
                <div className="divider my-0">OR</div>
                <div className="form-control">
                  <label className="label font-bold text-sm">OpenAI API Key (Fallback)</label>
                  <input type="password" {...form.register("aiOpenAiKey")} className="input input-bordered font-mono text-sm" placeholder="sk-..." />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Globe size={20} className="text-primary" /> Scraper & Search
              </h2>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label font-bold text-sm">Google Custom Search Key</label>
                  <input type="password" {...form.register("crawlerApiKey")} className="input input-bordered font-mono text-sm" placeholder="API_KEY:CX_ID" />
                  <label className="label"><span className="label-text-alt opacity-60">Required to fetch automatic product images online. Format: KEY:CX</span></label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
