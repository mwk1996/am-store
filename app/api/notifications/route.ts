import { NextRequest, NextResponse } from "next/server";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { notificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  const result = await notificationService.getForUser(user.userId, page, limit);
  return NextResponse.json(result);
}
