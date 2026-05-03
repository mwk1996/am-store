"use client";

import { useState } from "react";
import { Key, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface KeyRevealBoxProps {
  orderId: string;
  token: string;
  initialKey?: string;
}

export function KeyRevealBox({ orderId, token, initialKey }: KeyRevealBoxProps) {
  const [revealedKey, setRevealedKey] = useState<string | null>(initialKey ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function handleReveal() {
    if (revealedKey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/key`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch key");
      const data = await res.json();
      setRevealedKey(data.key);
    } catch {
      toast({ title: "Failed to reveal key", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Your License Key
      </p>

      {!revealedKey ? (
        <Button onClick={handleReveal} disabled={loading} variant="ghost" className="w-full">
          <Key className="h-4 w-4 me-2" />
          {loading ? "Loading..." : "Reveal License Key"}
        </Button>
      ) : (
        <>
          <div className="relative rounded-lg border border-border/60 bg-secondary/60 px-4 py-3">
            <code className="break-all select-all font-mono text-sm">{revealedKey}</code>
            <button
              onClick={handleCopy}
              className="absolute end-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy key"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            We&apos;ve also sent this key to your email
          </p>
        </>
      )}
    </div>
  );
}
