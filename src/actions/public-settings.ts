"use server";

import { prisma } from "@/lib/db/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getPublicSettings() {
  noStore(); // ✅ Forces Next.js to bypass cache and always fetch fresh settings

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

        // ✅ NCM Logistics
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

        // Storefront CMS
        heroTitle: true,
        heroSubtitle: true,
        heroImage: true,

        feature1Title: true,
        feature1Sub: true,
        feature2Title: true,
        feature2Sub: true,
        feature3Title: true,
        feature3Sub: true,
      },
    });

    return settings;
  } catch (error) {
    console.error("Failed to fetch public settings:", error);
    return null;
  }
}
