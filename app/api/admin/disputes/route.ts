import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";
import { DisputeStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export const GET = requireAdminSession(async (req, _user) => {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const status = searchParams.get("status") as DisputeStatus | null;
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            amount: true,
            buyer: { select: { id: true, name: true, email: true } },
            seller: { select: { id: true, name: true, email: true } },
          },
        },
        openedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.dispute.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
});
