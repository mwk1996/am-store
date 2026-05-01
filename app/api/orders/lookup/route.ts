import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { guestEmail: email, status: "paid" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      product: { select: { name: true } },
      licenseKey: { select: { key: true } },
    },
  });

  return NextResponse.json(orders);
}
