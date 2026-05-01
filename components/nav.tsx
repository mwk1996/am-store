import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "next-intl/server";

interface NavProps {
  locale: string;
}

export async function Nav({ locale }: NavProps) {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-bold text-foreground hover:opacity-80"
        >
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{t("store")}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <LocaleSwitcher currentLocale={locale} label={t("language")} />
        </nav>
      </div>
    </header>
  );
}
