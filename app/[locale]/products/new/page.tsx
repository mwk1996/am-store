"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Plus, Trash2, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Tab = "details" | "pricing" | "keys";

const CATEGORIES = [
  { id: "game-accounts", name: "Game Accounts" },
  { id: "software-keys", name: "Software Keys" },
];

export default function NewProductPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";

  const [tab, setTab] = useState<Tab>("details");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    type: "SOFTWARE_KEY",
    categoryId: "",
    images: [] as string[],
    attributes: {} as Record<string, string>,
  });
  const [keysText, setKeysText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push(`/${locale}/login`); return; }

    setSubmitting(true);
    setError("");

    try {
      // Create product
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to create product");
        return;
      }

      const product = await res.json();

      // Upload keys if provided
      if (keysText.trim() && form.type === "SOFTWARE_KEY") {
        await fetch(`/api/products/${product.id}/keys`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ keys: keysText }),
        });
      }

      router.push(`/${locale}/dashboard`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/dashboard`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-foreground">Add New Product</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-secondary/30 p-1">
          {(["details", "pricing", "keys"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Details Tab */}
          {tab === "details" && (
            <div className="space-y-4 rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
              <Field label="Product Title" required>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Windows 11 Pro Key"
                  className="input-field"
                />
              </Field>

              <Field label="Description" required>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe what the buyer receives…"
                  className="input-field resize-none"
                />
              </Field>

              <Field label="Product Type" required>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="input-field"
                >
                  <option value="SOFTWARE_KEY">Software Key</option>
                  <option value="GAME_ACCOUNT">Game Account</option>
                </select>
              </Field>

              <Field label="Category">
                <select
                  value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  className="input-field"
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              {/* Images */}
              <Field label="Product Images">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrl.trim()) {
                        set("images", [...form.images, imageUrl.trim()]);
                        setImageUrl("");
                      }
                    }}
                    className="rounded-lg bg-secondary/50 px-3 text-sm text-foreground hover:bg-secondary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {form.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="group relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="h-16 w-16 rounded-lg object-cover" />
                        <button
                          type="button"
                          onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                          className="absolute -right-1 -top-1 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          )}

          {/* Pricing Tab */}
          {tab === "pricing" && (
            <div className="space-y-4 rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
              <Field label="Price (USD)" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="0.00"
                    className="input-field pl-7"
                  />
                </div>
              </Field>

              <div className="rounded-lg bg-secondary/20 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Commission Info</p>
                <p>Platform takes 10% commission. You receive 90% of the sale price.</p>
                {form.price && (
                  <p className="mt-2 text-foreground">
                    You&apos;ll receive: <strong>${(parseFloat(form.price) * 0.9).toFixed(2)}</strong> per sale
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Keys Tab */}
          {tab === "keys" && (
            <div className="space-y-4 rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm">
              {form.type !== "SOFTWARE_KEY" ? (
                <p className="text-sm text-muted-foreground">
                  Key upload is only for Software Key products. Switch the product type to enable this.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Paste your activation keys below — one per line. Keys are stored securely and
                    automatically delivered on purchase.
                  </p>
                  <Field label="Activation Keys">
                    <textarea
                      rows={10}
                      value={keysText}
                      onChange={(e) => setKeysText(e.target.value)}
                      placeholder={"KEY-XXXX-XXXX-XXXX\nKEY-YYYY-YYYY-YYYY\n…"}
                      className="input-field resize-none font-mono text-xs"
                    />
                  </Field>
                  {keysText.trim() && (
                    <p className="text-xs text-muted-foreground">
                      {keysText.trim().split("\n").filter(Boolean).length} keys will be uploaded
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <div className="mt-6 flex gap-3">
            {tab !== "details" && (
              <button
                type="button"
                onClick={() => setTab(tab === "keys" ? "pricing" : "details")}
                className="flex-1 rounded-lg border border-border/60 py-2.5 text-sm text-foreground hover:bg-secondary/40 transition-colors"
              >
                Back
              </button>
            )}
            {tab !== "keys" ? (
              <button
                type="button"
                onClick={() => setTab(tab === "details" ? "pricing" : "keys")}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Creating…" : "Create Product"}
              </button>
            )}
          </div>
        </form>
      </main>

      <Footer locale={locale} />
    </div>
  );
}

function Field({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
