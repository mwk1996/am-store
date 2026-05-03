import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { getProvider } from "@/lib/payment";
import type { GatewayName, GatewayConfig } from "@/lib/payment/types";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// "wallet" excluded — wallet payments are completed atomically in POST /api/orders
const initiateSchema = z.object({
  orderId: z.string().min(1),
  gateway: z.enum(["zaincash", "qi-card", "fib", "asia-pay", "fast-pay"]),
});

function buildGatewayConfig(gateway: GatewayName): GatewayConfig {
  if (gateway === "zaincash") {
    return {
      name: "zaincash",
      enabled: true,
      production: process.env.ZAINCASH_PRODUCTION === "true",
      credentials: {
        msisdn: process.env.ZAINCASH_MSISDN ?? "",
        merchantId: process.env.ZAINCASH_MERCHANT_ID ?? "",
        secret: process.env.ZAINCASH_SECRET ?? "",
      },
    };
  }
  return { name: gateway, enabled: true, production: false, credentials: {} };
}

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req);
    if (!user) return jsonError("Unauthorized", 401);

    const raw = await req.json();
    // Guard: wallet must not reach this route
    if (raw?.gateway === "wallet") {
      return NextResponse.json(
        { error: "Wallet payments are processed during order creation" },
        { status: 400 }
      );
    }

    const { orderId, gateway } = initiateSchema.parse(raw);

    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId: user.userId, status: OrderStatus.PENDING },
      include: { product: true },
    });

    if (!order) return jsonError("Order not found or not in PENDING status.", 404);

    const provider = getProvider(gateway as GatewayName);
    const config = buildGatewayConfig(gateway as GatewayName);
    const result = await provider.initiate(order as any, config);

    await prisma.order.update({
      where: { id: orderId },
      data: { gatewayRef: result.gatewayRef },
    });

    return NextResponse.json({ redirectUrl: result.redirectUrl });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/payment/initiate error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
