import { GatewayProvider } from "../types";

export const fibProvider: GatewayProvider = {
  async initiate() {
    throw new Error("FIB gateway is not yet implemented");
  },
  verifyCallback() {
    return { valid: false };
  },
};
