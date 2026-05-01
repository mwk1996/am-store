import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

interface TermsPageProps {
  params: { locale: string };
}

export default async function TermsPage({ params: { locale } }: TermsPageProps) {
  const t = await getTranslations("policies");

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="gradient-text">{t("terms")}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}: May 1, 2025</p>
        </div>

        <div className="prose prose-sm prose-invert max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Agreement to Terms</h2>
            <p className="mt-2 leading-relaxed">
              By accessing or using License Store, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service. These terms apply to all visitors, users, and others who access the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. License Usage</h2>
            <p className="mt-2 leading-relaxed">
              Each software license key purchased from this store is valid for the number of devices and users specified by the software publisher. You may not share, resell, or transfer license keys purchased through this platform without express written permission from the original software publisher.
            </p>
            <p className="mt-2 leading-relaxed">
              Licenses are sold for personal or business use as defined by the publisher. Commercial use may require additional licensing — please review the terms of the specific product before purchasing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Restrictions</h2>
            <p className="mt-2 leading-relaxed">
              You agree not to use any license keys for unlawful purposes. You may not attempt to activate a license on more devices than permitted. Circumventing activation or license validation mechanisms is strictly prohibited and may result in permanent deactivation of the license.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Payment</h2>
            <p className="mt-2 leading-relaxed">
              All prices are displayed in Iraqi Dinar (IQD) unless otherwise stated. Payment is processed through our third-party Iraqi payment gateway. We do not store your payment card details. All transactions are subject to the payment gateway&apos;s own terms and conditions.
            </p>
            <p className="mt-2 leading-relaxed">
              Orders are considered final once payment is confirmed and a license key has been issued. In the event of a payment failure, no license key will be issued and any held funds will be released according to the gateway&apos;s policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Delivery</h2>
            <p className="mt-2 leading-relaxed">
              License keys are delivered digitally and instantly upon confirmed payment. The key will be shown on the confirmation page and sent to the email address provided at checkout. We are not responsible for keys lost due to incorrect email addresses provided by the customer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
            <p className="mt-2 leading-relaxed">
              License Store acts as a reseller of software license keys. We are not the original software publisher and are not liable for software defects, compatibility issues, or publisher-side deactivations beyond our control. Our liability is limited to the value of the transaction.
            </p>
            <p className="mt-2 leading-relaxed">
              We make no warranties, express or implied, beyond those explicitly stated in these terms.
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
