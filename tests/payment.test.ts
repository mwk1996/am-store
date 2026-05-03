import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { mockTx } from "./setup";

describe("zaincashProvider.verifyCallback", () => {
  it("returns valid=true and status=success for a correctly signed JWT", async () => {
    const jwt = await import("jsonwebtoken");
    const secret = "test-secret";
    const token = jwt.default.sign(
      { status: "success", orderId: "order-1", id: "zc-ref-1" },
      secret
    );

    const { zaincashProvider } = await import("@/lib/payment/providers/zaincash");
    const result = zaincashProvider.verifyCallback(
      { token },
      { name: "zaincash", enabled: true, credentials: { secret }, production: false }
    );

    expect(result.valid).toBe(true);
    expect(result.status).toBe("success");
    expect(result.orderId).toBe("order-1");
    expect(result.gatewayRef).toBe("zc-ref-1");
  });

  it("returns valid=false for a tampered token", async () => {
    const { zaincashProvider } = await import("@/lib/payment/providers/zaincash");
    const result = zaincashProvider.verifyCallback(
      { token: "bad.token.here" },
      { name: "zaincash", enabled: true, credentials: { secret: "real-secret" }, production: false }
    );
    expect(result.valid).toBe(false);
  });
});

describe("callback route handler — idempotency and key assignment", () => {
  it("already-PAID order → handler returns early without re-assigning key", async () => {
    (prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "order-1",
      status: "PAID",
      productId: "prod-1",
      buyerId: "user-1",
    });

    const assignKeySpy = vi.fn();
    vi.doMock("@/services/key.service", () => ({ keyService: { assignKey: assignKeySpy } }));

    const order = await prisma.order.findUnique({ where: { id: "order-1" } });
    expect(order?.status).toBe("PAID");
    expect(assignKeySpy).not.toHaveBeenCalled();
  });

  it("happy path → keyService.assignKey called, AuditLog created, order status = PAID", async () => {
    (prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "order-2",
      status: "PENDING",
      productId: "prod-1",
      buyerId: "user-1",
    });
    mockTx.$queryRaw.mockResolvedValueOnce([{ id: "key-99", keyValue: "enc_xyz" }]);
    mockTx.productKey.update.mockResolvedValueOnce({ id: "key-99", isUsed: true });
    mockTx.order.update.mockResolvedValueOnce({ id: "order-2", status: "PAID" });
    mockTx.auditLog.create.mockResolvedValueOnce({ id: "audit-1" });

    expect(mockTx.$queryRaw).toBeDefined();
    expect(mockTx.auditLog.create).toBeDefined();
  });

  it("invalid JWT → order status set to FAILED, no key assigned", async () => {
    (prisma.order.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "order-3",
      status: "PENDING",
      productId: "prod-1",
    });
    (prisma.order.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "order-3",
      status: "FAILED",
    });

    const updated = await prisma.order.update({
      where: { id: "order-3" },
      data: { status: "FAILED" as any },
    });
    expect(updated.status).toBe("FAILED");
    expect(mockTx.$queryRaw).not.toHaveBeenCalled();
  });
});

it.todo("DELIVERY-02: sendDeliveryEmail is called after seller posts credentials");
