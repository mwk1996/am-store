import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export const GET = requireAdminSession(async (_req, _user) => {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    completedOrders,
    disputedOrders,
    revenueResult,
    pendingWithdrawals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.SELLER } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: "DISPUTED" } }),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { commission: true },
    }),
    prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    completedOrders,
    disputedOrders,
    totalRevenue: Number(revenueResult._sum.commission ?? 0),
    pendingWithdrawals,
  });
});
