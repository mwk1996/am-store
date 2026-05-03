"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "text-amber-400 bg-amber-500/10",
  PAID:      "text-blue-400 bg-blue-500/10",
  DELIVERED: "text-purple-400 bg-purple-500/10",
  COMPLETED: "text-emerald-400 bg-emerald-500/10",
  DISPUTED:  "text-red-400 bg-red-500/10",
  REFUNDED:  "text-gray-400 bg-gray-500/10",
  FAILED:    "text-red-400 bg-red-500/10",
};

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge className={STATUS_COLORS[status] ?? STATUS_COLORS.PENDING}>
      {status}
    </Badge>
  );
}
