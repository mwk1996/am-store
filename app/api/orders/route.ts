import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createOrderSchema = z.object({
  email: z.string().email(),
  productId: z.string().min(1),
  locale: z.string().default("en"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, productId, locale } = createOrderSchema.parse(body);

    // Verify product exists and has available keys
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: { select: { licenseKeys: { where: { orderId: null } } } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (product._count.licenseKeys === 0) {
      return NextResponse.json({ error: "No license keys available for this product." }, { status: 409 });
    }

    const order = await prisma.order.create({
      data: {
        guestEmail: email,
        productId,
        locale,
        status: "pending",
      },
    });

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
