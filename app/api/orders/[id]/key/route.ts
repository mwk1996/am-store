import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { decryptKey } from "@/lib/crypto";
import { auditService } from "@/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyToken(req);
    if (!user) return jsonError("Unauthorized", 401);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { productKey: { select: { keyValue: true } } },
    });

    if (!order) return jsonError("Order not found", 404);
    if (order.buyerId !== user.userId) return jsonError("Forbidden", 403);
    if (!["PAID", "COMPLETED"].includes(order.status)) {
      return jsonError("Key not available for this order status", 403);
    }
    if (!order.productKey?.keyValue) return jsonError("No key assigned to this order", 404);

    const plaintext = decryptKey(order.productKey.keyValue);

    // D-18: log every key reveal as chargeback evidence
    await auditService.log(prisma, {
      orderId: order.id,
      event: "KEY_REVEALED",
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });

    return NextResponse.json({ key: plaintext });
  } catch (err) {
    console.error("GET /api/orders/[id]/key error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
