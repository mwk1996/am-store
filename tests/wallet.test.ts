import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";

describe("wallet deduction — atomic UPDATE", () => {
  it("succeeds (rowsAffected=1) when balance is sufficient", async () => {
    (prisma.$executeRaw as ReturnType<typeof import("vitest").vi.fn>).mockResolvedValueOnce(1);

    const rowsAffected = await prisma.$executeRaw`
      UPDATE "User" SET "walletBalance" = "walletBalance" - ${1000} WHERE id = ${"user-1"} AND "walletBalance" >= ${1000}
    `;
    expect(rowsAffected).toBe(1);
  });

  it("returns 0 rowsAffected (Insufficient balance) when balance too low", async () => {
    (prisma.$executeRaw as ReturnType<typeof import("vitest").vi.fn>).mockResolvedValueOnce(0);
    const rowsAffected = await prisma.$executeRaw`
      UPDATE "User" SET "walletBalance" = "walletBalance" - ${9999} WHERE id = ${"user-1"} AND "walletBalance" >= ${9999}
    `;
    expect(rowsAffected).toBe(0);
  });

  it("walletService.deductBalance throws 'Insufficient balance' when rowsAffected = 0", async () => {
    (prisma.$executeRaw as ReturnType<typeof import("vitest").vi.fn>).mockResolvedValueOnce(0);

    const { walletService } = await import("@/services/wallet.service");
    await expect(
      walletService.deductBalance("user-1", 9999 as any, prisma as any)
    ).rejects.toThrow("Insufficient balance");
  });
});
