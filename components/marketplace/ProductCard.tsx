"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Package, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLocalizedText } from "@/lib/utils";

interface Seller {
  id: string;
  name: string;
  avatar?: string | null;
}

interface ProductCardProps {
  id: string;
  title: unknown;
  description: unknown;
  price: number | string;
  imageUrl?: string | null;
  deliveryType: "INSTANT" | "MANUAL";
  availableKeys: number;
  seller: Seller;
  isFeatured?: boolean;
  averageRating?: number;
  reviewCount?: number;
  locale?: string;
}

function StockBadge({ count }: { count: number }) {
  if (count === 0)
    return (
      <Badge className="text-red-400 bg-black/40 border-0 text-xs">
        Out of stock
      </Badge>
    );
  if (count <= 5)
    return (
      <Badge className="text-amber-400 bg-black/40 border-0 text-xs">
        Only {count} left
      </Badge>
    );
  return (
    <Badge className="text-emerald-400 bg-black/40 border-0 text-xs">
      {count} in stock
    </Badge>
  );
}

export function ProductCard({
  id,
  title,
  description,
  price,
  imageUrl,
  deliveryType,
  availableKeys,
  seller,
  isFeatured = false,
  averageRating = 0,
  reviewCount = 0,
  locale = "en",
}: ProductCardProps) {
  const thumb = imageUrl ?? "/placeholder-product.png";
  const priceNum = typeof price === "string" ? parseFloat(price) : price;
  const localizedTitle = getLocalizedText(title, locale, "Product");
  const localizedDescription = getLocalizedText(description, locale, "");
  const isOutOfStock = (availableKeys ?? 0) === 0;

  return (
    <Link
      href={`/${locale}/products/${id}`}
      className={`group block ${isOutOfStock ? "opacity-60" : ""}`}
    >
      <div
        className={`bg-card/60 backdrop-blur-sm border border-white/8 rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 motion-reduce:hover:translate-y-0 ${
          isFeatured ? "ring-1 ring-primary/40" : ""
        }`}
      >
        {/* Image */}
        <div className="relative h-48 bg-muted overflow-hidden">
          <Image
            src={thumb}
            alt={localizedTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-product.png";
            }}
          />

          {/* Featured badge — top-left */}
          {isFeatured && (
            <span className="absolute top-2 left-2 bg-accent text-accent-foreground rounded-full text-[10px] px-2 py-0.5 font-medium z-10">
              Featured
            </span>
          )}

          {/* Delivery type badge */}
          <div className={`absolute left-2 ${isFeatured ? "top-8" : "top-2"}`}>
            <Badge
              className={
                deliveryType === "INSTANT"
                  ? "bg-blue-600 text-white border-0"
                  : "bg-purple-600 text-white border-0"
              }
            >
              {deliveryType === "INSTANT" ? (
                <>
                  <Key className="w-3 h-3 mr-1" />
                  Instant
                </>
              ) : (
                <>
                  <Package className="w-3 h-3 mr-1" />
                  Manual Delivery
                </>
              )}
            </Badge>
          </div>

          {/* Stock badge — top-right */}
          <div className="absolute top-2 right-2">
            <StockBadge count={availableKeys ?? 0} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-foreground font-semibold text-base truncate mb-1 group-hover:text-primary transition-colors">
            {localizedTitle}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
            {localizedDescription}
          </p>

          {/* Seller & Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold flex-shrink-0">
              {seller.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-muted-foreground text-xs truncate">
              {seller.name}
            </span>
            {reviewCount > 0 && (
              <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-muted-foreground text-xs">
                  {averageRating.toFixed(1)} ({reviewCount})
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-primary font-bold text-lg">
              ${priceNum.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              View details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
