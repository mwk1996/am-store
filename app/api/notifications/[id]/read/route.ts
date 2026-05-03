import { NextRequest, NextResponse } from "next/server";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { notificationService } from "@/services/notification.service";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  await notificationService.markRead(params.id, user.userId);
  return NextResponse.json({ success: true });
}
