import { GatewayName, GatewayProvider } from "./types";
import { zaincashProvider } from "./providers/zaincash";
import { qiCardProvider } from "./providers/qi-card";
import { fibProvider } from "./providers/fib";
import { asiaPayProvider } from "./providers/asia-pay";
import { fastPayProvider } from "./providers/fast-pay";

const providers: Record<GatewayName, GatewayProvider> = {
  zaincash: zaincashProvider,
  "qi-card": qiCardProvider,
  fib: fibProvider,
  "asia-pay": asiaPayProvider,
  "fast-pay": fastPayProvider,
  wallet: {
    async initiate() { throw new Error("wallet path handled separately in order route"); },
    verifyCallback() { return { valid: false }; },
  },
};

export function getProvider(name: GatewayName): GatewayProvider {
  const p = providers[name];
  if (!p) throw new Error(`Unknown gateway: ${name}`);
  return p;
}

export type { GatewayName, GatewayConfig, GatewayProvider, GatewayInitiateResult, VerifyResult, OrderWithProduct } from "./types";
