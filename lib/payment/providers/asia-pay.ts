import { GatewayProvider } from "../types";

export const asiaPayProvider: GatewayProvider = {
  async initiate() {
    throw new Error("Asia Pay gateway is not yet implemented");
  },
  verifyCallback() {
    return { valid: false };
  },
};
