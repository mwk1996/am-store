import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = requireAdminSession(async (req, _user) => {
  const status = req.nextUrl.searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status: status.toUpperCase() as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { title: true } },
      productKey: { select: { id: true } },
    },
  });

  return NextResponse.json(orders);
});
