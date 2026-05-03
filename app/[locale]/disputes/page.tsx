"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface Dispute {
  id: string;
  reason: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  createdAt: string;
  resolution?: string;
  order: {
    id: string;
    amount: number;
    product: { title: string };
  };
}

const STATUS_STYLES: Record<string, string> = {
  OPEN:     "bg-red-500/10 text-red-400 border-red-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CLOSED:   "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function DisputesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push(`/${locale}/login`); return; }

    fetch("/api/disputes", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.ok) setDisputes(await res.json());
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

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-red-500/10 p-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Disputes</h1>
            <p className="text-sm text-muted-foreground">Manage your order disputes</p>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
            <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No disputes found</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              You can open a dispute from an order page
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm">
            <div className="divide-y divide-border/40">
              {disputes.map((dispute) => (
                <Link
                  key={dispute.id}
                  href={`/${locale}/orders/${dispute.order.id}`}
                  className="flex items-start justify-between p-6 hover:bg-secondary/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[dispute.status]}`}>
                        {dispute.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-foreground">
                      {dispute.order.product.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {dispute.reason}
                    </p>
                    {dispute.resolution && (
                      <div className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                        <strong>Resolution:</strong> {dispute.resolution}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      ${dispute.order.amount.toFixed(2)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
