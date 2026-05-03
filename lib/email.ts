import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendLicenseEmailParams {
  to: string;
  productName: string;
  licenseKey: string;
  orderId: string;
  locale?: string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    subject: "Your License Key",
    greeting: "Thank you for your purchase!",
    body: "Here is your license key for",
    keyLabel: "License Key:",
    keepSafe: "Please keep this key safe. It cannot be recovered if lost.",
    orderId: "Order ID:",
    support: "If you have any questions, please contact our support.",
  },
  ar: {
    subject: "مفتاح الترخيص الخاص بك",
    greeting: "شكراً لشرائك!",
    body: "إليك مفتاح الترخيص الخاص بك لـ",
    keyLabel: "مفتاح الترخيص:",
    keepSafe: "يرجى الحفاظ على هذا المفتاح بأمان. لا يمكن استرداده في حال فقدانه.",
    orderId: "رقم الطلب:",
    support: "إذا كان لديك أي أسئلة، يرجى التواصل مع فريق الدعم.",
  },
  tr: {
    subject: "Lisans Anahtarınız",
    greeting: "Satın alımınız için teşekkürler!",
    body: "İşte ürününüz için lisans anahtarınız:",
    keyLabel: "Lisans Anahtarı:",
    keepSafe: "Bu anahtarı güvende tutun. Kaybolursa kurtarılamaz.",
    orderId: "Sipariş No:",
    support: "Sorularınız için lütfen destek ekibimizle iletişime geçin.",
  },
  ku: {
    subject: "کلیلی مۆڵەتەکەت",
    greeting: "سوپاس بۆ کڕینەکەت!",
    body: "ئەمەش کلیلی مۆڵەتەکەتە بۆ",
    keyLabel: "کلیلی مۆڵەت:",
    keepSafe: "تکایە ئەم کلیلە بە پارێزراوی بەڕێوەبە. ئەگەر وەرباچێت ناتوانرێت دەستبکەوتەوە.",
    orderId: "ناسنامەی داواکاری:",
    support: "ئەگەر پرسیارت هەیە، تکایە پەیوەندی بە تیمی پشتگیریمان بکە.",
  },
};

export async function sendLicenseEmail({
  to,
  productName,
  licenseKey,
  orderId,
  locale = "en",
}: SendLicenseEmailParams): Promise<void> {
  const t = translations[locale] ?? translations["en"];
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@example.com";

  const html = `
<!DOCTYPE html>
<html lang="${locale}" dir="${locale === "ar" || locale === "ku" ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${t.subject}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #18181b; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .body { padding: 32px; }
    .key-box { background: #f4f4f5; border: 2px dashed #a1a1aa; border-radius: 6px; padding: 20px; text-align: center; margin: 24px 0; }
    .key-box code { font-family: monospace; font-size: 18px; font-weight: bold; color: #18181b; word-break: break-all; }
    .meta { color: #71717a; font-size: 14px; margin-top: 8px; }
    .warning { background: #fef9c3; border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #854d0e; }
    .footer { padding: 24px 32px; border-top: 1px solid #e4e4e7; color: #71717a; font-size: 13px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${t.subject}</h1>
    </div>
    <div class="body">
      <p>${t.greeting}</p>
      <p>${t.body} <strong>${productName}</strong>:</p>
      <div class="key-box">
        <p style="margin:0 0 8px;font-weight:bold;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${t.keyLabel}</p>
        <code>${licenseKey}</code>
      </div>
      <p class="meta">${t.orderId} <code>${orderId}</code></p>
      <div class="warning">
        ${t.keepSafe}
      </div>
    </div>
    <div class="footer">
      <p>${t.support}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `${t.subject} — ${productName}`,
    html,
  });
}

export async function sendDeliveryEmail(
  to: string,
  orderId: string,
  credentials: string
): Promise<void> {
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@example.com";
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Your order #${orderId} has been delivered`,
    html: `<p>The seller has posted your game account credentials:</p><pre style="background:#f4f4f5;padding:16px;border-radius:6px;">${credentials}</pre><p>Please confirm receipt within 24 hours.</p>`,
    text: `The seller has posted your game account credentials:\n\n${credentials}\n\nPlease confirm receipt within 24 hours.`,
  });
}
