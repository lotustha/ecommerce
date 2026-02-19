"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  createPathaoOrder,
  getPathaoCities,
  getPathaoZones,
  getPathaoAreas,
  getPathaoPricePlan,
  getPathaoOrderStatus,
} from "@/lib/delivery/external-apis";

export async function fetchCities() {
  return await getPathaoCities();
}
export async function fetchZones(cityId: number) {
  return await getPathaoZones(cityId);
}
export async function fetchAreas(zoneId: number) {
  return await getPathaoAreas(zoneId);
}

// ✅ Smart Shipping Calculation
export async function calculateShipping(data: {
  recipient_city: number;
  recipient_zone: number;
  items: { productId: string; quantity: number }[];
}) {
  try {
    // 1. Fetch System Settings for Markup
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    const markup = Number(settings?.shippingMarkup) || 0;
    const flatRate = Number(settings?.shippingCharge) || 150;

    // 2. Calculate Total Weight from DB
    let totalWeight = 0;

    // Fetch product specs for all items
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          specs: {
            include: { attribute: true },
          },
        },
      });

      if (product) {
        // Look for "Weight" attribute
        const weightSpec = product.specs.find(
          (s) => s.attribute.name.toLowerCase() === "weight",
        );

        if (weightSpec) {
          // Parse "0.5kg", "500g", "1.2 kg"
          const valString = weightSpec.value.toLowerCase().replace(/\s/g, "");
          let weightVal = 0;

          if (valString.includes("kg")) {
            weightVal = parseFloat(valString.replace("kg", ""));
          } else if (valString.includes("g")) {
            weightVal = parseFloat(valString.replace("g", "")) / 1000;
          } else if (valString.includes("gm")) {
            weightVal = parseFloat(valString.replace("gm", "")) / 1000;
          } else {
            weightVal = parseFloat(valString); // Assume kg if no unit
          }

          if (!isNaN(weightVal)) {
            totalWeight += weightVal * item.quantity;
          }
        }
      }
    }

    // Default weight min 0.5kg if nothing found
    totalWeight = Math.max(0.5, totalWeight);

    // 3. Call Pathao API
    const pricePlan = await getPathaoPricePlan({
      recipient_city: data.recipient_city,
      recipient_zone: data.recipient_zone,
      item_weight: totalWeight,
      delivery_type: 48, // Normal
      item_type: 2, // Parcel
    });

    // 4. Calculate Final Cost (API Cost + Markup)
    const apiCost = Number(pricePlan.final_price) || 0;
    const finalCost = apiCost + markup;

    return {
      success: true,
      cost: finalCost,
      breakdown: {
        apiCost,
        markup,
        weight: totalWeight,
      },
    };
  } catch (error) {
    console.error("Shipping Calc Error:", error);
    // Fallback to flat rate if API fails
    return {
      success: false,
      cost: 150,
      error: "Failed to calculate dynamic rate",
    };
  }
}

export async function refreshTrackingStatus(
  orderId: string,
  consignmentId: string,
) {
  try {
    const info = await getPathaoOrderStatus(consignmentId);
    if (info && info.order_status)
      return { success: true, status: info.order_status };
    return { error: "Could not fetch info" };
  } catch (e) {
    return { error: "Failed to track" };
  }
}

export async function getAvailablePartners() {
  return ["Pathao", "Upaya", "Manual"];
}

export async function getAvailableRiders() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF")
    return [];
  return prisma.user.findMany({
    where: { role: "RIDER" },
    select: { id: true, name: true },
  });
}

export async function assignDelivery(orderId: string, data: any) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF")
    return { error: "Unauthorized" };

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { error: "Order not found" };

    const updateData: any = {
      status: "READY_TO_SHIP",
      riderId: null,
      trackingCode: null,
      courier: null,
    };

    if (data.method === "PATHAO") {
      const payload = {
        merchant_order_id: order.id,
        recipient_name: data.recipient_name,
        recipient_phone: data.recipient_phone,
        recipient_address: data.recipient_address,
        recipient_city: data.recipient_city,
        recipient_zone: data.recipient_zone,
        recipient_area: data.recipient_area,
        item_weight: data.item_weight,
        item_quantity: 1,
        amount_to_collect:
          order.paymentStatus === "PAID" ? 0 : Number(order.totalAmount),
        item_type: 2,
        delivery_type: 48,
        item_description:
          data.item_description || `Order #${order.id.slice(-6)}`,
      };

      const res = await createPathaoOrder(payload);

      if (!res.success) {
        return { error: res.error || "Failed to create order with Pathao" };
      }

      updateData.deliveryType = "EXTERNAL";
      updateData.courier = "Pathao";
      updateData.trackingCode = res.consignment_id;
    } else if (data.method === "RIDER") {
      if (!data.riderId) return { error: "Please select a rider" };
      updateData.deliveryType = "INTERNAL";
      updateData.riderId = data.riderId;
    } else if (data.method === "OTHER") {
      updateData.deliveryType = "EXTERNAL";
      updateData.courier = data.courierName;
      updateData.trackingCode = data.trackingId;
    }

    await prisma.order.update({ where: { id: orderId }, data: updateData });

    revalidatePath(`/dashboard/orders/${orderId}`);
    return { success: "Delivery assigned successfully" };
  } catch (error: any) {
    console.error("Delivery Assign Error:", error);
    return { error: error.message || "Internal Server Error" };
  }
}
