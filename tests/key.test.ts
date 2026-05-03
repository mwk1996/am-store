import { describe, it, expect, vi } from "vitest";
import { mockTx } from "./setup";

describe("keyService.assignKey", () => {
  it("uses SELECT FOR UPDATE SKIP LOCKED — not findFirst", async () => {
    mockTx.$queryRaw.mockResolvedValueOnce([{ id: "key-1", keyValue: "enc_abc" }]);
    mockTx.productKey.update.mockResolvedValueOnce({ id: "key-1", isUsed: true });

    const { keyService } = await import("@/services/key.service");
    await keyService.assignKey(mockTx as any, "product-1", "order-1");

    expect(mockTx.$queryRaw).toHaveBeenCalledOnce();
    expect(mockTx.productKey.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isUsed: true, orderId: "order-1" }) })
    );
  });

  it("throws when no available keys", async () => {
    mockTx.$queryRaw.mockResolvedValueOnce([]);
    const { keyService } = await import("@/services/key.service");
    await expect(keyService.assignKey(mockTx as any, "product-1", "order-1"))
      .rejects.toThrow("No available keys");
  });
});
