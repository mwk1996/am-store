import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { orderService } from "@/services/order.service";
import { walletService } from "@/services/wallet.service";
import { keyService } from "@/services/key.service";
import { Prisma, OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  productId: z.string().min(1),
  locale: z.string().default("en"),
  gateway: z.enum(["zaincash", "qi-card", "fib", "asia-pay", "fast-pay", "wallet"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    if (!user) return jsonError("Unauthorized", 401);

    const body = createOrderSchema.parse(await req.json());
    const { productId, locale, gateway } = body;

    const product = await prisma.product.findUnique({
      where: { id: productId, status: "ACTIVE" },
      include: {
        _count: { select: { keys: { where: { isUsed: false, orderId: null } } } },
      },
    });

    if (!product) return jsonError("Product not found.", 404);

    if (product.deliveryType === "INSTANT" && product._count.keys === 0) {
      return jsonError("Product out of stock.", 409);
    }

    const price = new Prisma.Decimal(product.price);
    const commissionAmount = price.mul(new Prisma.Decimal("0.10")); // D-19: 10% fixed
    const sellerAmount = price.mul(new Prisma.Decimal("0.90"));     // D-06

    // D-07: INSTANT orders get disputeDeadline now; MANUAL orders get it at confirmTime
    const disputeDeadline =
      product.deliveryType === "INSTANT"
        ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        : null;

    const baseOrderData = {
      buyerId: user.userId,
      sellerId: product.sellerId,
      productId,
      locale,
      sellerAmount,
      commissionAmount,
      disputeDeadline,
    };

    // D-01 / D-10: wallet path — deductBalance + assignKey (INSTANT) + create PAID in one $transaction
    if (gateway === "wallet") {
      try {
        const order = await prisma.$transaction(async (tx) => {
          await walletService.deductBalance(user.userId, price, tx);

          if (product.deliveryType === "INSTANT") {
            // Temp placeholder orderId; will be updated after order.create
            const tempId = `tmp-${Date.now()}`;
            const key = await keyService.assignKey(tx, productId, tempId);
            const created = await tx.order.create({
              data: { ...baseOrderData, status: OrderStatus.PAID, productKeyId: key.id },
            });
            await tx.productKey.update({
              where: { id: key.id },
              data: { orderId: created.id },
            });
            return created;
          } else {
            return tx.order.create({
              data: { ...baseOrderData, status: OrderStatus.PAID },
            });
          }
        });
        return NextResponse.json({ orderId: order.id, paid: true }, { status: 201 });
      } catch (err) {
        if (err instanceof Error && err.message === "Insufficient balance") {
          return NextResponse.json({ error: "Insufficient balance" }, { status: 402 });
        }
        throw err;
      }
    }

    // Gateway path — order stays PENDING until callback
    const order = await prisma.order.create({
      data: { ...baseOrderData, status: OrderStatus.PENDING },
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

export async function GET(req: NextRequest) {
  try {
    const user = verifyToken(req);
    if (!user) return jsonError("Unauthorized", 401);

    const role = user.role === "SELLER" ? "seller" : "buyer";
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

    const result = await orderService.listForUser(user.userId, role, page, Math.min(limit, 50));
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
