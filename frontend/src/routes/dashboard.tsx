import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BarChart3, IndianRupee, MessageSquare, Package, PlusCircle, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { Button, Card, DemoTag, ErrorState, LoadingState, SectionTitle } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { api } from "@/services/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — KarigarAI" },
      { name: "description", content: "Your products, orders, earnings and buyer enquiries at a glance." },
      { property: "og:title", content: "Dashboard — KarigarAI" },
      { property: "og:description", content: "Artisan dashboard with sales, listings and enquiries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { user } = useApp();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: api.getDashboard });

  const stats = data?.stats;
  const tiles = [
    { icon: Package, label: t("products"), value: stats?.products, tone: "bg-blush text-terracotta-deep" },
    { icon: BarChart3, label: t("orders"), value: stats?.orders, tone: "bg-mist/30 text-ink" },
    { icon: IndianRupee, label: t("earnings"), value: stats ? `₹${stats.earnings.toLocaleString("en-IN")}` : undefined, tone: "bg-sage/30 text-sage-deep" },
    { icon: MessageSquare, label: t("enquiries"), value: stats?.enquiries, tone: "bg-amber/30 text-ink" },
  ];

  return (
    <AppShell
      title={`${t("goodMorning")}, ${user?.name ? user.name.split(" ")[0] : "Artisan"}`}
      subtitle={t("yourCraftYourBusiness")}
      action={
        <div className="flex items-center gap-2">
          <Link to="/products/new">
            <Button>
              <PlusCircle className="size-4" aria-hidden="true" />
              {t("addProduct")}
            </Button>
          </Link>
        </div>
      }
    >
      {isError ? (
        <ErrorState message={t("somethingWrong")} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState label={t("loading")} />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
              <Card key={tile.label} className="p-5">
                <div className={`grid size-10 place-items-center rounded-2xl ${tile.tone}`}>
                  <tile.icon className="size-5" aria-hidden="true" />
                </div>
                <p className="mt-4 font-display text-2xl font-bold tabular-nums">{tile.value}</p>
                <p className="text-xs font-semibold text-soft uppercase">{tile.label}</p>
              </Card>
            ))}
          </div>

          <Card glass className="flex flex-wrap items-center gap-4 p-6">
            <div className="grid size-11 place-items-center rounded-2xl bg-terracotta text-cream">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold">{t("aiInsight")}</p>
              <p className="mt-1 text-sm text-soft">
                Bamboo baskets are getting the most enquiries this month. Adding two more sizes could lift orders by
                about 20%.
              </p>
            </div>
            <DemoTag />
          </Card>

          <div>
            <SectionTitle
              title={t("recentProducts")}
              aside={
                <Link to="/products" className="text-sm font-semibold text-terracotta-deep">
                  {t("products")} →
                </Link>
              }
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data?.recent.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
