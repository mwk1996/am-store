"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import {
  ArrowDownCircle, ArrowUpCircle, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "CREDIT" | "DEBIT" | "ESCROW_HOLD" | "ESCROW_RELEASE" | "WITHDRAWAL";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
  order?: { id: string };
}

interface WalletData {
  balance: number;
  pendingBalance: number;
}

const TX_LABELS: Record<string, string> = {
  CREDIT:          "Funds Added",
  DEBIT:           "Funds Deducted",
  ESCROW_HOLD:     "Escrow Hold",
  ESCROW_RELEASE:  "Escrow Released",
  WITHDRAWAL:      "Withdrawal",
};

const TX_COLORS: Record<string, string> = {
  CREDIT:          "text-emerald-400",
  DEBIT:           "text-red-400",
  ESCROW_HOLD:     "text-amber-400",
  ESCROW_RELEASE:  "text-emerald-400",
  WITHDRAWAL:      "text-red-400",
};

export default function WalletPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push(`/${locale}/login`); return; }

    setLoading(true);
    Promise.all([
      fetch("/api/wallet", { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/wallet/transactions?page=${page}&limit=${limit}`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([wRes, tRes]) => {
        if (wRes.ok) setWallet(await wRes.json());
        if (tRes.ok) {
          const data = await tRes.json();
          setTransactions(data.transactions ?? data);
          setTotal(data.total ?? data.length);
        }
      })
      .finally(() => setLoading(false));
  }, [locale, router, page]);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    setWithdrawing(true);
    setWithdrawMsg("");
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawMsg("Withdrawal request submitted successfully.");
        setWithdrawAmount("");
      } else {
        setWithdrawMsg(data.error ?? "Failed to submit withdrawal.");
      }
    } finally {
      setWithdrawing(false);
    }
  }

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
        <h1 className="mb-6 text-3xl font-bold text-foreground">My Wallet</h1>

        {wallet && (
          <BalanceCard balance={wallet.balance} pendingBalance={wallet.pendingBalance} />
        )}

        {/* Withdraw */}
        <div className="mt-6 rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
          <h2 className="mb-4 font-semibold text-foreground">Request Withdrawal</h2>
          <form onSubmit={handleWithdraw} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-muted-foreground">Amount (USD)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={withdrawing}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {withdrawing ? "Submitting…" : "Withdraw"}
            </button>
          </form>
          {withdrawMsg && (
            <p className={`mt-3 text-sm ${withdrawMsg.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
              {withdrawMsg}
            </p>
          )}
        </div>

        {/* Transactions */}
        <div className="mt-6 rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-semibold text-foreground">Transaction History</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <>
              <div className="divide-y divide-border/40">
                {transactions.map((tx) => {
                  const isPositive = ["CREDIT", "ESCROW_RELEASE"].includes(tx.type);
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${isPositive ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                          {isPositive
                            ? <ArrowDownCircle className="h-4 w-4 text-emerald-400" />
                            : <ArrowUpCircle className="h-4 w-4 text-red-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {TX_LABELS[tx.type] ?? tx.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${TX_COLORS[tx.type]}`}>
                          {isPositive ? "+" : "-"}${tx.amount.toFixed(2)}
                        </p>
                        {tx.status === "PENDING" && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 px-6 py-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
