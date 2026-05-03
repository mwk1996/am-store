import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "@/services/review.service";
import { jsonError } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 20);

  try {
    const result = await reviewService.getForSeller(params.id, page, limit);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : "Failed to fetch reviews");
  }
}
