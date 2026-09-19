import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, MapPin, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, SectionTitle, Badge, Button } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/collectives")({
  head: () => ({
    meta: [
      { title: "Artisan Collectives & Clusters — Karigar AI" },
      { name: "description", content: "Explore authentic rural artisan cooperatives and craft clusters across India." },
    ],
  }),
  component: CollectivesPage,
});

const DEMO_COLLECTIVES = [
  {
    id: "kolhapur-artisan-collective",
    name: "Kolhapur Artisan Collective",
    location: "Kolhapur, Maharashtra",
    state: "Maharashtra",
    craft: "Traditional Leatherwork & Metalcasting",
    artisans: 24,
    products: 42,
    description: "A century-old generational cooperative preserving genuine vegetable-tanned Kolhapuri craft and fine brass engravings.",
    image: "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?w=600&auto=format&fit=crop&q=80",
    isVerified: true,
  },
  {
    id: "kutch-heritage-weavers",
    name: "Kutch Heritage Weavers Sangha",
    location: "Bhuj, Gujarat",
    state: "Gujarat",
    craft: "Handloom & Organic Cotton Weaving",
    artisans: 42,
    products: 68,
    description: "Empowering over 40 master women weavers crafting authentic GI-tagged organic cotton sarees and natural indigo shawls.",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
    isVerified: true,
  },
  {
    id: "madhubani-folk-collective",
    name: "Mithila Madhubani Artists Sangha",
    location: "Madhubani, Bihar",
    state: "Bihar",
    craft: "Folk & Natural Pigment Painting",
    artisans: 31,
    products: 55,
    description: "Generational folk painters expressing rural folklore and mythological nature motifs with hand-ground plant dyes on handmade archival paper.",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
    isVerified: true,
  },
  {
    id: "bastar-dhokra-cooperative",
    name: "Bastar Dhokra Metalsmiths Guild",
    location: "Bastar, Chhattisgarh",
    state: "Chhattisgarh",
    craft: "Lost-Wax Brass & Bell Metal Casting",
    artisans: 19,
    products: 29,
    description: "Preserving 4,000-year-old tribal lost-wax metallurgy techniques to create stunning ethnic brass figurines and festive lamps.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80",
    isVerified: true,
  },
];

function CollectivesPage() {
  const { t } = useI18n();

  return (
    <AppShell
      title="Artisan Collectives"
      subtitle="Discover authentic rural craft clusters, village self-help groups and cooperative guilds across India."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEMO_COLLECTIVES.map((c) => (
            <Card key={c.id} className="overflow-hidden border border-border/80 flex flex-col justify-between hover:shadow-glow transition-all">
              <div>
                <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-muted">
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-cream text-xs font-semibold">
                      <Users className="size-3.5 text-terracotta" />
                      {c.artisans} Master Artisans
                    </span>
                  </div>
                  {c.isVerified && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-semibold">
                        <ShieldCheck className="size-3.5" />
                        Verified Cluster
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-terracotta font-semibold">
                    <MapPin className="size-3.5" />
                    <span>{c.location}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-ink">{c.name}</h3>
                  <p className="text-xs text-soft font-medium">Craft: {c.craft}</p>
                  <p className="text-xs text-ink/80 leading-relaxed pt-1">{c.description}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-soft">{c.products} Creations Available</span>
                <Link to="/marketplace">
                  <Button size="sm" variant="outline" className="rounded-full text-xs">
                    Explore Products
                    <ArrowRight className="size-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
