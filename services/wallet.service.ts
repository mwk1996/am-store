import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const walletService = {
  async deductBalance(
    userId: string,
    amount: Prisma.Decimal,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<void> {
    const result = await tx.$executeRaw`
      UPDATE "User"
      SET "walletBalance" = "walletBalance" - ${amount}
      WHERE id = ${userId}
        AND "walletBalance" >= ${amount}
    `;
    if (Number(result) === 0) {
      throw new Error("Insufficient balance");
    }
  },

  async getBalance(_userId: string) {
    return { balance: 0 };
  },

  async getTransactions(_userId: string, page = 1, limit = 20) {
    return { items: [], total: 0, page, limit };
  },
};
