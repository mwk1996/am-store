"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

function ResetPasswordForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? "en";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Reset failed. The link may have expired.");
        return;
      }
      router.push(`/${locale}/login?reset=success`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-400">
        Invalid reset link.{" "}
        <Link href={`/${locale}/forgot-password`} className="text-primary hover:underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">New Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input-field"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className="input-field"
        />
      </div>
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Resetting\u2026" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-grid px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading\u2026</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href={`/${locale}/login`} className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
