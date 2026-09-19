import { Link } from "@tanstack/react-router";
import { MapPin, ShieldCheck, Award } from "lucide-react";

import { Badge, Card } from "@/components/ui-kit";
import { IMAGES, type Product } from "@/data/mockData";
import { ProductBadgesList } from "@/components/AuthenticityBadge";

const BADGE_LABEL: Record<string, string> = { trending: "Trending", new: "New", top: "Top rated" };

function getFallbackImage(name: string = "", category: string = ""): string {
  const n = `${name} ${category}`.toLowerCase();
  if (n.includes("paint") || n.includes("canvas") || n.includes("art") || n.includes("cartoon")) return IMAGES.painting;
  if (n.includes("textile") || n.includes("dupatta") || n.includes("cotton") || n.includes("handloom") || n.includes("indigo") || n.includes("saree")) return IMAGES.textile;
  if (n.includes("jewel") || n.includes("brass") || n.includes("necklace") || n.includes("diya") || n.includes("metal")) return IMAGES.jewellery;
  if (n.includes("wood") || n.includes("leather") || n.includes("wallet") || n.includes("bowl")) return IMAGES.wooden;
  return IMAGES.bamboo;
}

export function ProductCard({ product, to }: { product: Product; to?: "marketplace" | "manage" }) {
  const fallback = getFallbackImage(product.name, product.category);

  // Derive GI and badges
  const isGi = (product as any).is_gi_tagged || product.name?.toLowerCase().includes("bamboo") || product.name?.toLowerCase().includes("diya");
  const isWomen = (product as any).is_women_led || product.category?.includes("Textiles") || product.category?.includes("Handicrafts");
  const isSust = (product as any).is_sustainable || true;

  const body = (
    <Card className="group h-full overflow-hidden p-0 transition hover:-translate-y-1 surface-card border border-border/70 flex flex-col justify-between">
      <div>
        <div className="relative aspect-4/3 overflow-hidden bg-cream/30">
          <img
            src={product.image || fallback}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            {product.badge ? <Badge tone="brand">{BADGE_LABEL[product.badge]}</Badge> : null}
            {product.status === "draft" ? <Badge tone="warning">Draft</Badge> : null}
            {isGi && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-bold">
                <Award className="size-3" /> GI Tag
              </span>
            )}
          </div>
        </div>
        <div className="p-4 space-y-2">
          <p className="font-display text-base font-bold text-ink group-hover:text-terracotta transition">{product.name}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-soft font-medium">{product.category}</span>
          </div>

          <p className="flex items-center gap-1 text-xs text-soft">
            <MapPin className="size-3 shrink-0 text-terracotta" aria-hidden="true" />
            <span className="truncate">{product.artisan} · {product.location}</span>
          </p>

          <div className="pt-1">
            <ProductBadgesList
              isGiTagged={isGi}
              isHandmadeVerified={true}
              isWomenLed={isWomen}
              isSustainable={isSust}
            />
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border/40 flex items-center justify-between">
        <span className="font-display text-lg font-bold text-terracotta-deep">
          ₹{product.price.toLocaleString("en-IN")}
        </span>
        <span className="text-xs text-soft">{product.inventory} in stock</span>
      </div>
    </Card>
  );

  if (to === "manage") return body;
  return (
    <Link to="/marketplace/$id" params={{ id: product.id }} className="block h-full">
      {body}
    </Link>
  );
}
