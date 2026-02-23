"use server";

import { prisma } from "@/lib/db/prisma";

export async function getPublicSettings() {
  try {
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
      select: {
        appName: true,
        storeName: true,
        storeSubtitle: true,
        storeLogo: true,
        storeAddress: true,
        storeEmail: true,
        storePhone: true,
        currency: true,
        taxRate: true,

        // Logistics
        shippingCharge: true,
        shippingMarkup: true,
        freeShippingThreshold: true,
        enableStoreDelivery: true,

        enablePathao: true,
        pathaoSandbox: true,

        // ✅ NCM newly added to the public fetch!
        enableNcm: true,
        ncmSandbox: true,

        // Payments
        enableCod: true,
        enableEsewa: true,
        esewaSandbox: true,
        enableKhalti: true,
        khaltiSandbox: true,

        // Socials
        socialFacebook: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
      },
    });

    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to fetch public settings:", error);
    return null;
  }
}
