import { Link, createFileRoute } from "@tanstack/react-router";
import { Camera, IndianRupee, Languages, Mic, Sparkles, Store } from "lucide-react";

import { PublicHeader } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { Button, Card, FadeIn, SectionTitle } from "@/components/ui-kit";
import { products } from "@/data/mockData";
import heroImage from "@/assets/product-bamboo-basket.jpg";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KarigarAI — Turn your craft into opportunity" },
      {
        name: "description",
        content:
          "Artisans create professional listings by speaking in their own language. AI writes the catalogue, scores photos and suggests a fair price.",
      },
      { property: "og:title", content: "KarigarAI — Turn your craft into opportunity" },
      {
        property: "og:description",
        content: "Voice-first listings, photo enhancement and price guidance for Indian artisans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { icon: Camera, title: "Photograph", body: "Snap the product. We score lighting, sharpness and background." },
  { icon: Mic, title: "Speak", body: "Describe it in Marathi, Hindi or English — no typing needed." },
  { icon: Sparkles, title: "AI builds the listing", body: "Title, category, materials, keywords and a story-led description." },
  { icon: IndianRupee, title: "Price & publish", body: "See a fair price range, then publish to the buyer marketplace." },
];

const CAPABILITIES = [
  { icon: Languages, title: "Three languages", body: "Every screen switches between English, हिन्दी and मराठी instantly." },
  { icon: Camera, title: "Photo studio", body: "Clean background, better lighting and a quality score out of 100." },
  { icon: IndianRupee, title: "Fair price guidance", body: "Cost, margin and a confident range instead of guesswork." },
  { icon: Store, title: "Buyer marketplace", body: "Stores and gifting buyers browse and send enquiries directly." },
];

function Landing() {
  const { t } = useI18n();
  const featured = products.filter((p) => p.status === "published").slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="ambient-glow -top-20 right-0 size-96 bg-amber/40" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <FadeIn>
            <p className="text-xs font-bold tracking-[0.3em] text-terracotta uppercase">SIH 2026 · SIH26090</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] font-black tracking-tight sm:text-6xl">
              {t("heroTitle")} <span className="text-terracotta">{t("heroTitleAccent")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-soft sm:text-lg">{t("heroSub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg">{t("startSelling")}</Button>
              </Link>
              <Link to="/marketplace">
                <Button size="lg" variant="glass">
                  {t("exploreMarketplace")}
                </Button>
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                ["7M+", "artisans in India"],
                ["3", "languages supported"],
                ["90s", "to a full listing"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-bold text-terracotta-deep">{value}</dt>
                  <dd className="text-xs text-soft">{label}</dd>
                </div>
              ))}
            </dl>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="relative">
              <img
                src={heroImage}
                alt="Hand-woven bamboo basket made by an artisan in Sangli"
                className="w-full rounded-[2rem] object-cover shadow-glow"
              />
              <Card glass className="absolute -bottom-6 left-4 w-56 p-4">
                <p className="text-xs font-semibold text-soft uppercase">{t("aiPrice")}</p>
                <p className="font-display text-2xl font-bold">₹699</p>
                <p className="text-xs text-soft">Range ₹650 – ₹800 · 86% confidence</p>
              </Card>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <SectionTitle eyebrow={t("howItWorks")} title="Four steps from workshop to buyer" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.08}>
              <Card className="h-full p-6">
                <div className="grid size-11 place-items-center rounded-2xl bg-blush text-terracotta-deep">
                  <s.icon className="size-5" aria-hidden="true" />
                </div>
                <p className="mt-4 font-display text-lg font-bold">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-2 text-sm text-soft">{s.body}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <SectionTitle eyebrow={t("capabilities")} title="Built for how artisans actually work" />
        <div className="grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map((c, i) => (
            <FadeIn key={c.title} delay={i * 0.06}>
              <Card glass className="flex h-full gap-4 p-6">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage/30 text-sage-deep">
                  <c.icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold">{c.title}</p>
                  <p className="mt-1 text-sm text-soft">{c.body}</p>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <SectionTitle
          eyebrow={t("featured")}
          title="Handmade, from real workshops"
          aside={
            <Link to="/marketplace" className="text-sm font-semibold text-terracotta-deep">
              {t("exploreMarketplace")} →
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-soft lg:px-8">
          <p>KarigarAI · {t("tagline")}</p>
          <p>Prototype with demo data — Smart India Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
