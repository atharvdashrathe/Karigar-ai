import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PlusCircle, Plus, Minus, Mic, Package, Award, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ProductBadgesList } from "@/components/AuthenticityBadge";
import { Button, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";
import { offlineSync } from "@/lib/offline-sync";
import { cn } from "@/lib/utils";
import { type Product } from "@/data/mockData";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "My Products & Inventory — KarigarAI" },
      { name: "description", content: "Manage your craft catalog, stock levels and offline synchronization." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"published" | "draft">("published");
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["products"], queryFn: api.getProducts });

  const list = (data ?? []).filter((p) => p.status === tab);

  async function adjustStock(product: Product, delta: number) {
    const newStock = Math.max(0, (product.inventory || 0) + delta);

    // Optimistically update query client cache
    queryClient.setQueryData(["products"], (old: Product[] | undefined) => {
      if (!old) return [];
      return old.map((p) => (p.id === product.id ? { ...p, inventory: newStock } : p));
    });

    if (offlineSync.getIsOnline()) {
      try {
        await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/products/${product.id}/inventory?change=${delta}`, {
          method: "PATCH",
        });
        toast.success(`Updated stock for ${product.name}: ${newStock} units`);
      } catch {
        offlineSync.queueInventoryChange(product.id, delta);
        toast.info(`Stock change queued offline (${newStock} units)`);
      }
    } else {
      offlineSync.queueInventoryChange(product.id, delta);
      toast.info(`Offline: Stock adjustment queued (${newStock} units)`);
    }
  }

  return (
    <AppShell
      title={t("products")}
      subtitle="Manage your handmade listings, quick stock inventory and offline drafts."
      action={
        <div className="flex gap-2">
          <Link to="/products/new">
            <Button className="rounded-full bg-terracotta text-cream shadow-glow">
              <PlusCircle className="size-4 mr-1.5" aria-hidden="true" />
              {t("addProduct")}
            </Button>
          </Link>
        </div>
      }
    >
      <div className="surface-glass mb-6 inline-flex rounded-full p-1 border border-border/60" role="tablist">
        {(["published", "draft"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition cursor-pointer",
              tab === key ? "bg-terracotta text-cream shadow-sm" : "text-soft hover:text-ink",
            )}
          >
            {key === "published" ? "Published Listings" : "Drafts"}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState message={t("somethingWrong")} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState label={t("loading")} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No creations in this view"
          help="Speak to add a new craft product in 60 seconds."
          action={
            <Link to="/products/new">
              <Button className="rounded-full">{t("addProduct")}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} className="surface-card border border-border/80 overflow-hidden flex flex-col justify-between p-0 hover:shadow-md transition">
              <div>
                <div className="relative aspect-4/3 overflow-hidden bg-muted">
                  <img src={p.image} alt={p.name} className="size-full object-cover" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                      {p.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-display text-base font-bold text-ink truncate">{p.name}</h3>
                  <p className="font-display text-lg font-bold text-terracotta">₹{p.price.toLocaleString("en-IN")}</p>

                  <ProductBadgesList
                    isGiTagged={(p as any).is_gi_tagged || true}
                    isHandmadeVerified={true}
                    isWomenLed={(p as any).is_women_led || true}
                    isSustainable={true}
                  />
                </div>
              </div>

              {/* Simple Inventory [ - ] count [ + ] Adjuster */}
              <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-soft font-medium">Stock: </span>
                  <strong className="text-ink font-bold">{p.inventory || 0} units</strong>
                </div>

                <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-full p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => adjustStock(p, -1)}
                    disabled={(p.inventory || 0) <= 0}
                    className="size-7 rounded-full bg-muted hover:bg-muted/80 text-ink grid place-items-center disabled:opacity-30 transition cursor-pointer"
                    aria-label="Decrease stock"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="text-xs font-mono font-bold px-2 text-ink">{p.inventory || 0}</span>
                  <button
                    type="button"
                    onClick={() => adjustStock(p, 1)}
                    className="size-7 rounded-full bg-terracotta text-cream grid place-items-center hover:bg-terracotta-deep transition cursor-pointer"
                    aria-label="Increase stock"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
