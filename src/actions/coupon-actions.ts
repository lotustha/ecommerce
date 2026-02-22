"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  CouponFormSchema,
  CouponFormValues,
} from "@/lib/validators/coupon-schema";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized Access");
  }
}

// --- ADMIN ACTIONS ---
export async function upsertCoupon(data: CouponFormValues, id?: string) {
  try {
    await requireAdmin();

    // Using `any` cast internally to safely extract `usageLimit` and `startDate`
    // in case they are added to the frontend form later without strict typing issues here.
    const inputData = data as any;
    const {
      code,
      type,
      value,
      maxDiscount,
      minOrder,
      expiresAt,
      isActive,
      usageLimit,
      startDate,
    } = inputData;

    // Check code uniqueness
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing && existing.id !== id) {
      return { error: "This coupon code already exists!" };
    }

    const payload: any = {
      code,
      type,
      value,
      maxDiscount: maxDiscount || null,
      minOrder: minOrder || null,
      isActive,
    };

    // Handle required expiresAt (default to far future if not provided)
    if (expiresAt) {
      payload.expiresAt = new Date(expiresAt);
    } else if (!id) {
      // If creating new and no expiresAt is provided, set to 100 years in future to satisfy DB requirement
      payload.expiresAt = new Date(
        new Date().setFullYear(new Date().getFullYear() + 100),
      );
    }

    // Handle new optional fields defined in the Prisma Model
    if (usageLimit !== undefined) {
      payload.usageLimit = usageLimit ? Number(usageLimit) : null;
    }

    if (startDate) {
      payload.startDate = new Date(startDate);
    }

    if (id) {
      await prisma.coupon.update({ where: { id }, data: payload });
    } else {
      await prisma.coupon.create({ data: payload });
    }

    revalidatePath("/dashboard/coupons");
    return { success: `Coupon ${id ? "updated" : "created"} successfully` };
  } catch (error) {
    console.error("Coupon Upsert Error:", error);
    return { error: "Failed to save coupon" };
  }
}

export async function deleteCoupon(id: string) {
  try {
    await requireAdmin();
    await prisma.coupon.delete({ where: { id } });
    revalidatePath("/dashboard/coupons");
    return { success: "Coupon deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete coupon" };
  }
}

// --- PUBLIC STOREFRONT ACTION ---
export async function verifyCoupon(code: string, cartTotal: number) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) return { error: "Invalid promo code" };
    if (!coupon.isActive)
      return { error: "This promo code is no longer active" };

    const now = new Date();

    // Check start date
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return { error: "This promo code is not active yet" };
    }

    // Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return { error: "This promo code has expired" };
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { error: "This promo code has reached its maximum usage limit" };
    }

    // Check minimum order
    if (coupon.minOrder && cartTotal < Number(coupon.minOrder)) {
      return {
        error: `Add Rs. ${(Number(coupon.minOrder) - cartTotal).toLocaleString()} more to use this code`,
      };
    }

    // Calculate Discount
    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (cartTotal * Number(coupon.value)) / 100;
      // Apply Cap if maxDiscount exists
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = Number(coupon.value);
    }

    // Don't discount more than the cart value
    if (discountAmount > cartTotal) discountAmount = cartTotal;

    return {
      success: true,
      code: coupon.code,
      discountAmount,
    };
  } catch (error) {
    return { error: "Failed to verify coupon" };
  }
}
