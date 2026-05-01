"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Eye, EyeOff, Search } from "lucide-react";

interface OrderProduct {
  name: Record<string, string>;
}

interface LicenseKey {
  key: string;
}

interface Order {
  id: string;
  createdAt: string;
  status: "pending" | "paid" | "failed";
  product: OrderProduct;
  licenseKey: LicenseKey | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function OrdersPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const t = useTranslations("orders");

  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/orders/lookup?email=${encodeURIComponent(email.trim())}`);
      if (res.ok) {
        setOrders(await res.json());
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  function toggleReveal(id: string) {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getProductName(product: OrderProduct): string {
    return product.name[locale] ?? product.name["en"] ?? "Product";
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />
        </div>
        <div className="mx-auto max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="gradient-text">{t("title")}</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-20 sm:px-6 lg:px-8">
        {/* Email lookup form */}
        <form
          onSubmit={handleLookup}
          className="mb-8 rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm"
        >
          <div className="space-y-3">
            <label htmlFor="order-email" className="block text-sm font-medium text-foreground">
              {t("email")}
            </label>
            <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
            <div className="flex gap-3">
              <input
                id="order-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="h-10 flex-1 rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                {loading ? t("looking") : t("lookup")}
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        {searched && (
          orders.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border/60">
              <p className="text-muted-foreground">{t("noOrders")}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("orderId")}</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("product")}</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("status")}</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("date")}</th>
                      <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground">{t("licenseKey")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => (
                      <tr
                        key={order.id}
                        className={`transition-colors hover:bg-secondary/20 ${i !== orders.length - 1 ? "border-b border-border/40" : ""}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {order.id.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {getProductName(order.product)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] ?? ""}`}>
                            {t(order.status as "pending" | "paid" | "failed")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {order.licenseKey ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-xs transition-all duration-200 ${revealedKeys.has(order.id) ? "text-foreground" : "blur-sm select-none text-foreground"}`}>
                                {order.licenseKey.key}
                              </span>
                              <button
                                onClick={() => toggleReveal(order.id)}
                                className="shrink-0 rounded p-1 text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                                title={t("viewKey")}
                              >
                                {revealedKeys.has(order.id) ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
