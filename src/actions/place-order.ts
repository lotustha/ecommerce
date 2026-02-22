"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Expanded Schema to include optional Pathao IDs and Dynamic Shipping Cost
const PlaceOrderSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  province: z.string(),
  district: z.string(),
  city: z.string(),
  ward: z.coerce.number(),
  street: z.string(),
  paymentMethod: z.enum(["COD", "ESEWA", "KHALTI"]),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().nullable().optional(),
      quantity: z.number().min(1),
    }),
  ),
  // Optional Fields for Logistics
  pathaoCityId: z.number().optional().nullable(),
  pathaoZoneId: z.number().optional().nullable(),
  pathaoAreaId: z.number().optional().nullable(),
  shippingCost: z.coerce.number().optional().default(150),
  couponCode: z.string().optional().nullable(), // ✅ Accept Coupon Code
});

export async function placeOrder(values: z.infer<typeof PlaceOrderSchema>) {
  const session = await auth();
  let userId = session?.user?.id;
  let isNewAccount = false;

  const validated = PlaceOrderSchema.safeParse(values);
  if (!validated.success) {
    return { error: "Invalid order data." };
  }

  const {
    items,
    paymentMethod,
    email,
    fullName,
    pathaoCityId,
    pathaoZoneId,
    pathaoAreaId,
    shippingCost,
    couponCode,
    ...address
  } = validated.data;

  // --- GUEST CHECKOUT / USER CREATION ---
  if (!userId) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        error:
          "An account with this email already exists. Please log in to continue.",
      };
    }
    const randomPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name: fullName,
        email,
        phone: address.phone,
        password: hashedPassword,
        role: "USER",
      },
    });
    userId = newUser.id;
    isNewAccount = true;
  }

  // --- AUTO SAVE DEFAULT ADDRESS ---
  if (userId) {
    const addressCount = await prisma.address.count({ where: { userId } });
    if (addressCount === 0) {
      await prisma.address.create({
        data: {
          userId,
          province: address.province,
          district: address.district,
          city: address.city,
          ward: address.ward,
          street: address.street,
          phone: address.phone,
          isDefault: true,
        },
      });
    }
  }

  // --- PRICE CALCULATION ---
  let subTotal = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { variants: true },
    });
    if (!product) continue;

    let price = Number(product.price);
    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (variant) price = Number(variant.price);
    }
    if (product.discountPrice) {
      const discount = Number(product.discountPrice);
      if (discount < price) price = discount;
    }

    const lineTotal = price * item.quantity;
    subTotal += lineTotal;

    orderItemsData.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: price,
      name: product.name,
    });
  }

  // --- ✅ DISCOUNT CALCULATION ---
  let finalDiscount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    // Server-side strict validation ensures they can't hack the frontend request
    if (coupon && coupon.isActive) {
      const isNotExpired =
        !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
      const meetsMinOrder =
        !coupon.minOrder || subTotal >= Number(coupon.minOrder);

      if (isNotExpired && meetsMinOrder) {
        if (coupon.type === "PERCENTAGE") {
          finalDiscount = (subTotal * Number(coupon.value)) / 100;
          if (
            coupon.maxDiscount &&
            finalDiscount > Number(coupon.maxDiscount)
          ) {
            finalDiscount = Number(coupon.maxDiscount);
          }
        } else {
          finalDiscount = Number(coupon.value);
        }

        // Prevent discount from being larger than the subtotal
        if (finalDiscount > subTotal) finalDiscount = subTotal;

        // Register Coupon Usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  }

  const totalAmount = Math.max(0, subTotal + shippingCost - finalDiscount);

  try {
    const order = await prisma.order.create({
      data: {
        userId,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod,
        deliveryType: "EXTERNAL",

        shippingAddress: JSON.stringify({
          fullName,
          email,
          ...address,
          logistics: {
            pathaoCityId,
            pathaoZoneId,
            pathaoAreaId,
          },
        }),
        phone: address.phone,

        subTotal,
        shippingCost,
        discount: finalDiscount, // ✅ Save discount value to the order record
        totalAmount,

        items: {
          create: orderItemsData,
        },
      },
    });

    return {
      success: "Order placed successfully!",
      orderId: order.id,
      isNewAccount,
    };
  } catch (error) {
    console.error("Order Placement Error:", error);
    return { error: "Failed to place order. Please try again." };
  }
}
