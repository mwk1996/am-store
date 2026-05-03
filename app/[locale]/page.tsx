import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ProductsSection } from "@/components/products-section";
import { Zap, Shield, CheckCircle, Clock, Star, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface StorePageProps {
  params: { locale: string };
}

const testimonials = [
  {
    initials: "AH",
    name: "Ahmed Hassan",
    location: "Baghdad, Iraq",
    rating: 5,
    text: "Got my Windows license key instantly after payment. Works perfectly. Great service!",
  },
  {
    initials: "SM",
    name: "Sara Mahmoud",
    location: "Erbil, Iraq",
    rating: 5,
    text: "Very fast delivery and the key was 100% genuine. Activated on first try. Highly recommend.",
  },
  {
    initials: "KA",
    name: "Karwan Ali",
    location: "Sulaymaniyah, Iraq",
    rating: 5,
    text: "Bought Office 365 here. The process was smooth, payment was easy, and I received my key in seconds.",
  },
];

const paymentBadges = [
  "Visa",
  "Mastercard",
  "PayPal",
  "Bank Transfer",
  "ZainCash",
  "AsiaHawala",
];

export default async function StorePage({ params: { locale } }: StorePageProps) {
  const t = await getTranslations("store");

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          keys: { where: { isUsed: false } },
        },
      },
    },
  });

  const availableProducts = products
    .filter((p) => p._count.keys > 0)
    .map((p) => ({
      ...p,
      price: p.price.toString(),
      title: p.title as Record<string, string>,
      description: p.description as Record<string, string>,
    }));

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 text-center sm:px-6 lg:px-8">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute left-1/4 top-1/3 h-[200px] w-[300px] rounded-full bg-accent/4 blur-3xl" />
          <div className="absolute right-1/4 top-1/4 h-[150px] w-[250px] rounded-full bg-primary/4 blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl animate-fade-in">
          {/* Badge pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary shadow-sm shadow-primary/10">
            <Zap className="h-3 w-3" />
            Instant license delivery
          </div>

          {/* Headline */}
          <h1 className="prose-balanced text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">{t("title")}</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground max-w-xl mx-auto prose-balanced">
            {t("subtitle")}
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-primary" />
              Secure payment
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 text-primary" />
              Instant delivery
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-primary" />
              Genuine licenses
            </span>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-10 grid max-w-sm grid-cols-3 gap-4">
            {[
              { value: "500+", label: "Orders" },
              { value: "99%", label: "Satisfaction" },
              { value: "24/7", label: "Support" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-white/8 bg-card/60 px-3 py-4 text-center backdrop-blur-sm"
              >
                <p className="text-2xl font-black text-foreground">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div className="mt-6">
            <Link
              href="#products"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-base font-bold text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/25 transition-all duration-200 cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              {t("shopNow")}
            </Link>
          </div>
        </div>
      </section>

      {/* Products */}
      <main id="products" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Available Licenses</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            All genuine
          </span>
        </div>

        <ProductsSection
          products={availableProducts}
          locale={locale}
          buyLabel={t("buyNow")}
          currency={t("currency")}
          allLabel={t("allCategories")}
          searchPlaceholder={t("searchPlaceholder")}
          noResultsLabel={t("noResults")}
          noProductsLabel={t("noProducts")}
        />
      </main>

      {/* Testimonials */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
          {t("testimonials")}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map(({ initials, name, location, rating, text }) => (
            <div
              key={name}
              className="rounded-2xl border border-white/8 bg-card/60 p-6 backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-md shadow-blue-500/20">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{location}</p>
                </div>
              </div>
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-amber-400"
                    fill="currentColor"
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Payment methods */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-lg font-semibold text-foreground">
          {t("paymentMethods")}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {paymentBadges.map((method) => (
            <span
              key={method}
              className="rounded-full border border-white/8 bg-secondary/60 px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              {method}
            </span>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t("trustedBy")}</p>
      </section>

      {/* Features / reassurance section */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Instant Delivery",
              description: "Get your license key immediately after payment",
              color: "text-accent",
              bg: "bg-accent/8",
              border: "border-accent/15",
            },
            {
              icon: Shield,
              title: "Secure Payment",
              description: "Your transaction is protected end-to-end",
              color: "text-primary",
              bg: "bg-primary/8",
              border: "border-primary/15",
            },
            {
              icon: CheckCircle,
              title: "Genuine Keys",
              description: "All keys are 100% authentic and verified",
              color: "text-emerald-400",
              bg: "bg-emerald-500/8",
              border: "border-emerald-500/15",
            },
          ].map(({ icon: Icon, title, description, color, bg, border }) => (
            <div
              key={title}
              className={`rounded-2xl border ${border} ${bg} p-6 backdrop-blur-sm`}
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${border} bg-background/40`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
