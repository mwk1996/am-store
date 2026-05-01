"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !order || order.status !== "paid") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{error || "Payment not completed yet."}</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}`}>
                <ArrowLeft className="me-2 h-4 w-4" />
                {t("continueShopping")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("orderDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("orderId")}</span>
                <span className="font-mono text-xs">{order.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("product")}</span>
                <span className="font-medium">
                  {getLocalizedText(order.product.name, locale)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("email")}</span>
                <span>{order.guestEmail}</span>
              </div>
            </div>

            {order.licenseKey && (
              <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-4">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  {t("licenseKey")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-white px-3 py-2 text-center font-mono text-sm font-bold text-emerald-800 shadow-inner">
                    {order.licenseKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyKey}
                    title={copied ? t("copied") : t("copyKey")}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-3 text-center text-xs text-emerald-600">{t("emailSent")}</p>
              </div>
            )}

            <div className="rounded-md bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
              {t("keepSafe")}
            </div>

            <Button asChild className="w-full" variant="outline">
              <Link href={`/${locale}`}>
                <ArrowLeft className="me-2 h-4 w-4" />
                {t("continueShopping")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
