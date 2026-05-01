import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { getLocalizedText, formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: unknown;
    description: unknown;
    price: string | number;
    imageUrl?: string | null;
  };
  locale: string;
  buyLabel: string;
  currency: string;
}

export function ProductCard({ product, locale, buyLabel, currency }: ProductCardProps) {
  const name = getLocalizedText(product.name, locale, "Product");
  const description = getLocalizedText(product.description, locale, "");
  const price = formatPrice(product.price, locale);

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <h3 className="line-clamp-1 text-lg font-semibold">{name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <p className="text-2xl font-bold">
          {price}{" "}
          <span className="text-base font-normal text-muted-foreground">{currency}</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/${locale}/checkout?productId=${product.id}`}>
            <ShoppingCart className="me-2 h-4 w-4" />
            {buyLabel}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
