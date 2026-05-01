"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: { en: string; ar: string; tr: string; ku: string };
  description: { en: string; ar: string; tr: string; ku: string };
  price: string;
  imageUrl?: string | null;
  _count?: { licenseKeys: number };
}

const LOCALES = ["en", "ar", "tr", "ku"] as const;
const LOCALE_LABELS: Record<string, string> = { en: "English", ar: "العربية", tr: "Türkçe", ku: "کوردی" };

const emptyForm = () => ({
  name: { en: "", ar: "", tr: "", ku: "" },
  description: { en: "", ar: "", tr: "", ku: "" },
  price: "",
  imageUrl: "",
});

export default function ProductsPage() {
  const t = useTranslations("admin.products");
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data);
    } catch {
      toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProducts(); }, []);

  function openCreate() {
    setEditingProduct(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: { ...product.name },
      description: { ...product.description },
      price: product.price,
      imageUrl: product.imageUrl ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: "Success", description: editingProduct ? "Product updated." : "Product created." });
      setDialogOpen(false);
      fetchProducts();
    } catch {
      toast({ title: "Error", description: "Failed to save product.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", description: "Product deleted." });
      fetchProducts();
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("addProduct")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">{t("noProducts")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("price")}</TableHead>
                  <TableHead>{t("licenseCount")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name.en}</TableCell>
                    <TableCell>{product.price} IQD</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product._count?.licenseKeys ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? t("editProduct") : t("addProduct")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs defaultValue="en">
              <TabsList>
                {LOCALES.map((loc) => (
                  <TabsTrigger key={loc} value={loc}>
                    {LOCALE_LABELS[loc]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LOCALES.map((loc) => (
                <TabsContent key={loc} value={loc} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label>{t("name")} ({loc.toUpperCase()})</Label>
                    <Input
                      value={form.name[loc]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: { ...f.name, [loc]: e.target.value } }))
                      }
                      dir={loc === "ar" || loc === "ku" ? "rtl" : "ltr"}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("description")} ({loc.toUpperCase()})</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={form.description[loc]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: { ...f.description, [loc]: e.target.value } }))
                      }
                      dir={loc === "ar" || loc === "ku" ? "rtl" : "ltr"}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("price")} (IQD)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("imageUrl")}</Label>
                <Input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
