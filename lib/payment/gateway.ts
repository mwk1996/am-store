import crypto from "crypto";

export interface PaymentInitiateParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  description: string;
  callbackUrl: string;
  successUrl: string;
  failureUrl: string;
}

export interface PaymentInitiateResult {
  success: boolean;
  redirectUrl?: string;
  gatewayRef?: string;
  error?: string;
}

export interface PaymentCallbackPayload {
  orderId: string;
  gatewayRef: string;
  status: "success" | "failure" | "pending";
  amount: number;
  signature: string;
  [key: string]: unknown;
}

export interface PaymentVerifyResult {
  valid: boolean;
  orderId?: string;
  gatewayRef?: string;
  status?: "success" | "failure" | "pending";
}

/**
 * Initiate a payment with the Iraqi payment gateway.
 * Replace the implementation body with the actual gateway SDK/HTTP calls.
 */
export async function initiatePayment(
  params: PaymentInitiateParams
): Promise<PaymentInitiateResult> {
  const secret = process.env.PAYMENT_GATEWAY_SECRET;
  const apiUrl = process.env.PAYMENT_GATEWAY_API_URL;
  const merchantId = process.env.PAYMENT_GATEWAY_MERCHANT_ID;

  if (!secret || !apiUrl || !merchantId) {
    console.error("Payment gateway environment variables are not configured.");
    return { success: false, error: "Payment gateway not configured." };
  }

  // Build signature: HMAC-SHA256 of orderId + amount + merchantId
  const sigPayload = `${params.orderId}:${params.amount}:${merchantId}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(sigPayload)
    .digest("hex");

  // --- Replace this block with actual HTTP call to the gateway API ---
  // Example structure (adjust to real gateway docs):
  // const response = await fetch(`${apiUrl}/payment/create`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     merchant_id: merchantId,
  //     order_id: params.orderId,
  //     amount: params.amount,
  //     currency: params.currency ?? "IQD",
  //     email: params.customerEmail,
  //     description: params.description,
  //     callback_url: params.callbackUrl,
  //     success_url: params.successUrl,
  //     failure_url: params.failureUrl,
  //     signature,
  //   }),
  // });
  // const data = await response.json();
  // return { success: true, redirectUrl: data.payment_url, gatewayRef: data.ref };
  // --- End of block to replace ---

  // PLACEHOLDER: simulate successful initiation for development
  const gatewayRef = `GW-${Date.now()}-${params.orderId.slice(0, 8)}`;
  const mockRedirectUrl = `${params.callbackUrl}?order_id=${params.orderId}&ref=${gatewayRef}&status=success&sig=${signature}`;

  return {
    success: true,
    redirectUrl: mockRedirectUrl,
    gatewayRef,
  };
}

/**
 * Verify the callback payload from the gateway.
 * Returns whether the signature is valid and extracts the result.
 */
export function verifyCallback(payload: Record<string, unknown>): PaymentVerifyResult {
  const secret = process.env.PAYMENT_GATEWAY_SECRET;
  const merchantId = process.env.PAYMENT_GATEWAY_MERCHANT_ID;

  if (!secret || !merchantId) {
    return { valid: false };
  }

  const { order_id, ref, status, amount, sig } = payload as {
    order_id?: string;
    ref?: string;
    status?: string;
    amount?: number;
    sig?: string;
  };

  if (!order_id || !ref || !status || !sig) {
    return { valid: false };
  }

  // Recompute signature using the same algorithm as initiatePayment
  const sigPayload = `${order_id}:${amount}:${merchantId}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(sigPayload)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(sig, "hex"),
    Buffer.from(expectedSig, "hex")
  );

  if (!isValid) {
    return { valid: false };
  }

  const normalizedStatus =
    status === "success" ? "success" : status === "pending" ? "pending" : "failure";

  return {
    valid: true,
    orderId: order_id,
    gatewayRef: ref,
    status: normalizedStatus as "success" | "failure" | "pending",
  };
}
