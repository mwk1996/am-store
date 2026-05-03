import { NextRequest, NextResponse } from "next/server";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { orderService } from "@/services/order.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  const order = await orderService.getByIdForUser(params.id, user.userId);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  return NextResponse.json(order);
}
