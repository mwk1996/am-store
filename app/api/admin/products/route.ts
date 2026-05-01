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

const productSchema = z.object({
  name: z.object({ en: z.string(), ar: z.string(), tr: z.string(), ku: z.string() }),
  description: z.object({ en: z.string(), ar: z.string(), tr: z.string(), ku: z.string() }),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { licenseKeys: true } } },
  });

  return NextResponse.json(
    products.map((p) => ({ ...p, price: p.price.toString() }))
  );
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl ?? null,
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
}
