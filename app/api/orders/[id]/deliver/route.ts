import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { auditService } from "@/services/audit.service";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const deliverSchema = z.object({
  credentials: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = verifyToken(req);
    if (!user) return jsonError("Unauthorized", 401);

    const body = deliverSchema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        product: { select: { sellerId: true, title: true } },
        buyer: { select: { email: true } },
      },
    });

    if (!order) return jsonError("Order not found", 404);
    if (order.product.sellerId !== user.userId) return jsonError("Forbidden", 403);
    if (order.status !== OrderStatus.PAID) {
      return jsonError("Order is not in PAID status", 400);
    }

    // D-11: seller must deliver within 24h of order creation
    const sellerDeadline = new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (new Date() > sellerDeadline) {
      return NextResponse.json({ error: "Delivery window expired" }, { status: 410 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: new Date(),
          credentials: body.credentials,
          confirmDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // D-08: buyer has 24h to confirm
        },
      });
      await auditService.log(tx, {
        orderId: order.id,
        event: "CREDENTIALS_DELIVERED",
        ip: req.headers.get("x-forwarded-for") ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "unknown",
      });
    });

    // Non-blocking email to buyer
    if (order.buyer?.email) {
      try {
        const { sendDeliveryEmail } = await import("@/lib/email");
        await sendDeliveryEmail(order.buyer.email, order.id, body.credentials);
      } catch (emailErr) {
        console.error("Failed to send delivery email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/orders/[id]/deliver error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
