import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { auditService } from "@/services/audit.service";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyToken(req);
    if (!user) return jsonError("Unauthorized", 401);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { product: { select: { deliveryType: true } } },
    });

    if (!order) return jsonError("Order not found", 404);
    if (order.buyerId !== user.userId) return jsonError("Forbidden", 403);
    if (order.status !== OrderStatus.DELIVERED) {
      return jsonError("Order is not in DELIVERED status", 400);
    }

    const now = new Date();
    // D-07: MANUAL disputeDeadline = confirmedAt + 14 days
    const disputeDeadline =
      order.product.deliveryType === "MANUAL"
        ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        : order.disputeDeadline;

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED, confirmedAt: now, disputeDeadline },
      });
      await auditService.log(tx, {
        orderId: order.id,
        event: "BUYER_CONFIRMED",
        ip: req.headers.get("x-forwarded-for") ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "unknown",
      });
    });

    // Phase 4: escrow release goes here
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/orders/[id]/confirm error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
