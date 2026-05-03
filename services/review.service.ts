// Review service — review model implemented in Phase 5
export const reviewService = {
  async create(_data: unknown): Promise<never> {
    throw new Error("Reviews not implemented until Phase 5");
  },
  async listForProduct(_productId: string) {
    return [];
  },
  async listForSeller(_sellerId: string) {
    return [];
  },
  async getForSeller(_sellerId: string, _page?: number, _limit?: number) {
    return [];
  },
};
