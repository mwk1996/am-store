import { GatewayProvider } from "../types";

export const qiCardProvider: GatewayProvider = {
  async initiate() {
    throw new Error("QI Card gateway is not yet implemented");
  },
  verifyCallback() {
    return { valid: false };
  },
};
