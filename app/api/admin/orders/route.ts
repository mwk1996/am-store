import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

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
}
