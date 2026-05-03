// Escrow service — implemented in Phase 4 (wallet/commission system)
export const escrowService = {
  async releaseFunds(_orderId: string): Promise<{ sellerAmount: number; commission: number }> {
    throw new Error("Escrow not implemented until Phase 4");
  },
  async refundBuyer(_orderId: string): Promise<void> {
    throw new Error("Escrow not implemented until Phase 4");
  },
};
