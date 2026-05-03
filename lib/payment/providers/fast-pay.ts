import { GatewayProvider } from "../types";

export const fastPayProvider: GatewayProvider = {
  async initiate() {
    throw new Error("Fast Pay gateway is not yet implemented");
  },
  verifyCallback() {
    return { valid: false };
  },
};
