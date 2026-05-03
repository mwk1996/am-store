import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditService } from "@/services/audit.service";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();

  const expired = await prisma.order.findMany({
    where: { status: OrderStatus.DELIVERED, confirmDeadline: { lt: now } },
    select: { id: true },
  });

  let confirmed = 0;
  for (const order of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.COMPLETED, confirmedAt: now },
        });
        await auditService.log(tx, {
          orderId: order.id,
          event: "AUTO_CONFIRMED",
          ip: "cron",
          userAgent: "vercel-cron/1.0",
        });
      });
      confirmed++;
    } catch (err) {
      console.error(`Auto-confirm failed for order ${order.id}:`, err);
    }
  }

  return NextResponse.json({ confirmed, checkedAt: now.toISOString() });
}
