import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const importSchema = z.object({
  productId: z.string().min(1),
  keys: z.array(z.string().min(1)).min(1),
});

export const GET = requireAdminSession(async (req, _user) => {
  const productId = req.nextUrl.searchParams.get("productId");

  const keys = await prisma.productKey.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { title: true } },
      order: { select: { guestEmail: true } },
    },
  });

  return NextResponse.json(keys);
});

export const POST = requireAdminSession(async (req, _user) => {
  try {
    const body = await req.json();
    const { productId, keys } = importSchema.parse(body);

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Deduplicate and skip existing keys
    const uniqueKeys = Array.from(new Set<string>(keys));
    const existing = await prisma.productKey.findMany({
      where: { keyValue: { in: uniqueKeys } },
      select: { keyValue: true },
    });
    const existingSet = new Set(existing.map((k) => k.keyValue));
    const newKeys = uniqueKeys.filter((k) => !existingSet.has(k));

    if (newKeys.length === 0) {
      return NextResponse.json({ count: 0, message: "All keys already exist." });
    }

    const { encryptKey } = await import("@/lib/crypto");
    await prisma.productKey.createMany({
      data: newKeys.map((key) => ({ keyValue: encryptKey(key), productId })),
    });

    return NextResponse.json({ count: newKeys.length }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/admin/licenses:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
});
