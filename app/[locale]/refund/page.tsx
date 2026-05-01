import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

interface RefundPageProps {
  params: { locale: string };
}

export default async function RefundPage({ params: { locale } }: RefundPageProps) {
  const t = await getTranslations("policies");

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">{t("refund")}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}: May 1, 2025</p>
        </div>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. No-Refund Policy for Digital Goods</h2>
            <p className="mt-2 leading-relaxed">
              Due to the digital nature of software license keys, all sales are final once a license key has been delivered. Once a key has been displayed on the confirmation page or sent to your email address, the product has been delivered and the transaction is complete.
            </p>
            <p className="mt-2 leading-relaxed">
              This policy is consistent with consumer protection regulations for digital goods in Iraq and internationally, which recognise that digital content cannot be returned once accessed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Exceptions — When We Will Help</h2>
            <p className="mt-2 leading-relaxed">
              We handle refund and replacement requests on a case-by-case basis in the following circumstances:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-2 text-sm leading-relaxed">
              <li>
                <strong className="text-foreground">Invalid or non-working key:</strong> If the license key you received does not activate the software as described, and you contact us within 7 days of purchase with evidence of the error, we will issue a replacement key or a full refund.
              </li>
              <li>
                <strong className="text-foreground">Duplicate charge:</strong> If you were charged more than once for a single order due to a payment gateway error, we will refund the duplicate charge in full.
              </li>
              <li>
                <strong className="text-foreground">Wrong product delivered:</strong> If the key delivered does not correspond to the product you purchased, we will correct the order immediately.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. How to Request Support</h2>
            <p className="mt-2 leading-relaxed">
              To request a refund or replacement, please contact us at{" "}
              <a href="mailto:support@licensestore.iq" className="text-primary hover:underline">
                support@licensestore.iq
              </a>{" "}
              with the following information:
            </p>
            <ul className="mt-3 list-disc list-inside space-y-2 text-sm leading-relaxed">
              <li>Your order ID (found on your confirmation page or email)</li>
              <li>The email address used at checkout</li>
              <li>A description of the issue, including any error messages or screenshots</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              We aim to respond to all support requests within 24 hours. Approved refunds are processed within 3–5 business days, subject to the payment gateway&apos;s processing timeline.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-secondary/40 px-6 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-white/20 hover:bg-secondary hover:text-foreground cursor-pointer"
          >
            {t("backHome")}
          </Link>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
