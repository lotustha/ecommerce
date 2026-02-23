import { prisma } from "@/lib/db/prisma";

async function getNcmConfig() {
  const settings = await prisma.systemSetting.findUnique({
    where: { id: "default" },
  });
  const isSandbox = settings?.ncmSandbox ?? true;

  return {
    baseURL: isSandbox
      ? "https://demo.nepalcanmove.com/api"
      : "https://nepalcanmove.com/api",
    token:
      !isSandbox && settings?.ncmToken
        ? settings.ncmToken
        : "0188e3a02adb5d735535830bff20849d54b967ab",
    originBranch: settings?.ncmOriginBranch || "TINKUNE",
  };
}

export async function getNcmBranches() {
  const config = await getNcmConfig();
  try {
    const res = await fetch(`${config.baseURL}/v2/branches`, {
      headers: { Authorization: `Token ${config.token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch (e) {
    console.error("NCM Fetch Branches Error:", e);
    return [];
  }
}

export async function getNcmPricePlan(
  destinationBranch: string,
  weight: number = 1,
) {
  const config = await getNcmConfig();
  try {
    const res = await fetch(
      `${config.baseURL}/v1/shipping-rate?creation=${config.originBranch}&destination=${destinationBranch}&type=Door2Door`,
      {
        headers: { Authorization: `Token ${config.token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (e) {
    console.error("NCM Price Plan Error:", e);
    return null;
  }
}

export async function createNcmOrder(orderData: any) {
  const config = await getNcmConfig();

  const payload = {
    fbranch: config.originBranch,
    ...orderData,
  };

  try {
    const res = await fetch(`${config.baseURL}/v1/order/create`, {
      method: "POST",
      headers: {
        Authorization: `Token ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (res.ok && response.orderid) {
      return { success: true, consignment_id: String(response.orderid) };
    } else {
      const errorMsg = response.Error
        ? JSON.stringify(response.Error)
        : response.message || "Failed to create NCM order";
      return { success: false, error: errorMsg };
    }
  } catch (e: any) {
    console.error("NCM Order Creation Error:", e);
    return { success: false, error: e.message || "Internal server error" };
  }
}
