import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

export async function getEsewaConfig(amount: number, orderId: string) {
  const settings = await prisma.systemSetting.findUnique({
    where: { id: "default" },
  });

  const isSandbox = settings?.esewaSandbox ?? true;

  // Switch URLs based on Sandbox flag
  const URL = isSandbox
    ? "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
    : "https://epay.esewa.com.np/api/epay/main/v2/form";

  // Use Production Keys if Sandbox is off AND keys are provided
  const merchantId =
    !isSandbox && settings?.esewaId ? settings.esewaId : "EPAYTEST";
  const secret =
    !isSandbox && settings?.esewaSecret
      ? settings.esewaSecret
      : "8gBm/:&EnhH.1/q";

  const totalAmount = amount.toString();
  const transactionUuid = orderId;
  const productCode = merchantId;

  const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(signatureString);
  const signature = hmac.digest("base64");

  return {
    url: URL,
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
    },
  };
}

export async function verifyEsewaSignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string,
  signature: string,
) {
  const settings = await prisma.systemSetting.findUnique({
    where: { id: "default" },
  });
  const isSandbox = settings?.esewaSandbox ?? true;

  const secret =
    !isSandbox && settings?.esewaSecret
      ? settings.esewaSecret
      : "8gBm/:&EnhH.1/q";

  const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signatureString)
    .digest("base64");

  return signature === expectedSignature;
}
