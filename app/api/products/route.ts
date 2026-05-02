import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DeliveryType, OrderStatus, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productService } from "@/services/product.service";
import { verifyToken, jsonError } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const rawDeliveryType = searchParams.get("deliveryType");
  const deliveryType =
    rawDeliveryType && Object.values(DeliveryType).includes(rawDeliveryType as DeliveryType)
      ? (rawDeliveryType as DeliveryType)
      : undefined;

  const filters = {
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    platform: searchParams.get("platform") ?? undefined,
    deliveryType,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    sellerId: searchParams.get("sellerId") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
  };

  const [listResult, featured] = await Promise.all([
    productService.list(filters),
    productService.featuredList(filters),
  ]);

  return NextResponse.json({
    featured,
    products: listResult.products,
    total: listResult.total,
    page: listResult.page,
    totalPages: listResult.totalPages,
  });
}

const createSchema = z.object({
  title: z.object({ en: z.string().min(1), ar: z.string().min(1) }),
  description: z.object({ en: z.string().min(1), ar: z.string().min(1) }),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  platform: z.string().optional(),
  deliveryType: z.nativeEnum(DeliveryType).default(DeliveryType.INSTANT),
});

export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "SELLER" && user.role !== "ADMIN") {
    return jsonError("Only sellers can create products", 403);
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // SEC-05: listing cap — max 10 active listings until first completed order
    const sellerId = user.userId;
    const [activeListings, completedOrders] = await Promise.all([
      prisma.product.count({ where: { sellerId, status: ProductStatus.ACTIVE } }),
      prisma.order.count({ where: { product: { sellerId }, status: OrderStatus.COMPLETED } }),
    ]);
    if (activeListings >= 10 && completedOrders === 0) {
      return jsonError(
        "Listing limit reached. Complete your first sale to unlock unlimited listings.",
        403
      );
    }

    const product = await productService.create({
      ...data,
      imageUrl: data.imageUrl || undefined,
      sellerId,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid input";
    return jsonError(message);
  }
}
