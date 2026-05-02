"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true); // Always show success — don't reveal if email exists
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-grid px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email to receive a reset link</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
          {submitted ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-foreground">
                If an account with that email exists, a password reset link has been sent.
              </p>
              <p className="text-xs text-muted-foreground">The link expires in 1 hour.</p>
              <Link href={`/${locale}/login`} className="mt-2 block text-sm text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending\u2026" : "Send reset link"}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href={`/${locale}/login`} className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
