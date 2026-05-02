import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = requireAdminSession(async (req, _user) => {
  const status = req.nextUrl.searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status: status as "pending" | "paid" | "failed" } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      licenseKey: { select: { key: true } },
    },
  });

  return NextResponse.json(orders);
});
