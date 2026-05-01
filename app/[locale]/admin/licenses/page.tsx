"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface LicenseKey {
  id: string;
  key: string;
  assignedAt: string | null;
  product: { name: { en: string } };
  order: { guestEmail: string } | null;
}

interface Product {
  id: string;
  name: { en: string };
}

export default function LicensesPage() {
  const t = useTranslations("admin.licenses");
  const { toast } = useToast();
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProductId, setFilterProductId] = useState("all");
  const [importProductId, setImportProductId] = useState("");
  const [keysText, setKeysText] = useState("");
  const [importing, setImporting] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [keysRes, productsRes] = await Promise.all([
        fetch("/api/admin/licenses"),
        fetch("/api/admin/products"),
      ]);
      const [keysData, productsData] = await Promise.all([keysRes.json(), productsRes.json()]);
      setKeys(keysData);
      setProducts(productsData);
      if (productsData.length > 0 && !importProductId) {
        setImportProductId(productsData[0].id);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleImport() {
    if (!importProductId || !keysText.trim()) return;
    setImporting(true);
    try {
      const keyList = keysText.split("\n").map((k) => k.trim()).filter(Boolean);
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: importProductId, keys: keyList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      toast({ title: "Success", description: `${data.count} ${t("importSuccess")}` });
      setKeysText("");
      fetchData();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Import failed.", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  const filteredKeys =
    filterProductId === "all" ? keys : keys.filter((k) => k.product.name.en === products.find((p) => p.id === filterProductId)?.name.en);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Import Panel */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="mb-4 font-semibold">{t("importKeys")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("selectProduct")}</Label>
            <Select value={importProductId} onValueChange={setImportProductId}>
              <SelectTrigger className="border-border/60 bg-secondary/50">
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent className="border-border/60 bg-card">
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("pasteKeys")}</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
              placeholder={t("pasteKeysHint")}
              value={keysText}
              onChange={(e) => setKeysText(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={handleImport}
          disabled={importing || !importProductId || !keysText.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          {importing ? t("importing") : t("import")}
        </button>
      </div>

      {/* Keys List */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <h2 className="font-semibold">{t("title")}</h2>
          <div className="w-44">
            <Select value={filterProductId} onValueChange={setFilterProductId}>
              <SelectTrigger className="border-border/60 bg-secondary/50 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border/60 bg-card">
                <SelectItem value="all">{t("all")}</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t("noKeys")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("key")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("product")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("status")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("assignedAt")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((k, i) => (
                  <tr key={k.id} className={`transition-colors hover:bg-secondary/30 ${i !== filteredKeys.length - 1 ? "border-b border-border/40" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs">{k.key}</td>
                    <td className="px-4 py-3">{k.product.name.en}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        k.assignedAt
                          ? "bg-secondary text-muted-foreground ring-1 ring-border"
                          : "bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20"
                      }`}>
                        {k.assignedAt ? t("assigned") : t("available")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {k.assignedAt ? new Date(k.assignedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
