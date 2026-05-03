import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export const GET = requireAdminSession(async (_req, _user) => {
  const [totalUsers, totalSellers, totalProducts, totalOrders, completedOrders, disputedOrders] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.SELLER } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "COMPLETED" as any } }),
      prisma.order.count({ where: { status: "DISPUTED" as any } }),
    ]);

  return NextResponse.json({
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    completedOrders,
    disputedOrders,
    totalRevenue: 0,       // wallet/commission implemented in Phase 4
    pendingWithdrawals: 0, // wallet implemented in Phase 4
  });
});
