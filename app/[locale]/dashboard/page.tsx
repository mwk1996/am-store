"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, TrendingUp, Wallet, Star, Package,
  Plus, ChevronRight, Clock, CheckCircle, AlertTriangle,
  Info, X, Pencil, ToggleLeft, List, Send,
} from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getLocalizedText, cn } from "@/lib/utils";
import { DeliverCredentialsModal } from "@/components/dashboard/deliver-credentials-modal";

interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  walletBalance: number;
  pendingBalance: number;
  totalProducts?: number;
  totalEarnings?: number;
  averageRating?: number;
}

interface RecentOrder {
  id: string;
  createdAt: string;
  status: string;
  amount: number;
  product: { title: string; type: string };
}

interface SellerOrder {
  id: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  confirmDeadline: string | null;
  product: { id: string; title: unknown; deliveryType: "INSTANT" | "MANUAL" };
  buyer?: { email: string } | null;
}

interface Listing {
  id: string;
  title: unknown;
  imageUrl?: string | null;
  category?: { name?: string } | null;
  platform?: string | null;
  deliveryType?: string;
  status: string;
  availableKeys?: number;
  price: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "text-amber-400 bg-amber-500/10",
  PAID:      "text-blue-400 bg-blue-500/10",
  DELIVERED: "text-purple-400 bg-purple-500/10",
  COMPLETED: "text-emerald-400 bg-emerald-500/10",
  DISPUTED:  "text-red-400 bg-red-500/10",
  REFUNDED:  "text-gray-400 bg-gray-500/10",
};

type ActiveTab = "overview" | "listings" | "orders";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [role, setRole] = useState<"BUYER" | "SELLER" | "ADMIN">("BUYER");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Seller-specific state
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [token, setToken] = useState<string>("");

  // Seller orders tab state
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [sellerOrdersLoading, setSellerOrdersLoading] = useState(false);
  const [deliverModalOrderId, setDeliverModalOrderId] = useState<string | null>(null);
  const [deliverModalProductName, setDeliverModalProductName] = useState<string>("");

  const fetchListings = async (tok: string) => {
    const res = await fetch(`/api/products?sellerId=me&limit=100`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (res.ok) {
      const data = await res.json();
      const all: Listing[] = [...(data.featured ?? []), ...(data.products ?? [])];
      setListings(all);
      setActiveCount(all.filter((p) => p.status === "ACTIVE").length);
    }
  };

  useEffect(() => {
    const tok = localStorage.getItem("auth_token");
    if (!tok) { router.push(`/${locale}/login`); return; }
    setToken(tok);

    Promise.all([
      fetch("/api/dashboard/stats", { headers: { Authorization: `Bearer ${tok}` } }),
      fetch("/api/orders?limit=5", { headers: { Authorization: `Bearer ${tok}` } }),
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${tok}` } }),
    ])
      .then(async ([statsRes, ordersRes, meRes]) => {
        if (statsRes.ok) setStats(await statsRes.json());
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders ?? data);
        }
        if (meRes.ok) {
          const me = await meRes.json();
          setRole(me.role);
          if (me.role === "SELLER") {
            await fetchListings(tok);
            setBannerDismissed(localStorage.getItem("sec04_banner_dismissed") === "true");
            setSellerOrdersLoading(true);
            fetch("/api/orders?role=seller&limit=100", { headers: { Authorization: `Bearer ${tok}` } })
              .then(r => r.json())
              .then(data => { setSellerOrders(data.items ?? []); })
              .finally(() => setSellerOrdersLoading(false));
          }
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Deactivate this listing?")) return;
    await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchListings(token);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "SELLER" ? "Manage your listings and earnings" : "Track your purchases and wallet"}
            </p>
          </div>
          {role === "SELLER" && (
            <Link
              href={activeCount >= 10 ? "#" : `/${locale}/dashboard/listings/new`}
              className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors
                ${activeCount >= 10 ? "cursor-not-allowed opacity-50 pointer-events-none" : "hover:bg-primary/90"}`}
              title={activeCount >= 10 ? "Complete your first sale to unlock unlimited listings" : undefined}
            >
              <Plus className="h-4 w-4" /> Add Listing
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ShoppingBag className="h-5 w-5 text-blue-400" />}
            label="Total Orders"
            value={stats?.totalOrders ?? 0}
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
            label="Completed"
            value={stats?.completedOrders ?? 0}
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5 text-purple-400" />}
            label="Wallet Balance"
            value={`$${(stats?.walletBalance ?? 0).toFixed(2)}`}
            bg="bg-purple-500/10"
            sub={stats?.pendingBalance ? `$${stats.pendingBalance.toFixed(2)} pending` : undefined}
          />
          {role === "SELLER" ? (
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
              label="Total Earnings"
              value={`$${(stats?.totalEarnings ?? 0).toFixed(2)}`}
              bg="bg-amber-500/10"
            />
          ) : (
            <StatCard
              icon={<Clock className="h-5 w-5 text-amber-400" />}
              label="Pending Orders"
              value={stats?.pendingOrders ?? 0}
              bg="bg-amber-500/10"
            />
          )}
        </div>

        {/* Tabs (Seller only) */}
        {role === "SELLER" && (
          <div className="mb-6 flex gap-1 rounded-xl border border-white/8 bg-card/40 p-1 backdrop-blur-sm w-fit">
            {(["overview", "listings", "orders"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors capitalize
                  ${activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "listings" ? (
                  <span className="flex items-center gap-1.5">
                    <List className="h-3.5 w-3.5" />
                    Listings
                    <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                      {activeCount}/10
                    </span>
                  </span>
                ) : tab === "overview" ? "Overview" : (
                <span className="flex items-center gap-1">
                  Orders
                  {(() => {
                    const count = sellerOrders.filter(o => o.status === "PAID" && o.product.deliveryType === "MANUAL").length;
                    return count > 0 ? (
                      <span className="ms-1 rounded-full bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5">{count}</span>
                    ) : null;
                  })()}
                </span>
              )}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        {(role !== "SELLER" || activeTab === "overview") && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Orders */}
            <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <h2 className="font-semibold text-foreground">Recent Orders</h2>
                <Link
                  href={`/${locale}/orders`}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-border/40">
                {orders.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No orders yet
                  </div>
                ) : (
                  orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/${locale}/orders/${order.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-secondary/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {order.product.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                          {order.status}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          ${order.amount.toFixed(2)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm p-6">
                <h2 className="mb-4 font-semibold text-foreground">Quick Actions</h2>
                <div className="space-y-2">
                  <QuickLink href={`/${locale}/wallet`} icon={<Wallet className="h-4 w-4" />} label="My Wallet" />
                  <QuickLink href={`/${locale}/orders`} icon={<ShoppingBag className="h-4 w-4" />} label="My Orders" />
                  <QuickLink href={`/${locale}/disputes`} icon={<AlertTriangle className="h-4 w-4" />} label="Disputes" />
                  {role === "SELLER" && (
                    <>
                      <QuickLink href={`/${locale}/dashboard/listings/new`} icon={<Plus className="h-4 w-4" />} label="Add Listing" />
                      <QuickLink href={`/${locale}/marketplace?seller=me`} icon={<Package className="h-4 w-4" />} label="My Listings" />
                    </>
                  )}
                  {role === "BUYER" && (
                    <QuickLink href={`/${locale}/marketplace`} icon={<Package className="h-4 w-4" />} label="Browse Marketplace" />
                  )}
                </div>
              </div>

              {role === "SELLER" && stats?.averageRating !== undefined && (
                <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm p-6">
                  <h2 className="mb-2 font-semibold text-foreground">Seller Rating</h2>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="text-2xl font-bold text-foreground">
                      {stats.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {role === "SELLER" && activeTab === "listings" && (
          <div>
            {/* SEC-04 Earnings Hold Banner */}
            {stats?.completedOrders === 0 && !bannerDismissed && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-300 flex-1">
                  Your first earnings are held for 7 days before they&apos;re available for withdrawal.
                </p>
                <button
                  onClick={() => {
                    localStorage.setItem("sec04_banner_dismissed", "true");
                    setBannerDismissed(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-foreground">My Listings</h2>
                <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {activeCount}/{activeCount >= 10 ? "10 (cap)" : "10"} listings
                </span>
              </div>
              <Link
                href={activeCount >= 10 ? "#" : `/${locale}/dashboard/listings/new`}
                className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors
                  ${activeCount >= 10 ? "cursor-not-allowed opacity-50 pointer-events-none" : "hover:bg-primary/90"}`}
                title={activeCount >= 10 ? "Complete your first sale to unlock unlimited listings" : undefined}
              >
                <Plus className="h-4 w-4" /> Add Listing
              </Link>
            </div>

            {/* Listings Table */}
            <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 pt-4 px-4 text-left font-medium">Product</th>
                      <th className="pb-3 pt-4 px-4 text-left font-medium">Category</th>
                      <th className="pb-3 pt-4 px-4 text-left font-medium">Stock</th>
                      <th className="pb-3 pt-4 px-4 text-left font-medium">Status</th>
                      <th className="pb-3 pt-4 px-4 text-left font-medium">Price</th>
                      <th className="pb-3 pt-4 px-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {listings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          No listings yet.{" "}
                          <Link href={`/${locale}/dashboard/listings/new`} className="text-primary hover:underline">
                            Add your first listing
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      listings.map((product) => (
                        <ListingRow
                          key={product.id}
                          product={product}
                          locale={locale}
                          token={token}
                          onDelete={handleDeleteListing}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {role === "SELLER" && activeTab === "orders" && (
          <div>
            <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                <h2 className="font-semibold text-foreground">Seller Orders</h2>
              </div>
              {sellerOrdersLoading ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading...</div>
              ) : sellerOrders.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">No orders yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="pb-3 pt-4 px-4 text-start font-medium">Buyer</th>
                        <th className="pb-3 pt-4 px-4 text-start font-medium">Product</th>
                        <th className="pb-3 pt-4 px-4 text-start font-medium">Type</th>
                        <th className="pb-3 pt-4 px-4 text-start font-medium">Status</th>
                        <th className="pb-3 pt-4 px-4 text-start font-medium">Date</th>
                        <th className="pb-3 pt-4 px-4 text-start font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {sellerOrders.map((order) => {
                        const isPaidManual = order.status === "PAID" && order.product.deliveryType === "MANUAL";
                        const hoursLeft = order.confirmDeadline
                          ? Math.ceil((new Date(order.confirmDeadline).getTime() - Date.now()) / 3600000)
                          : null;
                        const urgent = hoursLeft !== null && hoursLeft <= 4;
                        return (
                          <tr
                            key={order.id}
                            className={cn(
                              "hover:bg-secondary/10 transition-colors",
                              isPaidManual && "border-s-2 border-amber-400/60 bg-amber-500/5"
                            )}
                          >
                            <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[120px]">
                              {order.buyer?.email ?? "—"}
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground truncate max-w-[160px]">
                              {getLocalizedText(order.product.title as Record<string, string> | string, locale)}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {order.product.deliveryType}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? ""}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              {isPaidManual && (
                                <button
                                  onClick={() => {
                                    setDeliverModalOrderId(order.id);
                                    setDeliverModalProductName(
                                      getLocalizedText(order.product.title as Record<string, string> | string, locale)
                                    );
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Deliver
                                </button>
                              )}
                              {order.status === "DELIVERED" && hoursLeft !== null && (
                                <span className={cn("flex items-center gap-1 text-xs", urgent ? "text-amber-400" : "text-muted-foreground")}>
                                  <Clock className="h-3 w-3" />
                                  Auto-confirms in {hoursLeft}h
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {deliverModalOrderId && (
              <DeliverCredentialsModal
                orderId={deliverModalOrderId}
                productName={deliverModalProductName}
                token={token}
                open={!!deliverModalOrderId}
                onOpenChange={(open) => { if (!open) setDeliverModalOrderId(null); }}
                onDelivered={() => {
                  setDeliverModalOrderId(null);
                  fetch("/api/orders?role=seller&limit=100", { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => r.json())
                    .then(data => setSellerOrders(data.items ?? []));
                }}
              />
            )}
          </div>
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}

function ListingRow({
  product, locale, token, onDelete,
}: {
  product: Listing;
  locale: string;
  token: string;
  onDelete: (id: string) => void;
}) {
  const title = getLocalizedText(product.title as Record<string, string> | string, locale);
  const stock = product.availableKeys ?? 0;
  const stockColor = stock === 0
    ? "text-red-400 bg-red-500/10"
    : stock <= 5
    ? "text-amber-400 bg-amber-500/10"
    : "text-emerald-400 bg-emerald-500/10";

  return (
    <tr className="hover:bg-secondary/10 transition-colors">
      {/* Product thumbnail + title */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-800 overflow-hidden">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
          </div>
          <Link
            href={`/${locale}/dashboard/listings/${product.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[160px]"
          >
            {title}
          </Link>
        </div>
      </td>
      {/* Category */}
      <td className="px-4 py-3 text-muted-foreground">
        {product.category?.name ?? "—"}
      </td>
      {/* Stock */}
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stockColor}`}>
          {stock} keys
        </span>
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium
          ${product.status === "ACTIVE"
            ? "text-emerald-400 bg-emerald-500/10"
            : "text-gray-400 bg-gray-500/10"}`}
        >
          {product.status}
        </span>
      </td>
      {/* Price */}
      <td className="px-4 py-3 font-medium text-foreground">
        ${Number(product.price).toFixed(2)}
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Link
            href={`/${locale}/dashboard/listings/${product.id}/edit`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title="Edit listing"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onDelete(product.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Deactivate listing"
          >
            <ToggleLeft className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatCard({
  icon, label, value, bg, sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-card/60 p-5 backdrop-blur-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${bg}`}>{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-amber-400">{sub}</div>}
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
    >
      {icon}
      {label}
      <ChevronRight className="ml-auto h-3.5 w-3.5" />
    </Link>
  );
}
