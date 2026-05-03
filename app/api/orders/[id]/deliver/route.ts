import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { keyService } from "@/services/key.service";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { product: { select: { id: true, sellerId: true, deliveryType: true } } },
  });

  if (!order) return jsonError("Order not found", 404);
  if (order.product.sellerId !== user.userId) return jsonError("Forbidden", 403);
  if (order.status !== OrderStatus.PAID) return jsonError("Order must be in PAID status", 400);

  await prisma.$transaction(async (tx) => {
    if (order.product.deliveryType === "INSTANT") {
      await keyService.assignKey(tx as any, order.productId, order.id);
    }
    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.DELIVERED as any },
    });
  });

  return NextResponse.json({ success: true });
}
