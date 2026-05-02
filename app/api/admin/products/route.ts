import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const productSchema = z.object({
  name: z.object({ en: z.string(), ar: z.string(), tr: z.string(), ku: z.string() }),
  description: z.object({ en: z.string(), ar: z.string(), tr: z.string(), ku: z.string() }),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  category: z.string().optional().default("General"),
});

export const GET = requireAdminSession(async (_req, _user) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { licenseKeys: true } } },
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
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl ?? null,
        category: data.category,
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
