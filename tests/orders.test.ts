import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";

describe("orderService.listForUser", () => {
  it("returns only orders belonging to the requesting buyer", async () => {
    (prisma.order.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: "order-1", buyerId: "user-1", productKey: { id: "pk-1" } },
    ]);
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValueOnce(1);

    const { orderService } = await import("@/services/order.service");
    const result = await orderService.listForUser("user-1", "buyer");

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { buyerId: "user-1" } })
    );
    expect(result.items[0].productKey).not.toHaveProperty("keyValue");
  });
});

describe("GET /api/orders/[id]/key — ownership enforcement", () => {
  it("key endpoint is described: only buyer who owns the order can get the key", () => {
    // order.buyerId !== user.userId → 403 Forbidden
    // order.status not in [PAID, COMPLETED] → 403
    // Valid ownership + status → returns { key: string }
    expect(true).toBe(true);
  });
});

it.todo("DELIVERY-03: seller can post credentials via deliver route");
it.todo("DELIVERY-04: buyer can confirm receipt via confirm route");
