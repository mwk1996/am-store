"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
}

const PLATFORMS = [
  { value: "", label: "All Platforms" },
  { value: "PC", label: "PC" },
  { value: "PlayStation", label: "PlayStation" },
  { value: "Xbox", label: "Xbox" },
  { value: "Nintendo Switch", label: "Nintendo Switch" },
  { value: "Mobile", label: "Mobile" },
  { value: "Multiple Platforms", label: "Multiple Platforms" },
  { value: "Other", label: "Other" },
];

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const q = searchParams.get("q") ?? "";
  const selectedCategory = searchParams.get("category") ?? "";
  const selectedDeliveryType = searchParams.get("deliveryType") ?? "";
  const selectedPlatform = searchParams.get("platform") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const hasFilters =
    selectedCategory ||
    selectedPlatform ||
    selectedDeliveryType ||
    minPrice ||
    maxPrice ||
    q;

  const clearAll = () => {
    router.push(pathname);
  };

  return (
    <aside className="w-full lg:w-64 space-y-6 flex-shrink-0">
      <div className="bg-card/60 backdrop-blur-sm border border-white/8 rounded-xl p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            Filters
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Search */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              defaultValue={q}
              onChange={(e) => updateParam("q", e.target.value || null)}
              className="pl-9 bg-background/60 border-white/8 text-foreground placeholder:text-muted-foreground focus:border-primary/40"
            />
          </div>
        </div>

        {/* Delivery Type */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Delivery
          </label>
          <div className="flex flex-col gap-2">
            {[
              { value: "", label: "All Types" },
              { value: "INSTANT", label: "Instant (Key)" },
              { value: "MANUAL", label: "Manual Delivery" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("deliveryType", opt.value || null)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedDeliveryType === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Platform
          </label>
          <div className="flex flex-col gap-2">
            {PLATFORMS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("platform", opt.value || null)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedPlatform === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Category
            </label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => updateParam("category", null)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedCategory
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateParam("category", cat.slug)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Price Range
          </label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              defaultValue={minPrice}
              min={0}
              onChange={(e) => updateParam("minPrice", e.target.value || null)}
              className="bg-background/60 border-white/8 text-foreground placeholder:text-muted-foreground focus:border-primary/40 w-full"
            />
            <span className="text-muted-foreground flex-shrink-0">—</span>
            <Input
              type="number"
              placeholder="Max"
              defaultValue={maxPrice}
              min={0}
              onChange={(e) => updateParam("maxPrice", e.target.value || null)}
              className="bg-background/60 border-white/8 text-foreground placeholder:text-muted-foreground focus:border-primary/40 w-full"
            />
          </div>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Active Filters
            </label>
            <div className="flex flex-wrap gap-1">
              {q && (
                <Badge
                  className="bg-primary/20 text-primary border-primary/30 cursor-pointer hover:bg-primary/30"
                  onClick={() => updateParam("q", null)}
                >
                  &quot;{q}&quot; <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {selectedDeliveryType && (
                <Badge
                  className="bg-primary/20 text-primary border-primary/30 cursor-pointer hover:bg-primary/30"
                  onClick={() => updateParam("deliveryType", null)}
                >
                  {selectedDeliveryType === "INSTANT"
                    ? "Instant"
                    : "Manual Delivery"}{" "}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {selectedPlatform && (
                <Badge
                  className="bg-primary/20 text-primary border-primary/30 cursor-pointer hover:bg-primary/30"
                  onClick={() => updateParam("platform", null)}
                >
                  {selectedPlatform} <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {selectedCategory && (
                <Badge
                  className="bg-primary/20 text-primary border-primary/30 cursor-pointer hover:bg-primary/30"
                  onClick={() => updateParam("category", null)}
                >
                  {selectedCategory} <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
