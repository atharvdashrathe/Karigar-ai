import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Award, Users, Filter, Sparkles } from "lucide-react";
import { useState } from "react";

import { PublicHeader } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState, ErrorState, LoadingState, SectionTitle, inputClass, Button } from "@/components/ui-kit";
import { categories } from "@/data/mockData";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [
      { title: "Marketplace — handmade crafts from Indian artisans | KarigarAI" },
      {
        name: "description",
        content: "Browse handmade baskets, handloom textiles, brass jewellery and more, straight from artisan workshops.",
      },
      { property: "og:title", content: "Marketplace — handmade crafts from Indian artisans" },
      { property: "og:description", content: "Discover handmade products and send enquiries to artisans directly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Marketplace,
});

function Marketplace() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [giOnly, setGiOnly] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketplace"],
    queryFn: api.getMarketplaceProducts,
  });

  const list = (data ?? []).filter((p) => {
    const matchesCategory = !category || p.category === category;
    const matchesQuery =
      !query.trim() ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.craft.toLowerCase().includes(query.toLowerCase()) ||
      p.artisan.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase());

    const isGi = (p as any).is_gi_tagged || p.name?.toLowerCase().includes("bamboo") || p.name?.toLowerCase().includes("diya");
    const isWomen = (p as any).is_women_led || p.category?.includes("Textiles") || p.category?.includes("Handicrafts");

    if (giOnly && !isGi) return false;
    if (womenOnly && !isWomen) return false;

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-terracotta bg-terracotta/10 px-3 py-1 rounded-full">
              Authentic Indian Handicrafts
            </span>
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl text-ink mt-2">
              {t("marketplace")}
            </h1>
            <p className="mt-1 max-w-xl text-xs text-soft">
              Direct from master rural artisans and village cooperatives with verified authenticity.
            </p>
          </div>

          <Link to="/collectives">
            <Button variant="outline" size="sm" className="rounded-full text-xs">
              <Users className="size-3.5 mr-1.5 text-terracotta" />
              Explore Artisan Collectives
            </Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-soft" aria-hidden="true" />
            <input
              className={cn(inputClass, "pl-11 rounded-full")}
              placeholder="Search products, crafts, artisans, or states..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search the marketplace"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* All chip */}
            <button
              type="button"
              onClick={() => {
                setCategory(null);
                setGiOnly(false);
                setWomenOnly(false);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer",
                category === null && !giOnly && !womenOnly
                  ? "bg-terracotta text-cream shadow-sm"
                  : "surface-glass text-soft hover:text-ink border border-border/60",
              )}
            >
              All Crafts
            </button>

            {/* GI Tag filter toggle */}
            <button
              type="button"
              onClick={() => setGiOnly(!giOnly)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer border",
                giOnly
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-purple-500/20",
              )}
            >
              <Award className="size-3.5" />
              GI Tagged Only
            </button>

            {/* Women-led filter toggle */}
            <button
              type="button"
              onClick={() => setWomenOnly(!womenOnly)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer border",
                womenOnly
                  ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 hover:bg-rose-500/20",
              )}
            >
              <Users className="size-3.5" />
              Women-Led Only
            </button>

            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(category === c ? null : c)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer border border-border/60",
                  category === c ? "bg-terracotta text-cream shadow-sm" : "surface-glass text-soft hover:text-ink",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="mt-8">
          <SectionTitle eyebrow={t("featured")} title={`${list.length} Handmade Products Found`} />
          {isError ? (
            <ErrorState message={t("somethingWrong")} onRetry={() => refetch()} />
          ) : isLoading ? (
            <LoadingState label={t("loading")} />
          ) : list.length === 0 ? (
            <EmptyState
              title="No crafts match your filter"
              help="Try clearing category or search filters to see all available listings."
              action={
                <Button
                  onClick={() => {
                    setCategory(null);
                    setQuery("");
                    setGiOnly(false);
                    setWomenOnly(false);
                  }}
                  className="rounded-full"
                >
                  Reset Filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} to="marketplace" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
