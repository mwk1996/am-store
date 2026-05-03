import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        product: { select: { title: true, description: true } },
        productKey: { select: { id: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error(`GET /api/orders/${params.id} error:`, err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
