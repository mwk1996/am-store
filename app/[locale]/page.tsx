import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { ProductCard } from "@/components/product-card";

interface StorePageProps {
  params: { locale: string };
}

export default async function StorePage({ params: { locale } }: StorePageProps) {
  const t = await getTranslations("store");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          licenseKeys: { where: { orderId: null } },
        },
      },
    },
  });

  // Only show products that have available license keys
  const availableProducts = products.filter((p) => p._count.licenseKeys > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav locale={locale} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        {availableProducts.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {availableProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  price: product.price.toString(),
                }}
                locale={locale}
                buyLabel={t("buyNow")}
                currency={t("currency")}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
