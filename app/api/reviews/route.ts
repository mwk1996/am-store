import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { reviewService } from "@/services/review.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const review = await reviewService.create({ ...data, reviewerId: user.userId });
    return NextResponse.json(review, { status: 201 });
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : "Failed to submit review");
  }
}
