import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

interface PrivacyPageProps {
  params: { locale: string };
}

export default async function PrivacyPage({ params: { locale } }: PrivacyPageProps) {
  const t = await getTranslations("policies");

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">{t("privacy")}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}: May 1, 2025</p>
        </div>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Data We Collect</h2>
            <p className="mt-2 leading-relaxed">
              We collect only the information necessary to fulfil your order. This includes your email address (required to deliver your license key) and technical metadata such as your IP address and browser type for security and fraud prevention purposes. We do not require account creation and do not collect names unless provided voluntarily via our contact form.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="mt-2 leading-relaxed">
              Your email address is used solely to deliver your purchased license key, send an order confirmation, and respond to support enquiries. We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
            <p className="mt-2 leading-relaxed">
              We may use anonymised, aggregated data to improve our service, understand purchase trends, and enhance the customer experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Cookies</h2>
            <p className="mt-2 leading-relaxed">
              We use strictly necessary cookies to maintain your session during the checkout process. We do not use tracking cookies, advertising cookies, or third-party analytics cookies beyond what is required for the core functionality of the store.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Third Parties</h2>
            <p className="mt-2 leading-relaxed">
              Payment processing is handled by a third-party Iraqi payment gateway. We share only the information required to process your payment (order amount, reference). We do not share your email address with the payment processor. Please review the payment gateway&apos;s own privacy policy for details on their data handling.
            </p>
            <p className="mt-2 leading-relaxed">
              Email delivery is facilitated by a transactional email service provider. Your email address is shared with this provider solely for the purpose of delivering your order confirmation and license key.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Retention</h2>
            <p className="mt-2 leading-relaxed">
              Order records including your email address and assigned license key are retained for a minimum of 12 months to allow for support enquiries and dispute resolution. After this period, data may be anonymised or deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
            <p className="mt-2 leading-relaxed">
              For any privacy-related enquiries or to request deletion of your data, please contact us at{" "}
              <a href="mailto:support@licensestore.iq" className="text-primary hover:underline">
                support@licensestore.iq
              </a>
              . We will respond within 5 business days.
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
