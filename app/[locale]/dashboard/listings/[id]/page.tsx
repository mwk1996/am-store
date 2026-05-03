"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Pencil, ArrowLeft, CheckCircle, AlertCircle, Key } from "lucide-react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getLocalizedText } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  title: unknown;
  description?: unknown;
  price: number;
  imageUrl?: string | null;
  status: string;
  deliveryType?: string;
  platform?: string | null;
  category?: { name?: string } | null;
  sellerId: string;
  availableKeys?: number;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [availableKeys, setAvailableKeys] = useState(0);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  // Key import state
  const [keyInput, setKeyInput] = useState("");
  const [detected, setDetected] = useState(0);
  const [dupes, setDupes] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchKeyCount = async (tok: string) => {
    const res = await fetch(`/api/products/${id}/keys`, {
      headers: { Authorization: `Bearer ${tok}` },
    });
    if (res.ok) {
      const data = await res.json();
      setAvailableKeys(data.available ?? 0);
    }
  };

  useEffect(() => {
    const tok = localStorage.getItem("auth_token");
    if (!tok) { router.push(`/${locale}/login`); return; }
    setToken(tok);

    Promise.all([
      fetch(`/api/products/${id}`, { headers: { Authorization: `Bearer ${tok}` } }),
      fetch(`/api/auth/me`, { headers: { Authorization: `Bearer ${tok}` } }),
    ]).then(async ([productRes, meRes]) => {
      if (!productRes.ok) { router.push(`/${locale}/dashboard`); return; }
      const prod: Product = await productRes.json();

      if (meRes.ok) {
        const me = await meRes.json();
        if (prod.sellerId !== me.id) {
          router.push(`/${locale}/dashboard`);
          return;
        }
      }

      setProduct(prod);
      await fetchKeyCount(tok);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, locale, router]);

  // Debounced live key counter
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const lines = keyInput.split("\n").map((l) => l.trim()).filter(Boolean);
      const unique = Array.from(new Set(lines));
      setDetected(lines.length);
      setDupes(lines.length - unique.length);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyInput]);

  const handleImport = async () => {
    if (detected === 0 || importing) return;
    setImporting(true);
    setImportResult(null);

    const uniqueKeys = Array.from(new Set(keyInput.split("\n").map((l) => l.trim()).filter(Boolean)));

    try {
      const res = await fetch(`/api/products/${id}/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keys: uniqueKeys.join("\n") }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult({ success: true, message: `${data.created} keys imported successfully` });
        setKeyInput("");
        setDetected(0);
        setDupes(0);
        await fetchKeyCount(token);
      } else {
        setImportResult({ success: false, message: data.error ?? "Import failed" });
      }
    } catch {
      setImportResult({ success: false, message: "Network error — please try again" });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) return null;

  const title = getLocalizedText(product.title as Record<string, string> | string, locale);

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={`/${locale}/dashboard`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                ${product.status === "ACTIVE"
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-gray-400 bg-gray-500/10"}`}
              >
                {product.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {availableKeys} keys in stock
              </span>
            </div>
          </div>
          <Link
            href={`/${locale}/dashboard/listings/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-card/60 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors"
          >
            <Pencil className="h-4 w-4" /> Edit Listing
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Product Info (left) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm p-6">
              <h2 className="mb-4 font-semibold text-foreground">Product Info</h2>

              {/* Thumbnail */}
              {product.imageUrl && (
                <div className="mb-4 overflow-hidden rounded-xl bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={title}
                    className="w-full object-cover max-h-48"
                  />
                </div>
              )}

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="font-semibold text-foreground">${Number(product.price).toFixed(2)}</dd>
                </div>
                {product.category?.name && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="text-foreground">{product.category.name}</dd>
                  </div>
                )}
                {product.platform && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Platform</dt>
                    <dd className="text-foreground">{product.platform}</dd>
                  </div>
                )}
                {product.deliveryType && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Delivery</dt>
                    <dd className="text-foreground capitalize">{product.deliveryType.toLowerCase()}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/40 pt-3">
                  <dt className="text-muted-foreground">Keys in stock</dt>
                  <dd className={`font-semibold ${availableKeys === 0 ? "text-red-400" : availableKeys <= 5 ? "text-amber-400" : "text-emerald-400"}`}>
                    {availableKeys}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Key Import (right) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  Add License Keys
                </h2>
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium
                  ${availableKeys === 0 ? "text-red-400 bg-red-500/10" : availableKeys <= 5 ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10"}`}
                >
                  {availableKeys} available
                </span>
              </div>

              {/* Import result banner */}
              {importResult && (
                <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm
                  ${importResult.success
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/20 text-red-300"}`}
                >
                  {importResult.success
                    ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                  {importResult.message}
                </div>
              )}

              <p className="mb-3 text-xs text-muted-foreground">
                Paste one license key per line. Duplicates are automatically removed before import.
              </p>

              <Textarea
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={"XXXX-YYYY-ZZZZ\nAAAA-BBBB-CCCC\n(one key per line)"}
                className="min-h-[120px] font-mono text-sm rounded-xl bg-background/60 border-white/8 focus:border-primary/50 resize-y"
              />

              {/* Live counter */}
              {detected > 0 && (
                <p className={`text-xs mt-1 ${dupes > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                  {detected} key{detected !== 1 ? "s" : ""} detected
                  {dupes > 0 ? `, ${dupes} duplicate${dupes !== 1 ? "s" : ""} removed` : ""}
                </p>
              )}

              <Button
                onClick={handleImport}
                disabled={detected === 0 || importing}
                className="w-full rounded-xl bg-accent text-accent-foreground font-bold mt-3"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${detected > 0 ? detected - dupes : ""} Keys`
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
