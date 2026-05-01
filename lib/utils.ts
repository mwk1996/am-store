import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type LocalizedJson = {
  en?: string;
  ar?: string;
  tr?: string;
  ku?: string;
  [key: string]: string | undefined;
};

export function getLocalizedText(
  json: unknown,
  locale: string,
  fallback = ""
): string {
  if (!json || typeof json !== "object") return fallback;
  const obj = json as LocalizedJson;
  return obj[locale] ?? obj["en"] ?? Object.values(obj).find(Boolean) ?? fallback;
}

export function formatPrice(price: number | string, locale: string): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat(locale === "ar" || locale === "ku" ? "ar-IQ" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function isRtl(locale: string): boolean {
  return locale === "ar" || locale === "ku";
}
