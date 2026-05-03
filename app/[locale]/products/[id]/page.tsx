"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Star, Package, Key, ShieldCheck, ArrowLeft, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocalizedText } from "@/lib/utils";

interface Product {
  id: string;
  title: unknown;
  description: unknown;
  price: number;
  imageUrl?: string | null;
  platform?: string | null;
  deliveryType: "INSTANT" | "MANUAL";
  status: "ACTIVE" | "INACTIVE";
  availableKeys: number;
  seller: {
    id: string;
    name: string;
    avatar?: string | null;
    createdAt: string;
  };
  category?: { name: string } | null;
}

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer: { name: string; avatar?: string | null };
}

function StockBadge({ count }: { count: number }) {
  if (count === 0)
    return (
      <Badge className="text-red-400 bg-red-500/10 border-red-500/20">
        Out of stock
      </Badge>
    );
  if (count <= 5)
    return (
      <Badge className="text-amber-400 bg-amber-500/10 border-amber-500/20">
        Only {count} left
      </Badge>
    );
  return (
    <Badge className="text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
      {count} in stock
    </Badge>
  );
}

export default function ProductDetailPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [pRes, rRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch(`/api/reviews/seller/${id}`),
      ]);
      if (pRes.ok) {
        const p = await pRes.json();
        setProduct(p);
      }
      if (rRes.ok) {
        const r = await rRes.json();
        setReviews(r.items ?? []);
        setAvgRating(r.averageRating ?? 0);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleBuy = async () => {
    setBuying(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/${locale}/login?redirect=/products/${id}`);
          return;
        }
        setError(data.error ?? "Failed to create order");
        return;
      }
      router.push(`/${locale}/orders/${data.orderId}`);
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-white font-semibold text-xl">Product not found</h2>
          <Button
            variant="ghost"
            className="mt-4 text-gray-400"
            onClick={() => router.push(`/${locale}/marketplace`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to marketplace
          </Button>
        </div>
      </div>
    );
  }

  const title = getLocalizedText(product.title, locale, "Product");
  const description = getLocalizedText(product.description, locale, "");
  const thumb = product.imageUrl ?? "/placeholder-product.png";

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${locale}/marketplace`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            <div className="relative h-80 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 mb-3">
              <Image
                src={thumb}
                alt={title}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-product.png";
                }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {product.category && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-primary bg-primary/10 text-xs rounded-full px-2.5 py-1"
                  >
                    {product.category.name}
                  </Badge>
                )}
                {product.platform && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-primary bg-primary/10 text-xs rounded-full px-2.5 py-1"
                  >
                    {product.platform}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
            </div>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(avgRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-400 text-sm">
                  {avgRating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </div>
            )}

            {/* Delivery type indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {product.deliveryType === "INSTANT" ? (
                <>
                  <Key className="w-4 h-4 text-blue-400" />
                  Instant Delivery — key revealed immediately after payment
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 text-purple-400" />
                  Manual Delivery — seller posts credentials
                </>
              )}
            </div>

            {/* Price & stock */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-indigo-400">
                  ${Number(product.price).toFixed(2)}
                </span>
                <StockBadge count={product.availableKeys} />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 mb-3 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleBuy}
                disabled={product.availableKeys === 0 || buying}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5"
              >
                {buying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {buying
                  ? "Processing..."
                  : product.availableKeys === 0
                  ? "Out of Stock"
                  : "Buy Now"}
              </Button>

              <div className="flex items-center gap-2 mt-3 text-gray-500 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Protected by escrow — funds held until you confirm receipt
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-white font-semibold mb-2">Description</h3>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* Seller */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                Seller
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {product.seller.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{product.seller.name}</p>
                  <p className="text-gray-500 text-xs">
                    Member since {new Date(product.seller.createdAt).getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-white font-bold text-xl mb-5">Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs text-white font-bold">
                      {r.reviewer.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {r.reviewer.name}
                    </span>
                    <div className="ml-auto flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= r.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-gray-400 text-sm">{r.comment}</p>
                  )}
                  <p className="text-gray-600 text-xs mt-2">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
