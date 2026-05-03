import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { encryptKey } from "@/lib/crypto";

export const keyService = {
  /**
   * Atomically assigns an unused key to an order.
   * Must be called inside a Prisma transaction or standalone.
   */
  async assignKey(tx: Prisma.TransactionClient, productId: string, orderId: string) {
    const keys = await tx.$queryRaw<Array<{ id: string; keyValue: string }>>`
      SELECT id, "keyValue"
      FROM "ProductKey"
      WHERE "productId" = ${productId}
        AND "isUsed" = false
        AND "orderId" IS NULL
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (keys.length === 0) {
      throw new Error("No available keys for this product");
    }

    return tx.productKey.update({
      where: { id: keys[0].id },
      data: { isUsed: true, usedAt: new Date(), orderId },
    });
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
