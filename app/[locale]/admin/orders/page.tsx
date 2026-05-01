"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/use-toast";

interface Order {
  id: string;
  guestEmail: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  locale: string;
  product: { name: { en: string; ar: string; tr: string; ku: string } };
}

export default function OrdersPage() {
  const t = useTranslations("admin.orders");
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => toast({ title: "Error", description: "Failed to load orders.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const statusStyle: Record<string, string> = {
    paid: "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20",
    pending: "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20",
    failed: "bg-red-400/10 text-red-400 ring-1 ring-red-400/20",
  };

  const statusLabel: Record<string, string> = {
    paid: t("paid"),
    pending: t("pending"),
    failed: t("failed"),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <div className="rounded-xl border border-border/60 bg-card">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("orderId")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("email")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("product")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("status")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("date")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={order.id} className={`transition-colors hover:bg-secondary/30 ${i !== orders.length - 1 ? "border-b border-border/40" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.id.slice(0, 12)}…</td>
                    <td className="px-4 py-3">{order.guestEmail}</td>
                    <td className="px-4 py-3">{order.product.name.en}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[order.status] ?? ""}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
