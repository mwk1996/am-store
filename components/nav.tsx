import Link from "next/link";
import { Key } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "next-intl/server";

interface NavProps {
  locale: string;
}

export async function Nav({ locale }: NavProps) {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/70 backdrop-blur-2xl shadow-lg shadow-black/20">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity duration-200 cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30">
            <Key className="h-4 w-4 text-white" />
          </div>
          <span className="gradient-text text-lg font-bold tracking-tight">{t("store")}</span>
        </Link>

        {/* Center nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            {t("home")}
          </Link>
          <Link
            href={`/${locale}#products`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            {t("products")}
          </Link>
          <Link
            href={`/${locale}/faq`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            {t("faq")}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
          >
            {t("contact")}
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/orders`}
            className="hidden sm:inline-flex items-center rounded-lg border border-white/10 bg-secondary/40 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-white/20 hover:bg-secondary hover:text-foreground cursor-pointer"
          >
            {t("myOrders")}
          </Link>
          <div className="rounded-lg border border-white/8 bg-secondary/40 px-1 py-0.5 backdrop-blur-sm">
            <LocaleSwitcher currentLocale={locale} label={t("language")} />
          </div>
        </div>
      </div>
    </header>
  );
}
