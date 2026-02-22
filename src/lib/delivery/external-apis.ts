import { prisma } from "@/lib/db/prisma";

// Pathao API Configuration Dynamic Helper
async function getPathaoConfig() {
  const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
  const isSandbox = settings?.pathaoSandbox ?? true;

  return {
    baseURL: isSandbox ? "https://courier-api-sandbox.pathao.com" : "https://api-hermes.pathao.com",
    clientId: (!isSandbox && settings?.pathaoClientId) ? settings.pathaoClientId : (process.env.PATHAO_CLIENT_ID || "QK9b69QaEv"),
    clientSecret: (!isSandbox && settings?.pathaoClientSecret) ? settings.pathaoClientSecret : (process.env.PATHAO_CLIENT_SECRET || "k12nLGgq0zM3a65Sp65el4SZO6dhhMIxR0rDCavz"),
    username: (!isSandbox && settings?.pathaoUsername) ? settings.pathaoUsername : (process.env.PATHAO_USERNAME || "test.parcel@pathao.com"),
    password: (!isSandbox && settings?.pathaoPassword) ? settings.pathaoPassword : (process.env.PATHAO_PASSWORD || "lovePathao"),
  };
}

// Token Caching
let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getPathaoToken(config: any): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token;
  }

  try {
    const res = await fetch(`${config.baseURL}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "password",
        username: config.username,
        password: config.password,
      }),
    });

    const data = await res.json();
    if (!data.access_token) throw new Error("Failed to get Pathao access token");

    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000) - 60000,
    };

    return data.access_token;
  } catch (error) {
    console.error("Pathao Auth Error:", error);
    throw error;
  }
}

async function getStoreId(token: string, baseURL: string): Promise<number> {
  const res = await fetch(`${baseURL}/aladdin/api/v1/stores`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
  });
  const response = await res.json();
  if (response.data?.data?.length > 0) return response.data.data[0].store_id;
  throw new Error("No active Pathao store found");
}

export async function getPathaoCities() {
  const config = await getPathaoConfig();
  const token = await getPathaoToken(config);
  const res = await fetch(`${config.baseURL}/aladdin/api/v1/city-list`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data?.data || [];
}

export async function getPathaoZones(cityId: number) {
  const config = await getPathaoConfig();
  const token = await getPathaoToken(config);
  const res = await fetch(`${config.baseURL}/aladdin/api/v1/cities/${cityId}/zone-list`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data?.data || [];
}

export async function getPathaoAreas(zoneId: number) {
  const config = await getPathaoConfig();
  const token = await getPathaoToken(config);
  const res = await fetch(`${config.baseURL}/aladdin/api/v1/zones/${zoneId}/area-list`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data?.data || [];
}

export async function getPathaoPricePlan(data: {
  recipient_city: number,
  recipient_zone: number,
  item_weight: number,
  delivery_type?: number, // 48 Normal, 12 On Demand
  item_type?: number // 1 Doc, 2 Parcel
}) {
  const config = await getPathaoConfig();
  const token = await getPathaoToken(config);
  const storeId = await getStoreId(token, config.baseURL);

  const payload = {
    store_id: storeId,
    item_type: data.item_type || 2,
    delivery_type: data.delivery_type || 48,
    item_weight: data.item_weight,
    recipient_city: data.recipient_city,
    recipient_zone: data.recipient_zone
  };

  const res = await fetch(`${config.baseURL}/aladdin/api/v1/merchant/price-plan`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const response = await res.json();
  return response.data; // { price, final_price, delivery_fee, ... }
}

export async function createPathaoOrder(orderData: any) {
  const config = await getPathaoConfig();
  const token = await getPathaoToken(config);
  const storeId = await getStoreId(token, config.baseURL);

  const payload = {
    store_id: storeId,
    ...orderData
  };

  const res = await fetch(`${config.baseURL}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const response = await res.json();
  if (response.type === "success") {
    return { success: true, ...response.data };
  } else {
    const errorMsg = response.errors ? JSON.stringify(response.errors) : response.message;
    return { success: false, error: errorMsg };
  }
}

// TRACKING FUNCTION
export async function getPathaoOrderStatus(consignmentId: string) {
  try {
    const config = await getPathaoConfig();
    const token = await getPathaoToken(config);
    const res = await fetch(`${config.baseURL}/aladdin/api/v1/orders/${consignmentId}/info`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("Tracking Error:", error);
    return null;
  }
}

// ✅ NEW: PATHAO CANCELLATION API 
export async function cancelPathaoOrder(consignmentId: string) {
  try {
    const config = await getPathaoConfig();
    const token = await getPathaoToken(config);

    const res = await fetch(`${config.baseURL}/aladdin/api/v1/orders/${consignmentId}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();
    return data.type === "success" || data.code === 200;
  } catch (error) {
    console.error("Pathao Cancellation Error:", error);
    return false;
  }
}