"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { UserPlus, Zap } from "lucide-react";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "BUYER", shopName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          ...(form.role === "SELLER" && form.shopName ? { shopName: form.shopName } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }

      // No localStorage — store email in sessionStorage for verify-email page
      sessionStorage.setItem("pendingVerificationEmail", form.email);
      router.push(`/${locale}/verify-email`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join the marketplace today</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="John Doe"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
                <p className="mt-1 text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">I want to…</label>
                <div className="grid grid-cols-2 gap-2">
                  {["BUYER", "SELLER"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("role", r)}
                      className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                        form.role === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {r === "BUYER" ? "Buy Products" : "Sell Products"}
                    </button>
                  ))}
                </div>
              </div>

              {form.role === "SELLER" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={form.shopName}
                    onChange={(e) => set("shopName", e.target.value)}
                    placeholder="my-awesome-shop"
                    pattern="[a-zA-Z0-9_-]+"
                    minLength={2}
                    maxLength={30}
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Letters, numbers, _ and - only. This is your unique store URL.</p>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href={`/${locale}/login`} className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
