"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Copy, Check, ArrowLeft, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalizedText } from "@/lib/utils";

interface OrderData {
  id: string;
  guestEmail: string;
  status: string;
  locale: string;
  product: { name: unknown; description: unknown };
  licenseKey: { key: string } | null;
}

interface SuccessPageProps {
  params: { locale: string };
}

export default function SuccessPage({ params: { locale } }: SuccessPageProps) {
  const t = useTranslations("success");
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") ?? "";

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((data: OrderData) => setOrder(data))
      .catch(() => setError("Order not found or payment pending."))
      .finally(() => setLoading(false));
  }, [orderId]);

  function copyKey() {
    if (!order?.licenseKey?.key) return;
    navigator.clipboard.writeText(order.licenseKey.key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-grid">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !order || order.status !== "paid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-grid px-4">
        <div className="w-full max-w-md rounded-xl border border-border/60 bg-card p-8 text-center">
          <p className="text-muted-foreground">{error || "Payment not completed yet."}</p>
          <Button asChild className="mt-6 cursor-pointer">
            <Link href={`/${locale}`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {t("continueShopping")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-grid px-4 py-16 sm:px-6">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/6 blur-3xl" />
      </div>

      <div className="mx-auto max-w-lg animate-fade-in">
        {/* Decorative floating shapes */}
        <div className="pointer-events-none">
          <div className="absolute left-[10%] top-[15%] h-3 w-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 opacity-60 animate-float" />
          <div className="absolute right-[12%] top-[20%] h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-50 animate-float-delay-1" />
          <div className="absolute left-[8%] bottom-[25%] h-2.5 w-2.5 rounded-full bg-gradient-to-r from-accent to-orange-400 opacity-40 animate-float-delay-2" />
          <div className="absolute right-[8%] bottom-[30%] h-2 w-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-45 animate-float-delay-3" />
        </div>

        {/* Success header */}
        <div className="mb-8 text-center">
          {/* Animated ring + icon */}
          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
            {/* Ping ring */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/20" />
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-emerald-500/30 bg-emerald-500/8" />
            {/* Inner solid circle */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-500/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold prose-balanced">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground prose-balanced">{t("subtitle")}</p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-card p-6 space-y-5">
          <h2 className="font-semibold">{t("orderDetails")}</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("orderId")}</span>
              <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("product")}</span>
              <span className="font-medium">{getLocalizedText(order.product.name, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("email")}</span>
              <span>{order.guestEmail}</span>
            </div>
          </div>

          {order.licenseKey && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t("licenseKey")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-xl border border-border/60 bg-secondary/50 px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-foreground">
                  {order.licenseKey.key}
                </code>
                <button
                  onClick={copyKey}
                  title={copied ? t("copied") : t("copyKey")}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-secondary/50 transition-all duration-200 hover:bg-secondary hover:border-primary/30 cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">{t("emailSent")}</p>
            </div>
          )}

          <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-xs text-amber-400/80">
            {t("keepSafe")}
          </div>

          <Button asChild variant="outline" className="w-full border-border/60 cursor-pointer">
            <Link href={`/${locale}`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {t("continueShopping")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
