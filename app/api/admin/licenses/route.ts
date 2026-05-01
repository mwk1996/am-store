import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

const importSchema = z.object({
  productId: z.string().min(1),
  keys: z.array(z.string().min(1)).min(1),
});

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const productId = req.nextUrl.searchParams.get("productId");

  const keys = await prisma.licenseKey.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      order: { select: { guestEmail: true } },
    },
  });

  return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const { productId, keys } = importSchema.parse(body);

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Deduplicate and skip existing keys
    const uniqueKeys = [...new Set(keys)];
    const existing = await prisma.licenseKey.findMany({
      where: { key: { in: uniqueKeys } },
      select: { key: true },
    });
    const existingSet = new Set(existing.map((k) => k.key));
    const newKeys = uniqueKeys.filter((k) => !existingSet.has(k));

    if (newKeys.length === 0) {
      return NextResponse.json({ count: 0, message: "All keys already exist." });
    }

    await prisma.licenseKey.createMany({
      data: newKeys.map((key) => ({ key, productId })),
    });

    return NextResponse.json({ count: newKeys.length }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/admin/licenses:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
