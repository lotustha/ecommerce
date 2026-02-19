import { prisma } from "@/lib/db/prisma";

async function getKhaltiConfig() {
  const settings = await prisma.systemSetting.findUnique({
    where: { id: "default" },
  });
  const isSandbox = settings?.khaltiSandbox ?? true;

  return {
    initUrl: isSandbox
      ? "https://dev.khalti.com/api/v2/epayment/initiate/"
      : "https://khalti.com/api/v2/epayment/initiate/",
    verifyUrl: isSandbox
      ? "https://dev.khalti.com/api/v2/epayment/lookup/"
      : "https://khalti.com/api/v2/epayment/lookup/",
    secretKey:
      !isSandbox && settings?.khaltiSecret
        ? settings.khaltiSecret
        : process.env.KHALTI_SECRET_KEY ||
          "Key 8685b8c3866d4006a868478498705f42",
  };
}

export async function initiateKhaltiPayment(
  amount: number,
  orderId: string,
  customerInfo: { name: string; email: string; phone: string },
) {
  const config = await getKhaltiConfig();

  const payload = {
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback?gateway=khalti`,
    website_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    amount: amount * 100, // Convert to Paisa (Rs 1 = 100 Paisa)
    purchase_order_id: orderId,
    purchase_order_name: `Order #${orderId.slice(-6)}`,
    customer_info: {
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
    },
  };

  try {
    console.log(`🔵 Initializing Khalti Payment on ${config.initUrl}`);

    const response = await fetch(config.initUrl, {
      method: "POST",
      headers: {
        Authorization: config.secretKey, // Ensure this env var includes "Key " prefix if not using default
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🔴 Khalti API Error:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("🔴 Khalti Init Exception:", error);
    return null;
  }
}

export async function verifyKhaltiPayment(pidx: string) {
  try {
    const config = await getKhaltiConfig();

    const response = await fetch(config.verifyUrl, {
      method: "POST",
      headers: {
        Authorization: config.secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const data = await response.json();
    return data.status === "Completed" || data.status === "Refunded";
  } catch (error) {
    console.error("🔴 Khalti Verify Error:", error);
    return false;
  }
}
