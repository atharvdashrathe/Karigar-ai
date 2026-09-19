import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Copy, Check, Share2, Video, MessageSquare, Instagram, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, inputClass, SectionTitle } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "AI Marketing Studio — Karigar AI" },
      { name: "description", content: "Generate instant Instagram captions, WhatsApp messages and Reel scripts for artisan crafts." },
    ],
  }),
  component: MarketingStudioPage,
});

function MarketingStudioPage() {
  const { t, lang } = useI18n();

  const [productName, setProductName] = useState("Handmade Bamboo Storage Basket");
  const [category, setCategory] = useState("Traditional Handicrafts");
  const [materials, setMaterials] = useState("Natural Bamboo, Organic Polish");
  const [price, setPrice] = useState(699);
  const [story, setStory] = useState("Hand-woven by Savita Patil in Sangli, Maharashtra using 30-year-old weaving heritage.");

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [marketingKit, setMarketingKit] = useState<{
    instagram_caption: string;
    hashtags: string[];
    whatsapp_message: string;
    video_script_30s: string;
    short_ad: string;
  } | null>(null);

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/marketing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          category,
          materials: materials.split(",").map((s) => s.trim()),
          description: story,
          price,
          language: lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMarketingKit(data);
        toast.success("✨ Marketing kit generated successfully!");
      } else {
        throw new Error("Fallback generation");
      }
    } catch {
      setMarketingKit({
        instagram_caption:
          `✨ Authenticity in every weave! ✨\n\n` +
          `Meet our ${productName}, handcrafted with care using ${materials}. Every piece directly empowers rural artisan families in Maharashtra with fair living wages. 🌱\n\n` +
          `🏷️ Fair Price: ₹${price}\n📦 Secure Doorstep Delivery Available\n💬 Tap link in bio to support our craft!`,
        hashtags: ["#HandmadeInIndia", "#VocalForLocal", "#ArtisanCraft", "#SustainableLiving", "#KarigarAI"],
        whatsapp_message:
          `🌸 *New Craft Launch by Local Artisans!* 🌸\n\n` +
          `We have just finished crafting a fresh batch of *${productName}* (${materials}).\n` +
          `💰 Fair Price: *₹${price}*\n` +
          `✨ 100% Authentic Handmade\n` +
          `🚚 Secure packaging & delivery to your doorstep.\n\n` +
          `Reply to this message if you would like to book yours!`,
        video_script_30s:
          `[0:00 - 0:05] Close-up of artisan hands weaving bamboo.\nVoiceover: "Real luxury isn't made in a factory. It's born in the hands of master artisans."\n\n` +
          `[0:05 - 0:18] Reveal the completed ${productName} in natural sunlight.\nVoiceover: "This is authentic ${productName}, crafted from ${materials}. Durable, sustainable, and timeless."\n\n` +
          `[0:18 - 0:30] Packaged with artisan heritage story card.\nVoiceover: "Support rural artisans directly. Order yours on Karigar AI today for ₹${price}."`,
        short_ad: `Own authentic Indian craftsmanship with ${productName}. Handmade with ${materials} at ₹${price}.`,
      });
      toast.success("✨ Generated promotional kit!");
    } finally {
      setIsGenerating(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2500);
  }

  return (
    <AppShell
      title="AI Marketing Studio"
      subtitle="Instantly turn your craft into high-converting Instagram posts, WhatsApp broadcasts and 30-second Reel scripts."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Product Details Input Card */}
        <Card className="lg:col-span-5 border border-border/80 h-fit">
          <SectionTitle
            title="Craft Information"
            subtitle="Enter product details to generate marketing material."
          />

          <form onSubmit={handleGenerate} className="mt-5 space-y-4">
            <Field label="Product Name">
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Retail Price (₹)">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Materials Used">
              <input
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Craft Story / Description">
              <textarea
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full rounded-full bg-terracotta text-cream shadow-glow mt-2"
            >
              {isGenerating ? <RefreshCw className="size-4 animate-spin mr-1.5" /> : <Sparkles className="size-4 mr-1.5" />}
              Generate AI Marketing Kit
            </Button>
          </form>
        </Card>

        {/* Results Card */}
        <div className="lg:col-span-7 space-y-5">
          {!marketingKit ? (
            <Card className="p-8 text-center border-dashed border-2 flex flex-col items-center justify-center min-h-[400px]">
              <div className="size-16 rounded-full bg-terracotta/10 text-terracotta grid place-items-center mb-3">
                <Share2 className="size-8" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">Ready to promote your craft?</h3>
              <p className="text-xs text-soft max-w-sm mt-1 mb-5">
                Click "Generate AI Marketing Kit" to create WhatsApp messages, Instagram captions with viral hashtags, and video scripts.
              </p>
              <Button onClick={() => handleGenerate()} disabled={isGenerating} className="rounded-full bg-terracotta text-cream">
                <Sparkles className="size-4 mr-1.5" />
                Generate Sample Kit
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Instagram Card */}
              <Card className="surface-card border border-border/80">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Instagram className="size-4 text-pink-600" />
                    <span className="font-display text-sm font-bold text-ink">Instagram Caption & Hashtags</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        `${marketingKit.instagram_caption}\n\n${marketingKit.hashtags.join(" ")}`,
                        "instagram"
                      )
                    }
                    className="rounded-full text-xs"
                  >
                    {copiedKey === "instagram" ? <Check className="size-3.5 mr-1 text-emerald-600" /> : <Copy className="size-3.5 mr-1" />}
                    {copiedKey === "instagram" ? "Copied!" : "Copy Caption"}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-ink whitespace-pre-line leading-relaxed bg-muted/40 p-4 rounded-2xl border border-border/40 font-sans">
                  {marketingKit.instagram_caption}
                  <div className="mt-3 pt-2 border-t border-border/40 text-terracotta font-medium">
                    {marketingKit.hashtags.join(" ")}
                  </div>
                </div>
              </Card>

              {/* WhatsApp Broadcast Card */}
              <Card className="surface-card border border-border/80">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-emerald-600" />
                    <span className="font-display text-sm font-bold text-ink">WhatsApp Broadcast Template</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(marketingKit.whatsapp_message, "whatsapp")}
                    className="rounded-full text-xs"
                  >
                    {copiedKey === "whatsapp" ? <Check className="size-3.5 mr-1 text-emerald-600" /> : <Copy className="size-3.5 mr-1" />}
                    {copiedKey === "whatsapp" ? "Copied!" : "Copy WhatsApp"}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-ink whitespace-pre-line leading-relaxed bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 font-sans">
                  {marketingKit.whatsapp_message}
                </div>
              </Card>

              {/* 30-Second Reel / Video Script */}
              <Card className="surface-card border border-border/80">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Video className="size-4 text-purple-600" />
                    <span className="font-display text-sm font-bold text-ink">30-Second Video / Reel Script</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(marketingKit.video_script_30s, "reel")}
                    className="rounded-full text-xs"
                  >
                    {copiedKey === "reel" ? <Check className="size-3.5 mr-1 text-emerald-600" /> : <Copy className="size-3.5 mr-1" />}
                    {copiedKey === "reel" ? "Copied!" : "Copy Script"}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-ink whitespace-pre-line leading-relaxed bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20 font-sans">
                  {marketingKit.video_script_30s}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
