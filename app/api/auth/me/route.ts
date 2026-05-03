import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      createdAt: true,
      // wallet added in Phase 4
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("mp_token");
  return res;
}
