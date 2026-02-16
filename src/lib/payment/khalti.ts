// ✅ UPDATED: Correct Sandbox URL (dev.khalti.com)
const KHALTI_TEST_URL = "https://dev.khalti.com/api/v2/epayment/initiate/";
const KHALTI_VERIFY_URL = "https://dev.khalti.com/api/v2/epayment/lookup/";

// Test Secret Key (Default provided by Khalti docs for sandbox)
const KHALTI_SECRET_KEY =
  process.env.KHALTI_SECRET_KEY || "Key 8685b8c3866d4006a868478498705f42";

export async function initiateKhaltiPayment(
  amount: number,
  orderId: string,
  customerInfo: { name: string; email: string; phone: string },
) {
  const payload = {
    // ✅ Ensure return_url matches your callback route
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
    console.log("🔵 Initializing Khalti Payment...", payload);

    const response = await fetch(KHALTI_TEST_URL, {
      method: "POST",
      headers: {
        Authorization: KHALTI_SECRET_KEY, // Ensure this env var includes "Key " prefix if not using default
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("🔴 Khalti API Error:", data);
      return null;
    }

    return data; // Returns { pidx, payment_url, ... }
  } catch (error) {
    console.error("🔴 Khalti Init Exception:", error);
    return null;
  }
}

export async function verifyKhaltiPayment(pidx: string) {
  try {
    const response = await fetch(KHALTI_VERIFY_URL, {
      method: "POST",
      headers: {
        Authorization: KHALTI_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const data = await response.json();
    // Khalti V2 status is "Completed" for success
    return data.status === "Completed" || data.status === "Refunded";
  } catch (error) {
    console.error("🔴 Khalti Verify Error:", error);
    return false;
  }
}
