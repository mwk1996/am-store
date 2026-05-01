import Link from "next/link";
import { Key, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface FooterProps {
  locale: string;
}

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-white/5 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity duration-200 cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30">
                <Key className="h-4 w-4 text-white" />
              </div>
              <span className="gradient-text text-lg font-bold tracking-tight">License Store</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-[220px]">
              {t("tagline")}
            </p>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("follow")}
              </p>
              <div className="flex items-center gap-2">
                {[
                  { label: "Telegram", href: "#" },
                  { label: "Facebook", href: "#" },
                  { label: "Instagram", href: "#" },
                  { label: "X", href: "#" },
                ].map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-secondary/40 text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-primary cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Shop column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("shop")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${locale}`}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {t("products")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}#products`}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {t("categories")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("support")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${locale}/faq`}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/orders`}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {t("trackOrder")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal column */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("legal")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/refund`}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {t("refund")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2025 License Store. {t("copyright")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("madeWith")} <span className="text-red-400">♥</span> in Iraq
          </p>
        </div>
      </div>
    </footer>
  );
}
