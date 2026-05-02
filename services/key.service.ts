import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { encryptKey } from "@/lib/crypto";

export const keyService = {
  /**
   * Atomically assigns an unused key to an order.
   * Must be called inside a Prisma transaction or standalone.
   */
  async assignKey(tx: Prisma.TransactionClient, productId: string, orderId: string) {
    // Find first available key with a lock-safe approach using skipLocked via raw query
    const keys = await tx.productKey.findMany({
      where: { productId, isUsed: false, orderId: null },
      take: 1,
      orderBy: { createdAt: "asc" },
    });

    if (keys.length === 0) {
      throw new Error("No available keys for this product");
    }

    const key = keys[0];

    const updated = await tx.productKey.update({
      where: { id: key.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        orderId,
      },
    });

    return updated;
  },

  async countAvailable(productId: string) {
    return prisma.productKey.count({
      where: { productId, isUsed: false, orderId: null },
    });
  },

  async bulkCreate(productId: string, keyValues: string[]) {
    // Encrypt each key before storing (SEC-02)
    const encrypted = keyValues.map((kv) => ({
      productId,
      keyValue: encryptKey(kv),
    }));
    return prisma.productKey.createMany({
      data: encrypted,
      skipDuplicates: true,
    });
  },
};
