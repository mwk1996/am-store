"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { EscrowTimeline } from "@/components/orders/EscrowTimeline";
import { OrderActions } from "@/components/orders/OrderActions";
import { ChatWindow } from "@/components/chat/ChatWindow";
import {
  ArrowLeft, Package, Copy, Check, ExternalLink,
} from "lucide-react";

type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "COMPLETED" | "DISPUTED" | "REFUNDED";

interface OrderDetail {
  id: string;
  status: OrderStatus;
  amount: number;
  commission: number;
  createdAt: string;
  escrowReleasedAt?: string;
  product: {
    id: string;
    title: string;
    type: string;
    images: string[];
  };
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string; email: string };
  assignedKey?: { keyValue: string };
  dispute?: { id: string; status: string; reason: string; resolution?: string };
  review?: { rating: number; comment: string };
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchOrder() {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push(`/${locale}/login`); return; }
    setAuthToken(token);

    const [orderRes, meRes] = await Promise.all([
      fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (orderRes.ok) setOrder(await orderRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setCurrentUserId(me.id);
    }
    setLoading(false);
  }

  useEffect(() => { fetchOrder(); }, [orderId]);

  function copyKey() {
    if (!order?.assignedKey?.keyValue) return;
    navigator.clipboard.writeText(order.assignedKey.keyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

  const isBuyer = currentUserId === order.buyer.id;
  const isSeller = currentUserId === order.seller.id;

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href={`/${locale}/orders`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order #{order.id.slice(0, 8)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="text-2xl font-bold text-foreground">${order.amount.toFixed(2)}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Escrow Timeline */}
            <EscrowTimeline status={order.status} createdAt={order.createdAt} escrowReleasedAt={order.escrowReleasedAt} />

            {/* Product Info */}
            <div className="rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold text-foreground">Product</h2>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary/50">
                  {order.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.product.images[0]} alt="" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <Package className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{order.product.title}</p>
                  <p className="text-sm text-muted-foreground">{order.product.type.replace("_", " ")}</p>
                </div>
                <Link
                  href={`/${locale}/products/${order.product.id}`}
                  className="ml-auto text-primary hover:text-primary/80 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Product Key — shown after delivery */}
            {order.assignedKey && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <h2 className="mb-3 font-semibold text-emerald-400">Activation Key</h2>
                <div className="flex items-center gap-3 rounded-lg bg-background/50 px-4 py-3">
                  <code className="flex-1 font-mono text-sm text-foreground break-all">
                    {order.assignedKey.keyValue}
                  </code>
                  <button
                    onClick={copyKey}
                    className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Dispute info */}
            {order.dispute && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="mb-2 font-semibold text-red-400">
                  Dispute — {order.dispute.status}
                </h2>
                <p className="text-sm text-muted-foreground">{order.dispute.reason}</p>
                {order.dispute.resolution && (
                  <div className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                    <strong>Resolution:</strong> {order.dispute.resolution}
                  </div>
                )}
              </div>
            )}

            {/* Review */}
            {order.review && (
              <div className="rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
                <h2 className="mb-3 font-semibold text-foreground">Review Left</h2>
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-lg ${i < order.review!.rating ? "text-amber-400" : "text-muted-foreground/30"}`}>★</span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{order.review.comment}</p>
              </div>
            )}

            {/* Chat */}
            <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="border-b border-border/60 px-6 py-4">
                <h2 className="font-semibold text-foreground">Messages</h2>
              </div>
              {order && authToken && (
                <ChatWindow
                  orderId={orderId}
                  currentUserId={currentUserId ?? ""}
                  receiverId={currentUserId === order.buyer.id ? order.seller.id : order.buyer.id}
                  token={authToken}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            {authToken && (
              <OrderActions
                orderId={order.id}
                status={order.status}
                userRole={isBuyer ? "buyer" : "seller"}
                token={authToken}
              />
            )}

            {/* Order Summary */}
            <div className="rounded-2xl border border-white/8 bg-card/60 p-5 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold text-foreground">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product</span>
                  <span className="text-foreground">${order.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="text-foreground">${order.commission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2 font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">${order.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="rounded-2xl border border-white/8 bg-card/60 p-5 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold text-foreground">Parties</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Buyer</p>
                  <p className="font-medium text-foreground">{order.buyer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seller</p>
                  <p className="font-medium text-foreground">{order.seller.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
