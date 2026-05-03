import Image from "next/image";
import Link from "next/link";
import { Key, ShoppingCart } from "lucide-react";
import { getLocalizedText, formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    title: unknown;
    description: unknown;
    price: string | number;
    imageUrl?: string | null;
  };
  locale: string;
  buyLabel: string;
  currency: string;
}

export function ProductCard({ product, locale, buyLabel, currency }: ProductCardProps) {
  const name = getLocalizedText(product.title, locale, "Product");
  const description = getLocalizedText(product.description, locale, "");
  const price = formatPrice(product.price, locale);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer">
      {/* Image area */}
      <div className="relative aspect-video w-full overflow-hidden">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Always-visible gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-secondary">
            {/* Always-visible gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 ring-4 ring-primary/5">
              <Key className="h-7 w-7 text-primary/70" />
            </div>
          </div>
        )}

        {/* License Key badge — top right */}
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-medium text-white/70 backdrop-blur-sm">
          <Key className="h-2.5 w-2.5" />
          License Key
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 text-base font-semibold leading-snug text-foreground">{name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">{description}</p>

        <div className="mt-auto pt-4">
          {/* Price */}
          <div className="mb-4">
            <p className="text-3xl font-black text-foreground leading-none">{price}</p>
            <p className="mt-1 text-xs text-muted-foreground">{currency}</p>
          </div>

          {/* Buy button — full width */}
          <Link
            href={`/${locale}/checkout?productId=${product.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-bold text-accent-foreground transition-all duration-200 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/25 cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4" />
            {buyLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
