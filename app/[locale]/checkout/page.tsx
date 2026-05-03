"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShieldCheck, Lock, Zap, Key, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocalizedText, formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { GatewaySelector } from "@/components/purchase/GatewaySelector";

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

  const [token, setToken] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId);
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tok = localStorage.getItem("auth_token");
    if (!tok) { router.push(`/${locale}/login`); return; }
    setToken(tok);
  }, [locale, router]);

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
    if (!selectedProductId || !selectedGateway || !token) return;

    setLoading(true);
    setError(null);
    try {
      // Step 1: Create order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: selectedProductId, locale, gateway: selectedGateway }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        if (orderRes.status === 402) {
          setError("Insufficient wallet balance.");
        } else {
          setError(err.error ?? "Could not create order.");
        }
        return;
      }

      const { orderId } = await orderRes.json();

      // Wallet path — order already PAID, go directly to order detail
      if (selectedGateway === "wallet") {
        router.push(`/${locale}/orders/${orderId}`);
        return;
      }

      // Step 2: Initiate gateway payment
      const initiateRes = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, gateway: selectedGateway }),
      });

      if (!initiateRes.ok) {
        setError("Payment could not be started. Please try again.");
        return;
      }

      const { redirectUrl } = await initiateRes.json();

      if (!redirectUrl) {
        router.push(`/${locale}/orders/${orderId}`);
      } else {
        window.location.href = redirectUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Page header */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
            <Lock className="h-3 w-3" />
            Secure Checkout
          </div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">1</span>
              Details
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/40 px-3 py-1 text-muted-foreground/50">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">2</span>
              Payment
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/40 px-3 py-1 text-muted-foreground/50">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">3</span>
              Receive Key
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-5">
          {/* Form */}
          <div className="md:col-span-3">
            <div className="rounded-xl border border-white/8 bg-card/80 p-6 backdrop-blur-sm">
              <h2 className="mb-5 text-base font-semibold">{t("contactInfo")}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="product" className="text-sm font-medium">{t("product")}</Label>
                  {productsLoading ? (
                    <div className="h-10 rounded-lg shimmer" />
                  ) : (
                    <Select value={selectedProductId} onValueChange={setSelectedProductId} required>
                      <SelectTrigger id="product" className="border-border/60 bg-secondary/50 focus:ring-primary/40">
                        <SelectValue placeholder={t("selectProduct")} />
                      </SelectTrigger>
                      <SelectContent className="border-border/60 bg-card">
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {getLocalizedText(p.name, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <GatewaySelector value={selectedGateway} onChange={setSelectedGateway} disabled={loading} />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-auto p-0 text-destructive hover:text-destructive/80">
                      Try again
                    </Button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !selectedProductId || !selectedGateway}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-bold text-accent-foreground transition-all duration-200 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Pay {selectedProduct ? `${formatPrice(selectedProduct.price, locale)} ${tStore("currency")}` : ""}</>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {t("securePayment")}
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-xl border border-white/8 bg-card/80 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-base font-semibold">{t("orderSummary")}</h2>
              <div className="space-y-4">
                {!selectedProduct && productsLoading && (
                  <div className="h-20 w-full rounded-lg shimmer" />
                )}

                {selectedProduct ? (
                  <>
                    <div>
                      <p className="font-semibold text-sm">
                        {getLocalizedText(selectedProduct.name, locale)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {getLocalizedText(selectedProduct.description, locale)}
                      </p>
                    </div>
                    <div className="border-t border-border/60 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("price")}</span>
                        <span>{formatPrice(selectedProduct.price, locale)} {tStore("currency")}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>{t("total")}</span>
                        <span className="text-primary">{formatPrice(selectedProduct.price, locale)} {tStore("currency")}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  !productsLoading && <p className="text-sm text-muted-foreground">{t("selectProduct")}</p>
                )}

                <div className="flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  {t("poweredBy")}
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/30 p-3 text-xs text-muted-foreground">
                  <Zap className="h-4 w-4 shrink-0 text-accent" />
                  License key delivered instantly after payment
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-card/60 p-5 backdrop-blur-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What happens next?</p>
              <ol className="space-y-3">
                {[
                  { icon: Lock, text: "You pay securely via the gateway" },
                  { icon: ShieldCheck, text: "Gateway confirms your payment" },
                  { icon: Key, text: "Your license key is delivered instantly" },
                ].map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary/60 text-[10px] font-bold text-foreground">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2 pt-0.5">
                      <Icon className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                      {text}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
