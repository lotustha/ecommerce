import crypto from "crypto";

const ESEWA_TEST_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_SCD = "EPAYTEST";

export function generateEsewaSignature(totalAmount: string, transactionUuid: string, productCode: string) {
    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const secret = "8gBm/:&EnhH.1/q"; // Default Test Secret for EPAYTEST

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(signatureString);
    return hmac.digest("base64");
}

export function getEsewaConfig(amount: number, orderId: string) {
    console.log(process.env.NEXT_PUBLIC_APP_URL);
    const totalAmount = amount.toString();
    const transactionUuid = orderId; // Use Order ID as UUID
    const productCode = ESEWA_SCD;

    const signature = generateEsewaSignature(totalAmount, transactionUuid, productCode);

    return {
        url: ESEWA_TEST_URL,
        params: {
            amount: totalAmount,
            tax_amount: "0",
            total_amount: totalAmount,
            transaction_uuid: transactionUuid,
            product_code: productCode,
            product_service_charge: "0",
            product_delivery_charge: "0",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback?gateway=esewa&status=success`,
            failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback?gateway=esewa&status=failure`,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature: signature,
        }
    };
}