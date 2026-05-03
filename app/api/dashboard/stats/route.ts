import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { Role, OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  const userId = user.userId;

  const [totalProducts, totalOrders] = await Promise.all([
    user.role === Role.SELLER
      ? prisma.product.count({ where: { sellerId: userId } })
      : Promise.resolve(0),
    prisma.order.count({ where: { productId: { in: user.role === Role.SELLER
      ? (await prisma.product.findMany({ where: { sellerId: userId }, select: { id: true } })).map(p => p.id)
      : [] } } }),
  ]);

  return NextResponse.json({
    totalOrders,
    completedOrders: 0,
    pendingOrders: 0,
    walletBalance: 0,    // wallet in Phase 4
    pendingBalance: 0,   // wallet in Phase 4
    totalProducts,
    totalEarnings: 0,    // wallet in Phase 4
    averageRating: null, // reviews in Phase 5
  });
}
