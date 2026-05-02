import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdminSession, jsonError, jsonOk } from "@/lib/auth-middleware";

export const dynamic = "force-dynamic";

export const POST = requireAdminSession(async (req, _user) => {
  const form = await req.formData();
  const file = form.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });

  if (file.size > 4 * 1024 * 1024)
    return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });

  const blob = await put(`products/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url });
});
