"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getLocalizedText } from "@/lib/utils";

const PLATFORMS = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
  "Mobile",
  "Multiple Platforms",
  "Other",
];

interface Category {
  id: string;
  name: string;
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";
  const productId = params?.id as string;

  // Form state
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [platform, setPlatform] = useState("");
  const [deliveryType, setDeliveryType] = useState<"INSTANT" | "MANUAL">("INSTANT");

  // Page state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Field errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    Promise.all([
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/categories"),
      fetch(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([meRes, catRes, prodRes]) => {
        if (!meRes.ok) { router.push(`/${locale}/login`); return; }
        const me = await meRes.json();
        if (me.role !== "SELLER") { router.push(`/${locale}/dashboard`); return; }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories ?? []);
        }

        if (!prodRes.ok) { router.push(`/${locale}/dashboard`); return; }
        const product = await prodRes.json();

        // Verify ownership
        if (product.sellerId !== me.id && me.role !== "ADMIN") {
          router.push(`/${locale}/dashboard`);
          return;
        }

        // Pre-populate
        setTitleEn(getLocalizedText(product.title, "en"));
        setTitleAr(getLocalizedText(product.title, "ar"));
        setDescEn(getLocalizedText(product.description, "en"));
        setDescAr(getLocalizedText(product.description, "ar"));
        setPrice(String(product.price ?? ""));
        setImageUrl(product.imageUrl ?? "");
        setImagePreview(product.imageUrl ?? "");
        setCategoryId(product.categoryId ?? "");
        setPlatform(product.platform ?? "");
        setDeliveryType(product.deliveryType ?? "INSTANT");
      })
      .finally(() => setLoading(false));
  }, [locale, router, productId]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!titleEn.trim()) newErrors.titleEn = "English title is required";
    if (!titleAr.trim()) newErrors.titleAr = "Arabic title is required";
    if (!descEn.trim()) newErrors.descEn = "English description is required";
    if (!descAr.trim()) newErrors.descAr = "Arabic description is required";
    if (!price || Number(price) <= 0) newErrors.price = "Price must be greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    setError("");
    setSuccessMsg("");
    if (!validate()) return;

    const token = localStorage.getItem("auth_token");
    if (!token) { router.push(`/${locale}/login`); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        title: { en: titleEn.trim(), ar: titleAr.trim() },
        description: { en: descEn.trim(), ar: descAr.trim() },
        price: Number(price),
        deliveryType,
      };
      if (imageUrl.trim()) body.imageUrl = imageUrl.trim();
      else body.imageUrl = "";
      if (categoryId) body.categoryId = categoryId;
      if (platform) body.platform = platform;

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Listing updated successfully.");
      } else {
        setError(data.error ?? "Failed to update listing. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (
      !window.confirm(
        "Are you sure you want to deactivate this listing? It will no longer be visible to buyers."
      )
    )
      return;

    const token = localStorage.getItem("auth_token");
    if (!token) { router.push(`/${locale}/login`); return; }

    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push(`/${locale}/dashboard`);
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to deactivate listing.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Edit Listing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your product details. Changes apply to new orders immediately.
          </p>
        </div>

        {/* Success */}
        {successMsg && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {successMsg}
          </div>
        )}

        {/* Global error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/8 bg-card/60 p-8 backdrop-blur-sm">
          <div className="space-y-8">

            {/* EN / AR Bilingual Fields */}
            <Tabs defaultValue="en">
              <TabsList className="mb-4">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
              </TabsList>

              <TabsContent value="en">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="titleEn"
                      className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      Title (EN)
                    </label>
                    <Input
                      id="titleEn"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      onBlur={() => {
                        if (!titleEn.trim())
                          setErrors((prev) => ({ ...prev, titleEn: "English title is required" }));
                        else
                          setErrors((prev) => { const n = { ...prev }; delete n.titleEn; return n; });
                      }}
                      className="rounded-xl"
                    />
                    {errors.titleEn && (
                      <p className="mt-1 text-xs text-red-400">{errors.titleEn}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="descEn"
                      className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      Description (EN)
                    </label>
                    <Textarea
                      id="descEn"
                      value={descEn}
                      onChange={(e) => setDescEn(e.target.value)}
                      onBlur={() => {
                        if (!descEn.trim())
                          setErrors((prev) => ({ ...prev, descEn: "English description is required" }));
                        else
                          setErrors((prev) => { const n = { ...prev }; delete n.descEn; return n; });
                      }}
                      rows={4}
                      className="rounded-xl"
                    />
                    {errors.descEn && (
                      <p className="mt-1 text-xs text-red-400">{errors.descEn}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ar">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="titleAr"
                      className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      العنوان (AR)
                    </label>
                    <Input
                      id="titleAr"
                      dir="rtl"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      onBlur={() => {
                        if (!titleAr.trim())
                          setErrors((prev) => ({ ...prev, titleAr: "Arabic title is required" }));
                        else
                          setErrors((prev) => { const n = { ...prev }; delete n.titleAr; return n; });
                      }}
                      className="rounded-xl"
                    />
                    {errors.titleAr && (
                      <p className="mt-1 text-xs text-red-400">{errors.titleAr}</p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="descAr"
                      className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      الوصف (AR)
                    </label>
                    <Textarea
                      id="descAr"
                      dir="rtl"
                      value={descAr}
                      onChange={(e) => setDescAr(e.target.value)}
                      onBlur={() => {
                        if (!descAr.trim())
                          setErrors((prev) => ({ ...prev, descAr: "Arabic description is required" }));
                        else
                          setErrors((prev) => { const n = { ...prev }; delete n.descAr; return n; });
                      }}
                      rows={4}
                      className="rounded-xl"
                    />
                    {errors.descAr && (
                      <p className="mt-1 text-xs text-red-400">{errors.descAr}</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Price */}
            <div>
              <label
                htmlFor="price"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Price (USD)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={() => {
                    if (!price || Number(price) <= 0)
                      setErrors((prev) => ({ ...prev, price: "Price must be greater than 0" }));
                    else
                      setErrors((prev) => { const n = { ...prev }; delete n.price; return n; });
                  }}
                  className="rounded-xl pl-7"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-xs text-red-400">{errors.price}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Platform */}
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Platform
              </label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Type */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Delivery Type
              </label>
              <RadioGroup
                value={deliveryType}
                onValueChange={(v) => setDeliveryType(v as "INSTANT" | "MANUAL")}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 rounded-xl border border-white/8 px-4 py-3 transition-colors hover:bg-secondary/20">
                  <RadioGroupItem value="INSTANT" id="instant" className="mt-0.5" />
                  <div>
                    <Label htmlFor="instant" className="cursor-pointer font-medium text-foreground">
                      Instant Key
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Buyer receives the license key immediately after payment
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-white/8 px-4 py-3 transition-colors hover:bg-secondary/20">
                  <RadioGroupItem value="MANUAL" id="manual" className="mt-0.5" />
                  <div>
                    <Label htmlFor="manual" className="cursor-pointer font-medium text-foreground">
                      Manual Delivery
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You post the credentials after receiving the order
                    </p>
                  </div>
                </div>
              </RadioGroup>
              <p className="mt-2 text-xs text-muted-foreground">
                Changing delivery type affects new orders only. Existing orders are unaffected.
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label
                htmlFor="imageUrl"
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                Image URL (Optional)
              </label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onBlur={() => setImagePreview(imageUrl.trim())}
                className="rounded-xl"
                placeholder="https://example.com/image.png"
              />
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-2 h-16 w-16 rounded-lg object-cover"
                  onError={() => setImagePreview("")}
                />
              )}
            </div>

            {/* Save Changes */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-accent py-3 font-bold text-accent-foreground"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>

            {/* Deactivate Listing */}
            <Button
              variant="ghost"
              onClick={handleDeactivate}
              disabled={deleting}
              className="w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Deactivate Listing"
              )}
            </Button>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
