import { Order, Product } from "@prisma/client";

export type GatewayName = "zaincash" | "qi-card" | "fib" | "asia-pay" | "fast-pay" | "wallet";

export interface GatewayConfig {
  name: GatewayName;
  enabled: boolean;
  credentials: Record<string, string>;
  production: boolean;
}

export interface OrderWithProduct extends Order {
  product: Product;
}

export interface GatewayInitiateResult {
  redirectUrl: string;
  gatewayRef: string;
}

export interface VerifyResult {
  valid: boolean;
  orderId?: string;
  gatewayRef?: string;
  status?: "success" | "failure" | "pending";
}

export interface GatewayProvider {
  initiate(order: OrderWithProduct, config: GatewayConfig): Promise<GatewayInitiateResult>;
  verifyCallback(payload: Record<string, unknown>, config: GatewayConfig): VerifyResult;
}
