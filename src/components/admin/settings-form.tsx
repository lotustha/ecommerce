"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SettingsFormSchema,
  SettingsFormValues,
} from "@/lib/validators/settings-schema";
import { updateSettings } from "@/actions/settings-actions";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import {
  Save,
  Store,
  CreditCard,
  ShieldCheck,
  Settings as SettingsIcon,
} from "lucide-react";

export default function SettingsForm({ initialData }: { initialData?: any }) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("general");

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsFormSchema) as any,
    defaultValues: {
      appName: initialData?.appName || "Nepal E-com",
      currency: initialData?.currency || "NPR",
      taxRate: Number(initialData?.taxRate) || 0,
      storeName: initialData?.storeName || "Nepal E-com",
      storeDescription: initialData?.storeDescription || "",
      storeAddress: initialData?.storeAddress || "",
      storePhone: initialData?.storePhone || "",
      storeEmail: initialData?.storeEmail || "",
      esewaId: initialData?.esewaId || "",
      esewaSecret: initialData?.esewaSecret || "",
      khaltiSecret: initialData?.khaltiSecret || "",
      enableCod: initialData?.enableCod ?? true,
      enableEsewa: initialData?.enableEsewa ?? false,
      enableKhalti: initialData?.enableKhalti ?? false,
      privacyPolicy: initialData?.privacyPolicy || "",
      termsAndConditions: initialData?.termsAndConditions || "",
    },
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
    { id: "payment", label: "Payments", icon: CreditCard },
    { id: "legal", label: "Legal & Content", icon: ShieldCheck },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
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
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <ul className="menu bg-base-100 rounded-box border border-base-200 p-2 gap-1">
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

        {/* Form Content */}
        <div className="lg:col-span-3">
          <form className="space-y-6">
            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-6 space-y-4">
                  <h2 className="card-title text-sm opacity-60 uppercase border-b pb-2">
                    Application Config
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label font-bold text-sm">
                        App Name
                      </label>
                      <input
                        {...form.register("appName")}
                        className="input input-bordered"
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
                    <div className="form-control">
                      <label className="label font-bold text-sm">
                        Default Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        {...form.register("taxRate")}
                        className="input input-bordered"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STORE INFO TAB */}
            {activeTab === "store" && (
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-6 space-y-4">
                  <h2 className="card-title text-sm opacity-60 uppercase border-b pb-2">
                    Store Details
                  </h2>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Store Name (Title)
                    </label>
                    <input
                      {...form.register("storeName")}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Tagline / Subtitle
                    </label>
                    <input
                      {...form.register("storeDescription")}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">Address</label>
                    <input
                      {...form.register("storeAddress")}
                      className="input input-bordered"
                      placeholder="New Road, Kathmandu"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label font-bold text-sm">
                        Support Phone
                      </label>
                      <input
                        {...form.register("storePhone")}
                        className="input input-bordered"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label font-bold text-sm">
                        Support Email
                      </label>
                      <input
                        {...form.register("storeEmail")}
                        className="input input-bordered"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENTS TAB */}
            {activeTab === "payment" && (
              <div className="space-y-6">
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6">
                    <h2 className="card-title text-sm opacity-60 uppercase border-b pb-2 mb-4">
                      Payment Methods
                    </h2>
                    <div className="space-y-3">
                      <label className="label cursor-pointer justify-start gap-4 border p-3 rounded-lg hover:bg-base-200/50">
                        <input
                          type="checkbox"
                          {...form.register("enableCod")}
                          className="toggle toggle-primary"
                        />
                        <span className="font-bold">
                          Cash On Delivery (COD)
                        </span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-4 border p-3 rounded-lg hover:bg-base-200/50">
                        <input
                          type="checkbox"
                          {...form.register("enableEsewa")}
                          className="toggle toggle-success"
                        />
                        <span className="font-bold">eSewa Wallet</span>
                      </label>
                      <label className="label cursor-pointer justify-start gap-4 border p-3 rounded-lg hover:bg-base-200/50">
                        <input
                          type="checkbox"
                          {...form.register("enableKhalti")}
                          className="toggle toggle-secondary"
                        />
                        <span className="font-bold">Khalti Wallet</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6 space-y-4">
                    <h2 className="card-title text-sm opacity-60 uppercase border-b pb-2">
                      API Configuration
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          eSewa Merchant ID (SCD)
                        </label>
                        <input
                          {...form.register("esewaId")}
                          className="input input-bordered font-mono"
                          placeholder="EPAYTEST"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          eSewa Secret Key
                        </label>
                        <input
                          type="password"
                          {...form.register("esewaSecret")}
                          className="input input-bordered font-mono"
                        />
                      </div>
                      <div className="form-control">
                        <label className="label font-bold text-sm">
                          Khalti Secret Key
                        </label>
                        <input
                          type="password"
                          {...form.register("khaltiSecret")}
                          className="input input-bordered font-mono"
                        />
                      </div>
                    </div>
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
