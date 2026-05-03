import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { keyService } from "@/services/key.service";
import { verifyToken, jsonError, jsonOk } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

const schema = z.object({
  keys: z.string().min(1), // CSV or newline-separated keys
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "SELLER" && user.role !== "ADMIN") {
    return jsonError("Only sellers can upload keys", 403);
  }

  try {
    const body = await req.json();
    const { keys } = schema.parse(body);

    // Verify seller owns this product
    const product = await prisma.product.findFirst({
      where: { id: params.id, sellerId: user.userId },
    });
    if (!product) return jsonError("Product not found or not authorized", 403);

    const keyList = keys
      .split(/[\n,]/)
      .map((k) => k.trim())
      .filter(Boolean);

    if (keyList.length === 0) return jsonError("No valid keys provided");

    // De-duplicate plaintext keys before encryption (SEC-02 note: each encrypts differently)
    const uniqueKeys = Array.from(new Set(keyList));

    const result = await keyService.bulkCreate(params.id, uniqueKeys);
    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : "Failed to upload keys");
  }
}

// SEC-03: Returns available key count only — no key values exposed
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  const product = await prisma.product.findFirst({
    where: { id: params.id, sellerId: user.userId },
  });
  if (!product) return jsonError("Product not found or not authorized", 403);

  const count = await keyService.countAvailable(params.id);
  return jsonOk({ available: count });
}
