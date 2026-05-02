import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { authService, TokenPayload } from "@/services/auth.service";
import { prisma } from "@/lib/prisma";

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookie = req.cookies.get("token");
  if (cookie) return cookie.value;
  return null;
}

export function verifyToken(req: NextRequest): TokenPayload | null {
  const token = extractToken(req);
  if (!token) return null;
  try {
    return authService.verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(
  handler: (req: NextRequest, user: TokenPayload, ctx: { params: Record<string, string> }) => Promise<NextResponse>,
  roles?: Role[]
) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, user, ctx);
  };
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function requireEmailVerified(
  handler: (req: NextRequest, user: TokenPayload, ctx: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { emailVerified: true } });
    if (!dbUser?.emailVerified) {
      return NextResponse.json({ error: "Email not verified", redirect: "/verify-email" }, { status: 403 });
    }
    return handler(req, user, ctx);
  };
}

export function requireAdminSession(
  handler: (req: NextRequest, user: TokenPayload, ctx: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, user, ctx);
  };
}
