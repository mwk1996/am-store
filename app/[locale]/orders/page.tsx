"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Zap, Clock } from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getLocalizedText } from "@/lib/utils";
import { KeyRevealBox } from "@/components/purchase/KeyRevealBox";
import { OrderStatusBadge } from "@/components/purchase/OrderStatusBadge";
import { ConfirmReceiptDialog } from "@/components/purchase/ConfirmReceiptDialog";

interface OrderProduct {
  id: string;
  title: unknown;
  imageUrl: string | null;
  deliveryType: "INSTANT" | "MANUAL";
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  locale: string;
  product: OrderProduct;
  productKey: { id: string } | null;
  confirmDeadline: string | null;
  credentials: string | null;
}

export default function OrdersPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";

  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKeyOrder, setExpandedKeyOrder] = useState<string | null>(null);

  useEffect(() => {
    const tok = localStorage.getItem("auth_token");
    if (!tok) { router.push(`/${locale}/login`); return; }
    setToken(tok);
  }, [locale, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setOrders(data.items ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function refetchOrders() {
    if (!token) return;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setOrders(data.items ?? []));
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <section className="relative overflow-hidden px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />
        </div>
        <div className="mx-auto max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="gradient-text">My Orders</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Track your purchases and access your license keys</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 py-20">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No orders yet</p>
            <Link href={`/${locale}`} className="text-sm text-primary hover:underline">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3 pt-4 px-4 text-start font-medium">Product</th>
                    <th className="pb-3 pt-4 px-4 text-start font-medium">Type</th>
                    <th className="pb-3 pt-4 px-4 text-start font-medium">Status</th>
                    <th className="pb-3 pt-4 px-4 text-start font-medium">Date</th>
                    <th className="pb-3 pt-4 px-4 text-start font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {orders.map((order) => {
                    const isInstantPaid = (order.status === "PAID" || order.status === "COMPLETED") && order.product.deliveryType === "INSTANT";
                    const isManualDelivered = order.status === "DELIVERED" && order.product.deliveryType === "MANUAL";
                    const showKey = expandedKeyOrder === order.id;

                    return (
                      <>
                        <tr key={order.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground truncate max-w-[200px]">
                            {getLocalizedText(order.product.title as Record<string, string> | string, locale)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              {order.product.deliveryType === "INSTANT"
                                ? <><Zap className="h-3 w-3 text-accent" /> Instant</>
                                : <><Clock className="h-3 w-3" /> Manual</>}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-4 py-3">
                            {isInstantPaid && (
                              <button
                                onClick={() => setExpandedKeyOrder(showKey ? null : order.id)}
                                className="text-xs text-primary hover:underline"
                              >
                                {showKey ? "Hide Key" : "Reveal Key"}
                              </button>
                            )}
                            {isManualDelivered && (
                              <ConfirmReceiptDialog
                                orderId={order.id}
                                token={token}
                                onConfirmed={refetchOrders}
                                confirmDeadline={order.confirmDeadline}
                              />
                            )}
                            {!isInstantPaid && !isManualDelivered && (
                              <Link
                                href={`/${locale}/orders/${order.id}`}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                View Details
                              </Link>
                            )}
                          </td>
                        </tr>
                        {showKey && isInstantPaid && (
                          <tr key={`${order.id}-key`}>
                            <td colSpan={5} className="px-4 pb-4">
                              <KeyRevealBox orderId={order.id} token={token} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
