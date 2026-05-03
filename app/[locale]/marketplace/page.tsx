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
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

async function getProducts(searchParams: PageProps["searchParams"]) {
  const page = Number(searchParams.page ?? 1);
  const limit = 12;
  const skip = (page - 1) * limit;
  const type = searchParams.type as DeliveryType | undefined;

  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(searchParams.category && {
      category: { slug: searchParams.category },
    }),
    ...(type && Object.values(DeliveryType).includes(type) && { deliveryType: type }),
    ...(searchParams.q && {
      OR: [
        { title: { string_contains: searchParams.q } },
        { description: { string_contains: searchParams.q } },
      ],
    }),
    ...((searchParams.minPrice || searchParams.maxPrice) && {
      price: {
        ...(searchParams.minPrice && { gte: parseFloat(searchParams.minPrice) }),
        ...(searchParams.maxPrice && { lte: parseFloat(searchParams.maxPrice) }),
      },
    }),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        seller: { select: { id: true, name: true, avatar: true } },
        category: true,
        _count: { select: { keys: { where: { isUsed: false } } } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    products: products.map((p) => ({ ...p, availableKeys: p._count.keys })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    categories,
  };
}

export default async function MarketplacePage({ params: { locale }, searchParams }: PageProps) {
  const { products, total, page, totalPages, categories } = await getProducts(searchParams);

  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (searchParams.category) sp.set("category", searchParams.category);
    if (searchParams.type) sp.set("type", searchParams.type);
    if (searchParams.minPrice) sp.set("minPrice", searchParams.minPrice);
    if (searchParams.maxPrice) sp.set("maxPrice", searchParams.maxPrice);
    sp.set("page", String(p));
    return `/${locale}/marketplace?${sp.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Nav locale={locale} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            Marketplace
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {total} product{total !== 1 ? "s" : ""} available
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <Suspense fallback={<div className="w-64 h-96 bg-gray-800 rounded-xl animate-pulse" />}>
            <ProductFilters categories={categories} />
          </Suspense>

          {/* Product grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-white font-semibold text-lg">No products found</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={(product.title as Record<string, string>)["en"] ?? ""}
                      description={(product.description as Record<string, string>)["en"] ?? ""}
                      price={Number(product.price)}
                      images={product.imageUrl ? [product.imageUrl] : []}
                      type="SOFTWARE_KEY"
                      availableKeys={product.availableKeys}
                      seller={product.seller}
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
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500 transition-colors text-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                      </Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Link
                        key={p}
                        href={buildPageUrl(p)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          p === page
                            ? "bg-indigo-600 text-white border border-indigo-500"
                            : "bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500"
                        }`}
                      >
                        {p}
                      </Link>
                    ))}
                    {page < totalPages && (
                      <Link
                        href={buildPageUrl(page + 1)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500 transition-colors text-sm"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
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
