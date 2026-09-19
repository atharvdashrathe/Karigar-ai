import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Users, Package, ShoppingBag, MessageSquare, Check, X, Award, AlertCircle, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, SectionTitle, Badge, Button } from "@/components/ui-kit";
import { api } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal & Verification Dashboard — Karigar AI" },
      { name: "description", content: "Platform moderation, artisan verification, product approval and GI tag management." },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    total_artisans: 28,
    total_products: 48,
    total_orders: 34,
    total_enquiries: 19,
    total_sales: 68450,
    pending_artisan_verifications: 3,
    pending_product_approvals: 2,
  });

  const [artisans, setArtisans] = useState([
    {
      id: "art-1",
      name: "Savita Patil",
      location: "Sangli, Maharashtra",
      craft_type: "Traditional Bamboo Weaving",
      experience_years: 12,
      is_verified: true,
      product_count: 6,
    },
    {
      id: "art-2",
      name: "Ravi Kulkarni",
      location: "Belagavi, Karnataka",
      craft_type: "Handloom Textiles",
      experience_years: 9,
      is_verified: true,
      product_count: 4,
    },
    {
      id: "art-3",
      name: "Anita Mistry",
      location: "Bhuj, Gujarat",
      craft_type: "Heritage Brass & Metal Craft",
      experience_years: 7,
      is_verified: false,
      product_count: 3,
    },
    {
      id: "art-4",
      name: "Deepak Jadhav",
      location: "Ratnagiri, Maharashtra",
      craft_type: "Folk & Canvas Painting",
      experience_years: 14,
      is_verified: false,
      product_count: 2,
    },
  ]);

  const [products, setProducts] = useState([
    {
      id: "p1",
      name: "Handmade Bamboo Storage Basket",
      artisan: "Savita Patil",
      category: "Home Décor",
      price: 699,
      is_gi_tagged: true,
      is_women_led: true,
      is_sustainable: true,
      status: "published",
    },
    {
      id: "p2",
      name: "Hand-Painted Canvas Artwork",
      artisan: "Deepak Jadhav",
      category: "Art & Paintings",
      price: 1450,
      is_gi_tagged: false,
      is_women_led: false,
      is_sustainable: true,
      status: "published",
    },
    {
      id: "p3",
      name: "Heritage Brass Diya Lamp",
      artisan: "Anita Mistry",
      category: "Artisan Jewellery",
      price: 1299,
      is_gi_tagged: true,
      is_women_led: true,
      is_sustainable: false,
      status: "published",
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/admin/metrics`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch {}
    }
    loadData();
  }, []);

  async function toggleArtisanVerification(id: string, current: boolean) {
    try {
      await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/admin/artisans/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: !current }),
      });
    } catch {}

    setArtisans((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_verified: !current } : a))
    );
    toast.success(`Artisan verification updated!`);
  }

  async function toggleProductGiTag(id: string, current: boolean) {
    try {
      await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/admin/products/${id}/verify-badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_gi_tagged: !current }),
      });
    } catch {}

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_gi_tagged: !current } : p))
    );
    toast.success("GI Tag status updated!");
  }

  return (
    <AppShell
      title="Admin & Verification Portal"
      subtitle="Verify rural artisans, approve authenticity badges and monitor platform activity."
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="surface-card p-4 border border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-soft">Total Artisans</span>
              <Users className="size-4 text-terracotta" />
            </div>
            <p className="font-display text-2xl font-bold text-ink mt-2">{metrics.total_artisans}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">{metrics.pending_artisan_verifications} pending verification</p>
          </Card>

          <Card className="surface-card p-4 border border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-soft">Total Products</span>
              <Package className="size-4 text-purple-600" />
            </div>
            <p className="font-display text-2xl font-bold text-ink mt-2">{metrics.total_products}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">100% handmade verified</p>
          </Card>

          <Card className="surface-card p-4 border border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-soft">Orders Fulfilled</span>
              <ShoppingBag className="size-4 text-emerald-600" />
            </div>
            <p className="font-display text-2xl font-bold text-ink mt-2">{metrics.total_orders}</p>
            <p className="text-[11px] text-soft mt-0.5">Across 14 states</p>
          </Card>

          <Card className="surface-card p-4 border border-border/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-soft">Platform Volume</span>
              <Award className="size-4 text-amber-500" />
            </div>
            <p className="font-display text-2xl font-bold text-terracotta mt-2">₹{metrics.total_sales.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Direct to rural artisans</p>
          </Card>
        </div>

        {/* Artisan Verification Table */}
        <Card className="border border-border/80">
          <SectionTitle
            title="Artisan Verification Queue"
            subtitle="Approve verified credentials for genuine rural handicraft practitioners."
          />

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-soft">
                  <th className="pb-3 font-semibold">Artisan Name</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold">Craft Tradition</th>
                  <th className="pb-3 font-semibold">Experience</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {artisans.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition">
                    <td className="py-3.5 font-bold text-ink">{a.name}</td>
                    <td className="py-3.5 text-soft">{a.location}</td>
                    <td className="py-3.5 text-ink/80">{a.craft_type}</td>
                    <td className="py-3.5 text-soft">{a.experience_years} years</td>
                    <td className="py-3.5">
                      {a.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                          <ShieldCheck className="size-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <Button
                        size="sm"
                        variant={a.is_verified ? "outline" : "default"}
                        onClick={() => toggleArtisanVerification(a.id, a.is_verified)}
                        className="rounded-full text-[11px] h-7 px-3"
                      >
                        {a.is_verified ? "Revoke" : "Verify Artisan"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Product Badges & GI Tag Moderation */}
        <Card className="border border-border/80">
          <SectionTitle
            title="Product Authenticity & GI Tag Management"
            subtitle="Grant official Geographical Indication (GI) tags and sustainability badges."
          />

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-soft">
                  <th className="pb-3 font-semibold">Product Title</th>
                  <th className="pb-3 font-semibold">Artisan</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">GI Tag Status</th>
                  <th className="pb-3 font-semibold">Badges</th>
                  <th className="pb-3 font-semibold text-right">Toggle GI Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition">
                    <td className="py-3.5 font-bold text-ink">{p.name}</td>
                    <td className="py-3.5 text-soft">{p.artisan}</td>
                    <td className="py-3.5 font-semibold text-terracotta">₹{p.price}</td>
                    <td className="py-3.5">
                      {p.is_gi_tagged ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold text-[11px]">
                          ✓ GI Tagged
                        </span>
                      ) : (
                        <span className="text-soft text-[11px]">Standard Craft</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="flex gap-1">
                        {p.is_women_led && <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-700">Women-Led</span>}
                        {p.is_sustainable && <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-700">Eco-Friendly</span>}
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleProductGiTag(p.id, p.is_gi_tagged)}
                        className="rounded-full text-[11px] h-7 px-3"
                      >
                        {p.is_gi_tagged ? "Remove GI" : "Grant GI Tag"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
