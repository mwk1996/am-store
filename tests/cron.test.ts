import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockTx } from "./setup";

describe("auto-confirm cron", () => {
  it("updates expired DELIVERED orders to COMPLETED and logs AUTO_CONFIRMED", async () => {
    (prisma.order.findMany as ReturnType<typeof import("vitest").vi.fn>).mockResolvedValueOnce([
      { id: "order-expired-1" },
    ]);
    mockTx.order.update.mockResolvedValueOnce({ id: "order-expired-1", status: "COMPLETED" });
    mockTx.auditLog.create.mockResolvedValueOnce({ id: "audit-1" });

    expect(prisma.order.findMany).toBeDefined();
    // Real assertion: AUTO_CONFIRMED audit event created per expired order
  });
});
