"use server";

import { prisma } from "@/lib/db/prisma";
import { unstable_noStore as noStore } from "next/cache";

// Only returns non-sensitive fields safe for the public frontend
export async function getPublicSettings() {
  try {
    const rawSettings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
      select: {
        storeName: true,
        storeLogo: true,
        storeSubtitle: true,
        storeAddress: true,
        storePhone: true,
        storeEmail: true,
        storeTaxId: true,
        socialFacebook: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        currency: true,
        taxRate: true,
        shippingCharge: true,
        freeShippingThreshold: true,
        enableStoreDelivery: true,
        enablePathao: true,
        pathaoSandbox: true,
        enableCod: true,
        enableEsewa: true,
        esewaSandbox: true,
        enableKhalti: true,
        khaltiSandbox: true,
      },
    });

    return JSON.parse(JSON.stringify(rawSettings));
  } catch (error) {
    console.error("Failed to fetch public settings:", error);
    return null;
  }
}
