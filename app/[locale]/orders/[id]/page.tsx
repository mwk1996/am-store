"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getLocalizedText } from "@/lib/utils";
import { KeyRevealBox } from "@/components/purchase/KeyRevealBox";
import { DeliveryTimeline } from "@/components/purchase/DeliveryTimeline";
import { ConfirmReceiptDialog } from "@/components/purchase/ConfirmReceiptDialog";
import { OrderStatusBadge } from "@/components/purchase/OrderStatusBadge";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

interface OrderDetail {
  id: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  confirmedAt: string | null;
  confirmDeadline: string | null;
  credentials: string | null;
  product: {
    id: string;
    title: unknown;
    imageUrl: string | null;
    deliveryType: "INSTANT" | "MANUAL";
  };
  productKey: { id: string } | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";
  const orderId = params?.id as string;

  const [token, setToken] = useState("");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrder(tok: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (res.ok) setOrder(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    const tok = localStorage.getItem("auth_token");
    if (!tok) { router.push(`/${locale}/login`); return; }
    setToken(tok);
    fetchOrder(tok);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, locale, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Order not found</p>
        <Link href={`/${locale}/orders`} className="text-primary hover:underline">Back to orders</Link>
      </div>
    );
  }

  const isPending = order.status === "PENDING";
  const isInstant = order.product.deliveryType === "INSTANT";
  const showKey = isInstant && (order.status === "PAID" || order.status === "COMPLETED");
  const showTimeline = !isInstant;
  const showConfirm = order.status === "DELIVERED" && !isInstant;
  const productName = getLocalizedText(order.product.title as Record<string, string> | string, locale);

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/orders`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>

        {isPending ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-card/60 p-12 text-center backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-semibold text-foreground">Verifying payment…</p>
            <p className="text-sm text-muted-foreground">This may take a few seconds. Do not close this page.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success header */}
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h1 className="text-2xl font-bold text-foreground">Payment Successful</h1>
              <p className="text-sm text-muted-foreground">Your order has been confirmed.</p>
            </div>

            {/* Status + metadata */}
            <div className="rounded-2xl border border-white/8 bg-card/60 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{productName}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs text-foreground">{order.id.slice(0, 12)}…</span>
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">
                  {new Date(order.createdAt).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Key reveal for INSTANT */}
            {showKey && token && (
              <KeyRevealBox orderId={orderId} token={token} />
            )}

            {/* Delivery timeline for MANUAL */}
            {showTimeline && (
              <div className="rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
                <h2 className="mb-4 text-sm font-semibold text-foreground">Delivery Status</h2>
                <DeliveryTimeline
                  status={order.status}
                  deliveredAt={order.deliveredAt}
                  confirmedAt={order.confirmedAt}
                  credentials={order.credentials}
                />
                {showConfirm && token && (
                  <div className="mt-6">
                    <ConfirmReceiptDialog
                      orderId={orderId}
                      token={token}
                      onConfirmed={() => token && fetchOrder(token)}
                      confirmDeadline={order.confirmDeadline}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
