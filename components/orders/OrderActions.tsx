"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Package, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderStatus = "PENDING" | "PAID" | "DELIVERED" | "COMPLETED" | "DISPUTED" | "REFUNDED";

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  userRole: "buyer" | "seller";
  token: string;
}

export function OrderActions({ orderId, status, userRole, token }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const call = async (action: string) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/orders/${orderId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const callWithBody = async (action: string, body: Record<string, unknown>) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/orders/${orderId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const actions: React.ReactNode[] = [];

  if (userRole === "seller" && status === "PAID") {
    actions.push(
      <Button
        key="deliver"
        onClick={() => call("deliver")}
        disabled={!!loading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {loading === "deliver" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Package className="w-4 h-4 mr-2" />
        )}
        Mark as Delivered
      </Button>
    );
  }

  if (userRole === "buyer" && status === "DELIVERED") {
    actions.push(
      <Button
        key="confirm"
        onClick={() => call("confirm")}
        disabled={!!loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {loading === "confirm" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4 mr-2" />
        )}
        Confirm Receipt & Release Funds
      </Button>,
      <Button
        key="dispute"
        variant="outline"
        onClick={() => {
          const reason = prompt("Please describe the issue:");
          if (reason && reason.length >= 10) {
            callWithBody("dispute", { reason });
          } else if (reason !== null) {
            alert("Please provide a more detailed reason (at least 10 characters).");
          }
        }}
        disabled={!!loading}
        className="border-red-700 text-red-400 hover:bg-red-900/20"
      >
        {loading === "dispute" ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <AlertTriangle className="w-4 h-4 mr-2" />
        )}
        Open Dispute
      </Button>
    );
  }

  if (userRole === "buyer" && status === "PAID") {
    actions.push(
      <Button
        key="dispute-paid"
        variant="outline"
        onClick={() => {
          const reason = prompt("Please describe the issue:");
          if (reason && reason.length >= 10) {
            callWithBody("dispute", { reason });
          } else if (reason !== null) {
            alert("Please provide a more detailed reason (at least 10 characters).");
          }
        }}
        disabled={!!loading}
        className="border-red-700 text-red-400 hover:bg-red-900/20"
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        Open Dispute
      </Button>
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-3 text-sm">Actions</h3>
      <div className="flex flex-wrap gap-3">{actions}</div>
    </div>
  );
}
