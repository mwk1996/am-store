"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Mail, Clock, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const t = useTranslations("contact");
  const tp = useTranslations("policies");

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
    } catch {
      alert(t("errorMsg"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />
        </div>
        <div className="mx-auto max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="gradient-text">{t("title")}</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/8 bg-card/60 p-8 backdrop-blur-sm">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{t("successTitle")}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{t("successMsg")}</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="mt-6 rounded-lg border border-white/10 bg-secondary/40 px-5 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="block text-sm font-medium text-foreground">
                        {t("name")}
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder={t("namePlaceholder")}
                        className="h-10 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        {t("email")}
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder={t("emailPlaceholder")}
                        className="h-10 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground">
                      {t("subject")}
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      placeholder={t("subjectPlaceholder")}
                      className="h-10 w-full rounded-lg border border-border/60 bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="block text-sm font-medium text-foreground">
                      {t("message")}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder={t("messagePlaceholder")}
                      className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                  >
                    {sending ? t("sending") : t("send")}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Info card */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/8 bg-card/60 p-8 backdrop-blur-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/8">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("orEmail")}</p>
                  <a
                    href={`mailto:${t("supportEmail")}`}
                    className="mt-1 block text-sm text-primary hover:underline cursor-pointer"
                  >
                    {t("supportEmail")}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/15 bg-accent/8">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("responseTime")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We reply to every inquiry, typically within a few hours.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <Link
                  href={`/${locale}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-pointer"
                >
                  {tp("backHome")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
