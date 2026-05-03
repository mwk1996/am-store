import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/payment/gateway";
import { getLocalizedText } from "@/lib/utils";

const schema = z.object({
  orderId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = schema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status !== "PENDING" as any) {
      return NextResponse.json({ error: "Order is not in pending state." }, { status: 409 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/payment/callback`;
    const successUrl = `${appUrl}/${order.locale}/success?order=${orderId}`;
    const failureUrl = `${appUrl}/${order.locale}/checkout`;

    const result = await initiatePayment({
      orderId,
      amount: Number(order.product.price),
      currency: "IQD",
      customerEmail: order.guestEmail,
      description: getLocalizedText(order.product.title, order.locale, "Software License"),
      callbackUrl,
      successUrl,
      failureUrl,
    });

    if (!result.success || !result.redirectUrl) {
      return NextResponse.json({ error: result.error ?? "Payment initiation failed." }, { status: 502 });
    }

    // Store gateway reference on order
    if (result.gatewayRef) {
      await prisma.order.update({
        where: { id: orderId },
        data: { gatewayRef: result.gatewayRef },
      });
    }

    return NextResponse.json({ redirectUrl: result.redirectUrl });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/payment/initiate error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
