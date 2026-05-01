import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Key, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const t = await getTranslations("admin");

  const [totalOrders, paidOrders, availableKeys] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.licenseKey.count({ where: { orderId: null } }),
  ]);

  const paidOrdersWithProducts = await prisma.order.findMany({
    where: { status: "paid" },
    include: { product: { select: { price: true } } },
  });

  const totalRevenue = paidOrdersWithProducts.reduce(
    (sum, order) => sum + Number(order.product.price),
    0
  );

  const stats = [
    {
      label: t("stats.totalOrders"),
      value: totalOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: t("stats.paidOrders"),
      value: paidOrders,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: t("stats.totalRevenue"),
      value: `${totalRevenue.toLocaleString()} IQD`,
      icon: DollarSign,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: t("stats.availableKeys"),
      value: availableKeys,
      icon: Key,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  });

  const tOrders = await getTranslations("admin.orders");

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">{t("dashboard")}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tOrders("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tOrders("noOrders")}</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{order.guestEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {(order.product.name as Record<string, string>)["en"] ?? "Product"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          order.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
