import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth.service";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // Rate limiting: 5 attempts per 15 minutes per IP (D-11)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`login:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);
    const result = await authService.login(email, password);
    const res = NextResponse.json({ user: result.user, token: result.token });
    res.cookies.set("mp_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    const status = message.includes("Invalid email or password") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
