"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("importKeys")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("selectProduct")}</Label>
              <Select value={importProductId} onValueChange={setImportProductId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectProduct")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("pasteKeys")}</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t("pasteKeysHint")}
                value={keysText}
                onChange={(e) => setKeysText(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleImport} disabled={importing || !importProductId || !keysText.trim()} className="gap-2">
            <Upload className="h-4 w-4" />
            {importing ? t("importing") : t("import")}
          </Button>
        </CardContent>
      </Card>

      {/* Keys List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <div className="w-48">
            <Select value={filterProductId} onValueChange={setFilterProductId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">{t("noKeys")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("key")}</TableHead>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("assignedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-mono text-xs">{k.key}</TableCell>
                    <TableCell>{k.product.name.en}</TableCell>
                    <TableCell>
                      <Badge variant={k.assignedAt ? "secondary" : "success"}>
                        {k.assignedAt ? t("assigned") : t("available")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {k.assignedAt ? new Date(k.assignedAt).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
