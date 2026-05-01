"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocalizedText, formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: unknown;
  description: unknown;
  price: string;
  imageUrl?: string | null;
}

interface CheckoutPageProps {
  params: { locale: string };
}

export default function CheckoutPage({ params: { locale } }: CheckoutPageProps) {
  const t = useTranslations("checkout");
  const tStore = useTranslations("store");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        setProducts(data);
        if (preselectedProductId && data.find((p: Product) => p.id === preselectedProductId)) {
          setSelectedProductId(preselectedProductId);
        } else if (data.length > 0 && !preselectedProductId) {
          setSelectedProductId(data[0].id);
        }
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
      })
      .finally(() => setProductsLoading(false));
  }, [preselectedProductId, toast]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId || !email) return;

    setLoading(true);
    try {
      // 1. Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId: selectedProductId, locale }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error ?? "Failed to create order");
      }

      const { orderId } = await orderRes.json();

      // 2. Initiate payment
      const payRes = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!payRes.ok) {
        const err = await payRes.json();
        throw new Error(err.error ?? "Failed to initiate payment");
      }

      const { redirectUrl } = await payRes.json();
      router.push(redirectUrl);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="mb-8 text-center text-3xl font-bold">{t("title")}</h1>
        <div className="grid gap-6 md:grid-cols-5">
          {/* Form */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("contactInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                    <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product">{t("product")}</Label>
                    {productsLoading ? (
                      <div className="h-10 animate-pulse rounded-md bg-muted" />
                    ) : (
                      <Select
                        value={selectedProductId}
                        onValueChange={setSelectedProductId}
                        required
                      >
                        <SelectTrigger id="product">
                          <SelectValue placeholder={t("selectProduct")} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {getLocalizedText(p.name, locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading || !selectedProductId || !email}>
                    {loading ? t("paying") : t("pay")}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    {t("securePayment")}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProduct ? (
                  <>
                    <div>
                      <p className="font-medium">
                        {getLocalizedText(selectedProduct.name, locale)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {getLocalizedText(selectedProduct.description, locale)}
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("price")}</span>
                        <span>
                          {formatPrice(selectedProduct.price, locale)} {tStore("currency")}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between font-semibold">
                        <span>{t("total")}</span>
                        <span>
                          {formatPrice(selectedProduct.price, locale)} {tStore("currency")}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("selectProduct")}</p>
                )}
                <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {t("poweredBy")}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
