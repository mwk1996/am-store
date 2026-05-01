import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
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
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      ring: "ring-blue-400/20",
      glow: "shadow-blue-500/10",
    },
    {
      label: t("stats.paidOrders"),
      value: paidOrders,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      ring: "ring-emerald-400/20",
      glow: "shadow-emerald-500/10",
    },
    {
      label: t("stats.totalRevenue"),
      value: `${totalRevenue.toLocaleString()} IQD`,
      icon: DollarSign,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      ring: "ring-violet-400/20",
      glow: "shadow-violet-500/10",
    },
    {
      label: t("stats.availableKeys"),
      value: availableKeys,
      icon: Key,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      ring: "ring-amber-400/20",
      glow: "shadow-amber-500/10",
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
            <div
              key={stat.label}
              className={`rounded-xl border border-border/60 bg-card p-5 shadow-lg ${stat.glow}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className={`rounded-lg p-2 ${stat.bg} ring-1 ${stat.ring}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="font-semibold">{tOrders("title")}</h2>
        </div>
        <div className="p-2">
          {recentOrders.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">{tOrders("noOrders")}</p>
          ) : (
            <div className="space-y-1">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors hover:bg-secondary/40"
                >
                  <div>
                    <p className="font-medium">{order.guestEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      {(order.product.name as Record<string, string>)["en"] ?? "Product"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === "paid"
                          ? "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20"
                          : order.status === "pending"
                          ? "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20"
                          : "bg-red-400/10 text-red-400 ring-1 ring-red-400/20"
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
        </div>
      </div>
    </div>
  );
}
