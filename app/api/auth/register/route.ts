import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    role: z.nativeEnum(Role).optional(),
    shopName: z
      .string()
      .min(2)
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/, "Shop name: letters, numbers, _ and - only")
      .optional(),
  })
  .refine((data) => data.role !== Role.SELLER || !!data.shopName, {
    message: "Shop name is required for sellers",
    path: ["shopName"],
  });

export async function POST(req: NextRequest) {
  // Rate limiting: 3 per hour per IP (D-11)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`register:${ip}`, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const result = await authService.register(data);
    const res = NextResponse.json({ user: result.user }, { status: 201 });
    res.cookies.set("mp_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    const status =
      message === "Email already registered"
        ? 409
        : message === "Shop name already taken"
          ? 409
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
