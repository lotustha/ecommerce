import { prisma } from "@/lib/db/prisma";

async function getNcmConfig() {
  const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
  const isSandbox = settings?.ncmSandbox ?? true;

  // Get token and safely remove the word "Token " just in case it was accidentally pasted
  let token = (!isSandbox && settings?.ncmToken) ? settings.ncmToken : "0188e3a02adb5d735535830bff20849d54b967ab";
  token = token.replace(/Token\s+/ig, "").trim();

  return {
    baseURL: isSandbox ? "https://demo.nepalcanmove.com/api" : "https://nepalcanmove.com/api",
    token: token,
    originBranch: settings?.ncmOriginBranch || "TINKUNE"
  };
}

export async function getNcmBranches() {
  const config = await getNcmConfig();
  try {
    const res = await fetch(`${config.baseURL}/v2/branches`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${config.token}`,
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("NCM Fetch Branches Error:", res.status, errText);
      return [];
    }

    const data = await res.json();

    // Extremely aggressive parsing to catch any NCM JSON structure
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.branches)) return data.branches;
    if (data && typeof data === 'object') return Object.values(data);

    return [];
  } catch (e) {
    console.error("NCM Fetch Branches Exception:", e);
    return [];
  }
}

export async function getNcmPricePlan(destinationBranch: string, weight: number = 1) {
  const config = await getNcmConfig();
  try {
    const res = await fetch(`${config.baseURL}/v1/shipping-rate?creation=${config.originBranch}&destination=${destinationBranch}&type=Door2Door`, {
      headers: {
        "Authorization": `Token ${config.token}`,
        "Accept": "application/json"
      },
      cache: "no-store"
    });

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
    ...orderData
  };

  try {
    const res = await fetch(`${config.baseURL}/v1/order/create`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${config.token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const response = await res.json();

    if (res.ok && response.orderid) {
      return { success: true, consignment_id: String(response.orderid) };
    } else {
      const errorMsg = response.Error ? JSON.stringify(response.Error) : response.message || "Failed to create NCM order";
      return { success: false, error: errorMsg };
    }
  } catch (e: any) {
    console.error("NCM Order Creation Error:", e);
    return { success: false, error: e.message || "Internal server error" };
  }
}