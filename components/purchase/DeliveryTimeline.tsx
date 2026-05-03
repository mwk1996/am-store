"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DeliveryTimelineProps {
  status: string;
  deliveredAt?: string | null;
  confirmedAt?: string | null;
  credentials?: string | null;
}

export function DeliveryTimeline({ status, deliveredAt, confirmedAt, credentials }: DeliveryTimelineProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const isDelivered = ["DELIVERED", "COMPLETED"].includes(status);
  const isCompleted = status === "COMPLETED";

  async function handleCopy() {
    if (!credentials) return;
    await navigator.clipboard.writeText(credentials);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-1">
      {/* Step 1 */}
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
        <span className="text-sm text-foreground">Order Placed</span>
      </div>
      <div className="w-px h-8 bg-border/60 ms-2" />

      {/* Step 2 */}
      <div className="flex items-start gap-3">
        {isDelivered ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
        ) : (
          <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
        )}
        <div className="flex-1">
          <span className="text-sm text-foreground">
            {isDelivered ? "Delivered" : "Awaiting Delivery"}
          </span>
          {deliveredAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(deliveredAt).toLocaleString()}
            </p>
          )}
          {status === "DELIVERED" && credentials && (
            <div className="mt-3 relative rounded-lg border border-border/60 bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground mb-1.5">Account Credentials</p>
              <pre className="font-mono text-xs text-foreground whitespace-pre-wrap break-all">{credentials}</pre>
              <button
                onClick={handleCopy}
                className="absolute end-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Copy credentials"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="w-px h-8 bg-border/60 ms-2" />

      {/* Step 3 */}
      <div className="flex items-start gap-3">
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
        ) : (
          <div className="h-4 w-4 shrink-0 mt-0.5 rounded-full border border-border/60" />
        )}
        <div>
          <span className="text-sm text-foreground">Receipt Confirmed</span>
          {confirmedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(confirmedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
