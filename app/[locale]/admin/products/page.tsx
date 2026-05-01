"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: { en: string; ar: string; tr: string; ku: string };
  description: { en: string; ar: string; tr: string; ku: string };
  price: string;
  imageUrl?: string | null;
  category?: string | null;
  _count?: { licenseKeys: number };
}

const LOCALES = ["en", "ar", "tr", "ku"] as const;
const LOCALE_LABELS: Record<string, string> = { en: "English", ar: "العربية", tr: "Türkçe", ku: "کوردی" };

const CATEGORIES = [
  "General",
  "Windows",
  "Office",
  "Antivirus",
  "Design",
  "Development",
  "Other",
] as const;

const emptyForm = () => ({
  name: { en: "", ar: "", tr: "", ku: "" },
  description: { en: "", ar: "", tr: "", ku: "" },
  price: "",
  imageUrl: "",
  category: "General",
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
      setProducts(await res.json());
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
      category: product.category ?? "General",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
      const res = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
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
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {t("addProduct")}
        </button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("name")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("category")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("price")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("licenseCount")}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => (
                  <tr key={product.id} className={`transition-colors hover:bg-secondary/30 ${i !== products.length - 1 ? "border-b border-border/40" : ""}`}>
                    <td className="px-4 py-3 font-medium">{product.name.en}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex rounded-full bg-secondary/60 px-2.5 py-0.5 text-xs">
                        {product.category ?? "General"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{product.price} IQD</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20">
                        {product._count?.licenseKeys ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground cursor-pointer"
                          title={t("editProduct")}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          title={t("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle>{editingProduct ? t("editProduct") : t("addProduct")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs defaultValue="en">
              <TabsList className="bg-secondary/50">
                {LOCALES.map((loc) => (
                  <TabsTrigger key={loc} value={loc}>{LOCALE_LABELS[loc]}</TabsTrigger>
                ))}
              </TabsList>
              {LOCALES.map((loc) => (
                <TabsContent key={loc} value={loc} className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <Label>{t("name")} ({loc.toUpperCase()})</Label>
                    <Input
                      value={form.name[loc]}
                      onChange={(e) => setForm((f) => ({ ...f, name: { ...f.name, [loc]: e.target.value } }))}
                      dir={loc === "ar" || loc === "ku" ? "rtl" : "ltr"}
                      className="border-border/60 bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("description")} ({loc.toUpperCase()})</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
                      value={form.description[loc]}
                      onChange={(e) => setForm((f) => ({ ...f, description: { ...f.description, [loc]: e.target.value } }))}
                      dir={loc === "ar" || loc === "ku" ? "rtl" : "ltr"}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("price")} (IQD)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="border-border/60 bg-secondary/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("imageUrl")}</Label>
                <Input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="border-border/60 bg-secondary/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("category")}</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm((f) => ({ ...f, category: val }))}
              >
                <SelectTrigger className="border-border/60 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {saving ? t("saving") : t("save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
