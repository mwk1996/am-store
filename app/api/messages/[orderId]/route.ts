import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Message model implemented in Phase 3
export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
