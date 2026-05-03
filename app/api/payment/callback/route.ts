import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCallback } from "@/lib/payment/gateway";
import { sendLicenseEmail } from "@/lib/email";
import { getLocalizedText } from "@/lib/utils";
import { decryptKey } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    let payload: Record<string, unknown>;
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    }

    const verification = verifyCallback(payload);

    if (!verification.valid || !verification.orderId) {
      console.warn("Invalid payment callback signature:", payload);
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const { orderId, gatewayRef, status } = verification;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Idempotency
    if (order.status === "PAID" as any) {
      return NextResponse.json({ ok: true, already: "paid" });
    }

    if (status === "failure") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "FAILED" as any, gatewayRef: gatewayRef ?? order.gatewayRef },
      });
      return NextResponse.json({ ok: true, status: "failed" });
    }

    if (status !== "success") {
      return NextResponse.json({ ok: true, status: "pending" });
    }

    // Atomically assign an available product key
    const assignedKey = await prisma.$transaction(async (tx) => {
      const key = await tx.productKey.findFirst({
        where: { productId: order.productId, isUsed: false },
      });

      if (!key) throw new Error("No available license keys for this product.");

      const updated = await tx.productKey.update({
        where: { id: key.id },
        data: { isUsed: true, usedAt: new Date(), orderId },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID" as any,
          productKeyId: key.id,
          gatewayRef: gatewayRef ?? order.gatewayRef,
        },
      });

      return updated;
    });

    try {
      await sendLicenseEmail({
        to: order.guestEmail,
        productName: getLocalizedText(order.product.title, order.locale, "Product"),
        licenseKey: decryptKey(assignedKey.keyValue),
        orderId,
        locale: order.locale,
      });
    } catch (emailErr) {
      console.error("Failed to send license email:", emailErr);
    }

    return NextResponse.json({ ok: true, status: "paid" });
  } catch (err) {
    console.error("POST /api/payment/callback error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const payload: Record<string, unknown> = {};
  searchParams.forEach((value, key) => { payload[key] = value; });

  const verification = verifyCallback(payload);

  if (!verification.valid || !verification.orderId) {
    return NextResponse.redirect(new URL("/en/checkout", req.url));
  }

  const { orderId, status } = verification;

  if (status === "success") {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    const locale = order?.locale ?? "en";
    return NextResponse.redirect(new URL(`/${locale}/success?order=${orderId}`, req.url));
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  const locale = order?.locale ?? "en";
  return NextResponse.redirect(new URL(`/${locale}/checkout`, req.url));
}
