import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DeliveryType, ProductStatus } from "@prisma/client";
import { productService } from "@/services/product.service";
import { verifyToken, jsonError } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const product = await productService.getById(params.id);
  if (!product) return jsonError("Product not found", 404);
  // SEC-03: keys relation is never included — only _count via productInclude
  return NextResponse.json(product);
}

const updateSchema = z.object({
  title: z.object({ en: z.string().min(1), ar: z.string().min(1) }).optional(),
  description: z.object({ en: z.string().min(1), ar: z.string().min(1) }).optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  platform: z.string().optional(),
  deliveryType: z.nativeEnum(DeliveryType).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const result = await productService.update(params.id, user.userId, {
      ...data,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
    });
    if (result.count === 0) return jsonError("Product not found or not authorized", 403);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : "Invalid input");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  const result = await productService.softDelete(params.id, user.userId);
  if (result.count === 0) return jsonError("Product not found or not authorized", 403);
  return NextResponse.json({ success: true });
}
