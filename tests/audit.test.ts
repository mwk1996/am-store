import { describe, it, expect } from "vitest";
import { mockTx } from "./setup";

describe("auditService.log", () => {
  it("creates an AuditLog record with orderId, event, ip, userAgent", async () => {
    mockTx.auditLog.create.mockResolvedValueOnce({ id: "audit-1" });

    const { auditService } = await import("@/services/audit.service");
    await auditService.log(mockTx as any, {
      orderId: "order-1",
      event: "KEY_REVEALED" as any,
      ip: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });

    expect(mockTx.auditLog.create).toHaveBeenCalledWith({
      data: {
        orderId: "order-1",
        event: "KEY_REVEALED",
        ip: "127.0.0.1",
        userAgent: "Mozilla/5.0",
      },
    });
  });
});
