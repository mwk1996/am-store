// Wallet service — wallet model implemented in Phase 4
export const walletService = {
  async getOrCreate(_userId: string) {
    return { balance: 0, pendingBalance: 0 };
  },
  async getBalance(_userId: string) {
    return { balance: 0, pendingBalance: 0 };
  },
  async getTransactions(_userId: string, _page?: number, _limit?: number) {
    return [];
  },
  async credit(_userId: string, _amount: number, _note?: string) {
    throw new Error("Wallet not implemented until Phase 4");
  },
  async debit(_userId: string, _amount: number, _note?: string) {
    throw new Error("Wallet not implemented until Phase 4");
  },
};
