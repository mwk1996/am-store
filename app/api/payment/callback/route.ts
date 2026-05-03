import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLicenseEmail } from "@/lib/email";
import { getLocalizedText } from "@/lib/utils";
import { decryptKey } from "@/lib/crypto";
import { keyService } from "@/services/key.service";
import { auditService } from "@/services/audit.service";
import { getProvider } from "@/lib/payment";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function buildZainCashConfig() {
  return {
    name: "zaincash" as const,
    enabled: true,
    production: process.env.ZAINCASH_PRODUCTION === "true",
    credentials: { secret: process.env.ZAINCASH_SECRET ?? "" },
  };
}

// ZainCash callback is a browser GET redirect — token is in query params (not POST body)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const config = buildZainCashConfig();
  const provider = getProvider("zaincash");
  const verifyResult = provider.verifyCallback({ token }, config);

  if (!verifyResult.valid || !verifyResult.orderId) {
    return NextResponse.redirect(new URL("/en/checkout", req.url));
  }

  const orderId = verifyResult.orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, buyer: { select: { email: true } } },
  });

  if (!order) return NextResponse.redirect(new URL("/en/checkout", req.url));

  const locale = order.locale ?? "en";

  // Idempotency: already PAID → skip, redirect to success
  if (order.status === OrderStatus.PAID) {
    return NextResponse.redirect(new URL(`/${locale}/success?order=${orderId}`, req.url));
  }

  if (verifyResult.status === "failure") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.FAILED, gatewayRef: verifyResult.gatewayRef ?? order.gatewayRef },
    });
    return NextResponse.redirect(new URL(`/${locale}/checkout`, req.url));
  }

  if (verifyResult.status !== "success") {
    return NextResponse.redirect(new URL(`/${locale}/checkout`, req.url));
  }

  // Atomic: assignKey (FOR UPDATE SKIP LOCKED) + order PAID + audit KEY_REVEALED
  const assignedKey = await prisma.$transaction(async (tx) => {
    const key = await keyService.assignKey(tx, order.productId, orderId);
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        productKeyId: key.id,
        gatewayRef: verifyResult.gatewayRef ?? order.gatewayRef,
      },
    });
    await auditService.log(tx, {
      orderId,
      event: "KEY_REVEALED",
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
    });
    return key;
  });

  // Non-blocking license email
  try {
    const emailTo = order.buyer?.email ?? order.guestEmail;
    if (emailTo) {
      await sendLicenseEmail({
        to: emailTo,
        productName: getLocalizedText(order.product.title, locale, "Product"),
        licenseKey: decryptKey(assignedKey.keyValue),
        orderId,
        locale,
      });
    }
  } catch (emailErr) {
    console.error("Failed to send license email:", emailErr);
  }

  return NextResponse.redirect(new URL(`/${locale}/success?order=${orderId}`, req.url));
}

// Keep POST handler for backward compatibility (some gateways post instead of redirect)
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let payload: Record<string, unknown>;
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const formData = await req.formData();
      payload = Object.fromEntries(formData.entries());
    }

    const config = buildZainCashConfig();
    const provider = getProvider("zaincash");
    const verifyResult = provider.verifyCallback(payload, config);

    if (!verifyResult.valid || !verifyResult.orderId) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const orderId = verifyResult.orderId;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, buyer: { select: { email: true } } },
    });

    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    if (order.status === OrderStatus.PAID) {
      return NextResponse.json({ ok: true, already: "paid" });
    }

    if (verifyResult.status === "failure") {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.FAILED, gatewayRef: verifyResult.gatewayRef ?? order.gatewayRef },
      });
      return NextResponse.json({ ok: true, status: "failed" });
    }

    if (verifyResult.status !== "success") {
      return NextResponse.json({ ok: true, status: "pending" });
    }

    const assignedKey = await prisma.$transaction(async (tx) => {
      const key = await keyService.assignKey(tx, order.productId, orderId);
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID, productKeyId: key.id, gatewayRef: verifyResult.gatewayRef ?? order.gatewayRef },
      });
      await auditService.log(tx, {
        orderId,
        event: "KEY_REVEALED",
        ip: req.headers.get("x-forwarded-for") ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "unknown",
      });
      return key;
    });

    try {
      const emailTo = order.buyer?.email ?? order.guestEmail;
      if (emailTo) {
        await sendLicenseEmail({
          to: emailTo,
          productName: getLocalizedText(order.product.title, order.locale, "Product"),
          licenseKey: decryptKey(assignedKey.keyValue),
          orderId,
          locale: order.locale,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send license email:", emailErr);
    }

    return NextResponse.json({ ok: true, status: "paid" });
  } catch (err) {
    console.error("POST /api/payment/callback error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
