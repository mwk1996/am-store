import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ChevronDown } from "lucide-react";

interface FaqPageProps {
  params: { locale: string };
}

export default async function FaqPage({ params: { locale } }: FaqPageProps) {
  const t = await getTranslations("faq");
  const tp = await getTranslations("policies");

  const items = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
    { q: t("q6"), a: t("a6") },
    { q: t("q7"), a: t("a7") },
    { q: t("q8"), a: t("a8") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />
        </div>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="gradient-text">{t("title")}</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>
      </section>

      {/* FAQ accordion */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {items.map(({ q, a }, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm open:border-primary/20 open:bg-card/80 transition-all duration-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-semibold text-foreground hover:text-primary transition-colors duration-200 [&::-webkit-details-marker]:hidden">
                <span>{q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-5">
                <p className="text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-secondary/40 px-6 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-white/20 hover:bg-secondary hover:text-foreground cursor-pointer"
          >
            {tp("backHome")}
          </Link>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
