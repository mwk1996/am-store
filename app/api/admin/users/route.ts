import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export const GET = requireAdminSession(async (req, _user) => {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);
  const role = searchParams.get("role") as Role | null;
  const skip = (page - 1) * limit;

  const where = role ? { role } : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: { select: { sellerProducts: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
});
