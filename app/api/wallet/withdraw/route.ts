import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Wallet implemented in Phase 4
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
