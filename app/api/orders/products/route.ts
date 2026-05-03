import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint: return products that have available license keys
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        keys: { some: { isUsed: false } },
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
      },
    });

    return NextResponse.json(
      products.map((p) => ({ ...p, price: p.price.toString() }))
    );
  } catch (err) {
    console.error("GET /api/orders/products error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
