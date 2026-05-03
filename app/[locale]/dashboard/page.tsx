"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag, TrendingUp, Wallet, Star, Package,
  Plus, ChevronRight, Clock, CheckCircle, AlertTriangle,
} from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

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

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "text-amber-400 bg-amber-500/10",
  PAID:      "text-blue-400 bg-blue-500/10",
  DELIVERED: "text-purple-400 bg-purple-500/10",
  COMPLETED: "text-emerald-400 bg-emerald-500/10",
  DISPUTED:  "text-red-400 bg-red-500/10",
  REFUNDED:  "text-gray-400 bg-gray-500/10",
};

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [role, setRole] = useState<"BUYER" | "SELLER" | "ADMIN">("BUYER");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push(`/${locale}/login`); return; }

    Promise.all([
      fetch("/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/orders?limit=5", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
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
        }
      })
      .finally(() => setLoading(false));
  }, [locale, router]);

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
              href={`/${locale}/products/new`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Product
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
                    <QuickLink href={`/${locale}/products/new`} icon={<Plus className="h-4 w-4" />} label="Add Product" />
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
      </main>

      <Footer locale={locale} />
    </div>
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
