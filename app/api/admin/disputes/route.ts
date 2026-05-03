import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Dispute model is implemented in Phase 5
export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
