import { vi, beforeEach } from "vitest";

// Mock Prisma client — prevents live DB calls in unit tests
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockTx)),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    productKey: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

export const mockTx = {
  $queryRaw: vi.fn(),
  order: {
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  productKey: {
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});
