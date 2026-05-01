"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

interface Order {
  id: string;
  guestEmail: string;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  locale: string;
  product: { name: { en: string; ar: string; tr: string; ku: string } };
}

export default function OrdersPage() {
  const t = useTranslations("admin.orders");
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then(setOrders)
      .catch(() => toast({ title: "Error", description: "Failed to load orders.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const statusVariant: Record<string, "success" | "warning" | "danger"> = {
    paid: "success",
    pending: "warning",
    failed: "danger",
  };

  const statusLabel: Record<string, string> = {
    paid: t("paid"),
    pending: t("pending"),
    failed: t("failed"),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">{t("noOrders")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orderId")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 12)}...</TableCell>
                    <TableCell>{order.guestEmail}</TableCell>
                    <TableCell>{order.product.name.en}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[order.status] ?? "outline"}>
                        {statusLabel[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
