import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = contactSchema.parse(body);

    const adminEmail = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM ?? "support@example.com";
    const fromEmail = process.env.EMAIL_FROM ?? "noreply@example.com";

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      reply_to: email,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <div style="background:#18181b;padding:24px 32px;">
            <h2 style="color:#fff;margin:0;font-size:20px;">New Contact Message</h2>
          </div>
          <div style="padding:32px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#71717a;width:80px;">From:</td><td style="padding:6px 0;font-weight:bold;">${name}</td></tr>
              <tr><td style="padding:6px 0;color:#71717a;">Email:</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#3b82f6;">${email}</a></td></tr>
              <tr><td style="padding:6px 0;color:#71717a;">Subject:</td><td style="padding:6px 0;">${subject}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0;" />
            <p style="margin:0;white-space:pre-wrap;color:#18181b;line-height:1.6;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("POST /api/contact:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
