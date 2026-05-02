import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth.service";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());
    await authService.resendVerificationEmail(email);
    // Always return 200 — don't reveal if email exists (T-02-04)
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // silent
  }
}
