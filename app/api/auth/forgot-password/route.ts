import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth.service";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());
    await authService.sendPasswordResetEmail(email);
  } catch {
    // intentional no-op
  }
  // Always return the same response — don't reveal if email exists (T-02-03, D-09)
  return NextResponse.json({
    success: true,
    message: "If an account with that email exists, a reset link has been sent.",
  });
}
