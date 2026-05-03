"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface ConfirmReceiptDialogProps {
  orderId: string;
  token: string;
  onConfirmed: () => void;
  confirmDeadline?: string | null;
}

export function ConfirmReceiptDialog({ orderId, token, onConfirmed, confirmDeadline }: ConfirmReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();

  const hoursLeft = confirmDeadline
    ? Math.max(0, Math.ceil((new Date(confirmDeadline).getTime() - Date.now()) / 3600000))
    : null;

  async function handleConfirm() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Confirm failed");
      toast({ title: "Receipt confirmed. Order completed." });
      setOpen(false);
      onConfirmed();
    } catch {
      toast({ title: "Failed to confirm receipt. Please try again.", variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Confirm Receipt
        </Button>
        {hoursLeft !== null && (
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-confirms in {hoursLeft}h
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Receipt?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            By confirming, you verify you&apos;ve received the account credentials and the seller will be paid.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={confirming}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {confirming ? "Confirming..." : "Confirm Receipt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
