const KHALTI_TEST_URL = "https://a.khalti.com/api/v2/epayment/initiate/";
const KHALTI_VERIFY_URL = "https://a.khalti.com/api/v2/epayment/lookup/";
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || "Key 8685b8c3866d4006a868478498705f42";

export async function initiateKhaltiPayment(amount: number, orderId: string, customerInfo: { name: string, email: string, phone: string }) {
    const payload = {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback?gateway=khalti`,
        website_url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        amount: amount * 100, // Khalti expects paisa (Rs * 100)
        purchase_order_id: orderId,
        purchase_order_name: `Order #${orderId.slice(-6)}`,
        customer_info: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone
        }
    };

    try {
        const response = await fetch(KHALTI_TEST_URL, {
            method: 'POST',
            headers: {
                'Authorization': KHALTI_SECRET_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return data; // Contains { pidx, payment_url }
    } catch (error) {
        console.error("Khalti Init Error:", error);
        return null;
    }
}

export async function verifyKhaltiPayment(pidx: string) {
    try {
        const response = await fetch(KHALTI_VERIFY_URL, {
            method: 'POST',
            headers: {
                'Authorization': KHALTI_SECRET_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pidx })
        });

        const data = await response.json();
        return data.status === 'Completed' || data.status === 'Refunded'; // Allow refunded for test logic if needed
    } catch (error) {
        console.error("Khalti Verify Error:", error);
        return false;
    }
}