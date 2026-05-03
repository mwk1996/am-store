import { Prisma, AuditEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const auditService = {
  async log(
    tx: Prisma.TransactionClient | typeof prisma,
    params: {
      orderId: string;
      event: AuditEvent;
      ip: string;
      userAgent: string;
    }
  ) {
    return tx.auditLog.create({ data: params });
  },
};
