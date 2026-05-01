"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { CategoryFilter } from "@/components/category-filter";

interface Product {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: string;
  imageUrl?: string | null;
  category?: string | null;
  sortOrder?: number;
  _count?: { licenseKeys: number };
}

interface ProductsSectionProps {
  products: Product[];
  locale: string;
  buyLabel: string;
  currency: string;
  allLabel: string;
  searchPlaceholder: string;
  noResultsLabel: string;
  noProductsLabel: string;
}

export function ProductsSection({
  products,
  locale,
  buyLabel,
  currency,
  allLabel,
  searchPlaceholder,
  noResultsLabel,
  noProductsLabel,
}: ProductsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of products) {
      if (p.category) cats.add(p.category);
    }
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;

    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => {
        const name =
          (p.name[locale] ?? p.name["en"] ?? "").toLowerCase();
        const desc =
          (p.description[locale] ?? p.description["en"] ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    return result;
  }, [products, activeCategory, searchQuery, locale]);

  return (
    <div className="space-y-6">
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allLabel={allLabel}
        searchPlaceholder={searchPlaceholder}
      />

      {products.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-dashed border-border/60">
          <p className="text-muted-foreground">{noProductsLabel}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border/60">
          <p className="text-muted-foreground">{noResultsLabel}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              buyLabel={buyLabel}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
