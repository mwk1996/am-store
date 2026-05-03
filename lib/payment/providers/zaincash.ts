import jwt from "jsonwebtoken";
import {
  GatewayProvider,
  GatewayConfig,
  GatewayInitiateResult,
  VerifyResult,
  OrderWithProduct,
} from "../types";

const ZAINCASH_INIT_URL_PROD = "https://api.zaincash.iq/transaction/init";
const ZAINCASH_INIT_URL_TEST = "https://test.zaincash.iq/transaction/init";
const ZAINCASH_PAY_URL_PROD = "https://api.zaincash.iq/transaction/pay";
const ZAINCASH_PAY_URL_TEST = "https://test.zaincash.iq/transaction/pay";

export const zaincashProvider: GatewayProvider = {
  async initiate(order: OrderWithProduct, config: GatewayConfig): Promise<GatewayInitiateResult> {
    const { msisdn, merchantId, secret } = config.credentials;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const payload = {
      amount: Number(order.product.price),
      serviceType: "Other",
      msisdn,
      orderId: order.id,
      redirectUrl: `${appUrl}/api/payment/callback/zaincash`,
      production: config.production,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
    };

    const token = jwt.sign(payload, secret);
    const initUrl = config.production ? ZAINCASH_INIT_URL_PROD : ZAINCASH_INIT_URL_TEST;

    const res = await fetch(initUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, merchantId, lang: "ar" }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ZainCash init failed: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error("ZainCash init: no transaction id returned");

    const payUrl = config.production ? ZAINCASH_PAY_URL_PROD : ZAINCASH_PAY_URL_TEST;
    return {
      redirectUrl: `${payUrl}?id=${data.id}`,
      gatewayRef: data.id,
    };
  },

  verifyCallback(payload: Record<string, unknown>, config: GatewayConfig): VerifyResult {
    try {
      const { token } = payload as { token?: string };
      if (!token) return { valid: false };

      const decoded = jwt.verify(token, config.credentials.secret) as {
        status: string;
        orderId?: string;
        id?: string;
      };

      return {
        valid: true,
        orderId: decoded.orderId,
        gatewayRef: decoded.id,
        status: decoded.status === "success" ? "success" : "failure",
      };
    } catch {
      return { valid: false };
    }
  },
};
