import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.object({ en: z.string(), ar: z.string(), tr: z.string(), ku: z.string() }).optional(),
  description: z.object({ en: z.string(), ar: z.string(), tr: z.string(), ku: z.string() }).optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
});

export const PUT = requireAdminSession(async (req, _user, ctx) => {
  const id = ctx.params.id;
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.category !== undefined && { category: data.category }),
      },
    });

    return NextResponse.json({ ...product, price: product.price.toString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error(`PUT /api/admin/products/${id}:`, err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
});

export const DELETE = requireAdminSession(async (_req, _user, ctx) => {
  const id = ctx.params.id;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/admin/products/${id}:`, err);
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
  }
});
