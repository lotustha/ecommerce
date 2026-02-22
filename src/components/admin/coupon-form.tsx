"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CouponFormSchema,
  CouponFormValues,
} from "@/lib/validators/coupon-schema";
import { upsertCoupon } from "@/actions/coupon-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Save, ArrowLeft, Ticket, Percent, DollarSign } from "lucide-react";
import Link from "next/link";

export default function CouponForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Format date for datetime-local input
  const defaultDate = initialData?.expiresAt
    ? new Date(initialData.expiresAt).toISOString().slice(0, 16)
    : "";

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(CouponFormSchema) as any,
    defaultValues: {
      code: initialData?.code || "",
      type: initialData?.type || "PERCENTAGE",
      value: initialData?.value ? Number(initialData.value) : 0,
      maxDiscount: initialData?.maxDiscount
        ? Number(initialData.maxDiscount)
        : undefined,
      minOrder: initialData?.minOrder
        ? Number(initialData.minOrder)
        : undefined,
      expiresAt: defaultDate,
      isActive: initialData?.isActive ?? true,
      // @ts-ignore - Handle usage limit if the schema isn't fully synced yet
      usageLimit: initialData?.usageLimit
        ? Number(initialData.usageLimit)
        : undefined,
    },
  });

  const discountType = form.watch("type");

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const result = await upsertCoupon(data, initialData?.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Coupon saved successfully");
        router.push("/dashboard/coupons");
        router.refresh();
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 max-w-4xl mx-auto pb-20"
    >
      <div className="flex items-center justify-between sticky top-0 z-20 bg-base-200/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-base-content/5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/coupons" className="btn btn-circle btn-ghost">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {initialData ? "Edit Coupon" : "New Coupon"}
            </h1>
            <p className="text-sm opacity-60">Manage promotional discounts</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary rounded-xl shadow-lg"
        >
          {isPending ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Save size={18} />
          )}
          Save Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Ticket size={20} className="text-primary" /> Basic
                Configuration
              </h2>

              <div className="form-control mb-6">
                <label className="label font-bold text-sm">
                  Coupon Code <span className="text-error">*</span>
                </label>
                <input
                  {...form.register("code")}
                  className="input input-bordered input-lg uppercase font-mono font-bold tracking-widest focus:border-primary"
                  placeholder="e.g. SUMMER2024"
                />
                {form.formState.errors.code && (
                  <span className="text-error text-xs mt-1">
                    {form.formState.errors.code.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Discount Type
                  </label>
                  <select
                    {...form.register("type")}
                    className="select select-bordered"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Discount Value <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-base-content/50">
                      {discountType === "PERCENTAGE" ? (
                        <Percent size={18} />
                      ) : (
                        <span className="font-bold text-sm">Rs.</span>
                      )}
                    </div>
                    <input
                      type="number"
                      {...form.register("value")}
                      className="input input-bordered w-full pl-10"
                      placeholder="e.g. 15"
                    />
                  </div>
                  {form.formState.errors.value && (
                    <span className="text-error text-xs mt-1">
                      {form.formState.errors.value.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-6">Rules & Restrictions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Minimum Order Amount
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="opacity-50 text-xs font-bold">Rs.</span>
                    <input
                      type="number"
                      {...form.register("minOrder")}
                      className="grow"
                      placeholder="Optional"
                    />
                  </label>
                </div>

                {discountType === "PERCENTAGE" && (
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Maximum Discount Cap
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <span className="opacity-50 text-xs font-bold">Rs.</span>
                      <input
                        type="number"
                        {...form.register("maxDiscount")}
                        className="grow"
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                )}

                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Total Usage Limit
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <input
                      type="number"
                      {...form.register("usageLimit" as any)}
                      className="grow"
                      placeholder="Optional"
                      min="1"
                    />
                  </label>
                  <label className="label">
                    <span className="label-text-alt opacity-60">
                      Max times this code can be used across the store
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Expiry Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    {...form.register("expiresAt")}
                    className="input input-bordered"
                  />
                  <label className="label">
                    <span className="label-text-alt opacity-60">
                      Leave blank for no expiry
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-4">Status</h2>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    {...form.register("isActive")}
                    className="toggle toggle-success"
                  />
                  <span className="label-text font-bold">Active</span>
                </label>
                <p className="text-xs opacity-60 mt-2">
                  Turn off to temporarily disable this code from being used.
                </p>
              </div>

              {initialData && (
                <div className="mt-6 pt-4 border-t border-base-200">
                  <p className="text-xs font-bold uppercase opacity-50 mb-1">
                    Performance
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Uses:</span>
                    <span className="font-bold badge badge-primary">
                      {initialData.usedCount}{" "}
                      {initialData.usageLimit
                        ? `/ ${initialData.usageLimit}`
                        : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
