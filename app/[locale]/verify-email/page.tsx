"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";

  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingVerificationEmail");
    if (stored) setEmail(stored);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMessage("Verification email sent. Check your inbox.");
      setCooldown(60);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-grid px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {email ? `We sent a verification link to ${email}` : "We sent you a verification link."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder, or resend the email.
          </p>

          {message && (
            <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">{message}</p>
          )}

          <button
            onClick={handleResend}
            disabled={cooldown > 0 || loading || !email}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? "Sending\u2026" : "Resend verification email"}
          </button>
        </div>
      </div>
    </div>
  );
}
