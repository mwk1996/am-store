import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const productSchema = z.object({
  title: z.object({ en: z.string(), ar: z.string() }),
  description: z.object({ en: z.string(), ar: z.string() }),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  categoryId: z.string().optional(),
  platform: z.string().optional(),
  deliveryType: z.enum(["INSTANT", "MANUAL"]).optional(),
  sellerId: z.string().min(1),
});

export const GET = requireAdminSession(async (_req, _user) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { keys: true } } },
  });

  return NextResponse.json(
    products.map((p) => ({ ...p, price: p.price.toString() }))
  );
});

export const POST = requireAdminSession(async (req, _user) => {
  try {
    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl ?? null,
        sellerId: data.sellerId,
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.platform && { platform: data.platform }),
        ...(data.deliveryType && { deliveryType: data.deliveryType }),
      },
    });

    return NextResponse.json({ ...product, price: product.price.toString() }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/admin/products:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
});
