import { NextRequest, NextResponse } from "next/server";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { orderService } from "@/services/order.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== "SELLER" && user.role !== "ADMIN") {
    return jsonError("Forbidden", 403);
  }

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const result = await orderService.listForUser(user.userId, "seller", page);
  return NextResponse.json(result);
}
