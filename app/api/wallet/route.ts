import { NextRequest, NextResponse } from "next/server";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { walletService } from "@/services/wallet.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  const balance = await walletService.getBalance(user.userId);
  return NextResponse.json(balance);
}
