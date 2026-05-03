"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DeliverCredentialsModalProps {
  orderId: string;
  productName: string;
  token: string;
  onDelivered: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliverCredentialsModal({
  orderId,
  productName,
  token,
  onDelivered,
  open,
  onOpenChange,
}: DeliverCredentialsModalProps) {
  const [credentials, setCredentials] = useState("");
  const [delivering, setDelivering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeliver() {
    if (credentials.trim().length < 10) return;
    setDelivering(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/deliver`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credentials: credentials.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Delivery failed. Please try again.");
        return;
      }
      onOpenChange(false);
      onDelivered();
    } catch {
      setError("Delivery failed. Please try again.");
    } finally {
      setDelivering(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deliver Credentials</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">{productName}</p>
        <Textarea
          value={credentials}
          onChange={(e) => setCredentials(e.target.value)}
          placeholder={
            "Enter account credentials exactly as the buyer should receive them.\n\nExample:\nEmail: user@example.com\nPassword: abc123XYZ"
          }
          rows={6}
          className="font-mono text-sm"
        />
        {credentials.trim().length > 0 && credentials.trim().length < 10 && (
          <p className="text-xs text-destructive mt-1">Credentials must be at least 10 characters.</p>
        )}
        {credentials.trim().length >= 10 && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1">Buyer will see:</p>
            <div className="rounded-lg border border-border/40 bg-secondary/40 p-3 text-xs font-mono text-foreground whitespace-pre-wrap">
              {credentials}
            </div>
          </div>
        )}
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={delivering}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeliver}
            disabled={credentials.trim().length < 10 || delivering}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {delivering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                Delivering...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 me-2" />
                Deliver Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
