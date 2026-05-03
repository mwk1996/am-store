import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ProductFilters } from "@/components/marketplace/ProductFilters";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { ProductStatus, DeliveryType, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { locale: string };
  searchParams: {
    q?: string;
    category?: string;
    platform?: string;
    deliveryType?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

async function getProducts(searchParams: PageProps["searchParams"]) {
  const page = Number(searchParams.page ?? 1);
  const limit = 12;
  const skip = (page - 1) * limit;

  const baseWhere: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(searchParams.category && {
      category: { slug: searchParams.category },
    }),
    ...(searchParams.platform && { platform: searchParams.platform }),
    ...(searchParams.deliveryType &&
      Object.values(DeliveryType).includes(
        searchParams.deliveryType as DeliveryType
      ) && { deliveryType: searchParams.deliveryType as DeliveryType }),
    ...(searchParams.q && {
      title: { path: ["en"], string_contains: searchParams.q },
    }),
    ...((searchParams.minPrice || searchParams.maxPrice) && {
      price: {
        ...(searchParams.minPrice && { gte: parseFloat(searchParams.minPrice) }),
        ...(searchParams.maxPrice && { lte: parseFloat(searchParams.maxPrice) }),
      },
    }),
  };

  const includeSpec = {
    seller: { select: { id: true, name: true, avatar: true } },
    category: true,
    _count: { select: { keys: { where: { isUsed: false } } } },
  } as const;

  const [featured, products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where: { ...baseWhere, isFeatured: true },
      orderBy: { createdAt: "desc" },
      include: includeSpec,
    }),
    prisma.product.findMany({
      where: { ...baseWhere, isFeatured: false },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: includeSpec,
    }),
    prisma.product.count({ where: { ...baseWhere, isFeatured: false } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const mapProduct = (p: (typeof products)[number]) => ({
    ...p,
    availableKeys: p._count.keys,
  });

  return {
    featured: featured.map(mapProduct),
    products: products.map(mapProduct),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    categories,
  };
}

export default async function MarketplacePage({
  params: { locale },
  searchParams,
}: PageProps) {
  const { featured, products, total, page, totalPages, categories } =
    await getProducts(searchParams);

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (searchParams.category) sp.set("category", searchParams.category);
    if (searchParams.platform) sp.set("platform", searchParams.platform);
    if (searchParams.deliveryType)
      sp.set("deliveryType", searchParams.deliveryType);
    if (searchParams.minPrice) sp.set("minPrice", searchParams.minPrice);
    if (searchParams.maxPrice) sp.set("maxPrice", searchParams.maxPrice);
    sp.set("page", String(p));
    return `/${locale}/marketplace?${sp.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Nav locale={locale} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Marketplace
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} product{total !== 1 ? "s" : ""} available
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <Suspense
            fallback={
              <div className="w-64 h-96 bg-card/60 rounded-xl animate-pulse" />
            }
          >
            <ProductFilters categories={categories} />
          </Suspense>

          {/* Product grid */}
          <div className="flex-1">
            {featured.length === 0 && products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-foreground font-semibold text-lg">
                  No products found
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <>
                {/* Featured row */}
                {featured.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Featured
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {featured.map((product) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          title={product.title}
                          description={product.description}
                          price={Number(product.price)}
                          imageUrl={product.imageUrl}
                          deliveryType={product.deliveryType}
                          availableKeys={product.availableKeys}
                          seller={product.seller}
                          isFeatured={true}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Paginated results */}
                {products.length > 0 && (
                  <>
                    {featured.length > 0 && (
                      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        All Products
                      </h2>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          title={product.title}
                          description={product.description}
                          price={Number(product.price)}
                          imageUrl={product.imageUrl}
                          deliveryType={product.deliveryType}
                          availableKeys={product.availableKeys}
                          seller={product.seller}
                          isFeatured={false}
                          locale={locale}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        {page > 1 && (
                          <Link
                            href={buildPageUrl(page - 1)}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-card/60 border border-white/8 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Prev
                          </Link>
                        )}
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((p) => (
                          <Link
                            key={p}
                            href={buildPageUrl(p)}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              p === page
                                ? "bg-primary text-primary-foreground border border-primary/60"
                                : "bg-card/60 border border-white/8 text-muted-foreground hover:text-foreground hover:border-primary/40"
                            }`}
                          >
                            {p}
                          </Link>
                        ))}
                        {page < totalPages && (
                          <Link
                            href={buildPageUrl(page + 1)}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-card/60 border border-white/8 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm"
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
