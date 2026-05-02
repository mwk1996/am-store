import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authService } from "@/services/auth.service";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { token } = schema.parse(await req.json());
    await authService.verifyEmail(token);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    const status = message.includes("expired") ? 410 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
