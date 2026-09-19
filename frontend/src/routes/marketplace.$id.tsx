import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MapPin, Heart, Volume2, VolumeX, Play, Pause, ShieldCheck, Award, Truck, Sparkles, MessageSquare } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

import { PublicHeader } from "@/components/AppShell";
import { ProductBadgesList } from "@/components/AuthenticityBadge";
import { ThankArtisanModal } from "@/components/ThankArtisanModal";
import { VoiceGuideButton } from "@/components/VoiceGuideButton";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  LoadingState,
  inputClass,
} from "@/components/ui-kit";
import { IMAGES } from "@/data/mockData";
import { useI18n } from "@/lib/i18n";
import { api, getArtisanForProduct } from "@/services/api";

export const Route = createFileRoute("/marketplace/$id")({
  head: () => ({
    meta: [
      { title: "Product details & Meet the Maker — KarigarAI" },
      { name: "description", content: "Handmade product story, audio narration, artisan profile and direct enquiry." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { t } = useI18n();

  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [thankOpen, setThankOpen] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });

  // Audio story player state
  const [isPlayingStory, setIsPlayingStory] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.getProduct(id),
  });

  async function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    await api.sendEnquiry({ productId: data.id, productName: data.name, ...form });
    setEnquirySent(true);
    toast.success("Enquiry delivered directly to the artisan!");
  }

  function toggleAudioStory() {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg");
      audioRef.current.onended = () => setIsPlayingStory(false);
    }

    if (isPlayingStory) {
      audioRef.current.pause();
      setIsPlayingStory(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingStory(true);
      toast.info("Playing audio story: 'Weaving Life with Bamboo'");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <Link to="/marketplace" className="text-xs font-bold text-terracotta hover:underline inline-flex items-center gap-1 mb-6">
          ← Back to Marketplace
        </Link>

        {isError ? (
          <div className="mt-6">
            <ErrorState message={t("somethingWrong")} onRetry={() => refetch()} />
          </div>
        ) : isLoading || !data ? (
          <div className="mt-6">
            <LoadingState label={t("loading")} />
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            {/* Image Gallery */}
            <div>
              <div className="relative overflow-hidden rounded-[2.5rem] bg-cream/30 shadow-glow border border-border/60">
                <img
                  src={data.image || IMAGES.painting}
                  alt={data.name}
                  onError={(e) => {
                    if (e.currentTarget.src !== IMAGES.painting) e.currentTarget.src = IMAGES.painting;
                  }}
                  className="w-full aspect-4/3 object-cover"
                />
              </div>

              {/* Delivery / Rural Logistics Trust Pill */}
              <div className="mt-4 p-4 rounded-3xl surface-card border border-border/80 flex items-center justify-between text-xs text-soft">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <Truck className="size-4 text-teal-600 shrink-0" />
                  <span>Doorstep Rural Pickup & Insured Fragile Delivery</span>
                </div>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[11px]">
                  ✓ Verified Dispatch
                </span>
              </div>
            </div>

            {/* Product Details & Meet the Maker */}
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge tone="brand">{data.category}</Badge>
                  <ProductBadgesList
                    isGiTagged={true}
                    isHandmadeVerified={true}
                    isWomenLed={true}
                    isSustainable={true}
                  />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-ink">{data.name}</h1>
                  <VoiceGuideButton
                    customText={`This is ${data.name}. Handcrafted with ${data.materials.join(", ")}. It costs ${data.price} rupees. Made by ${data.artisan} in ${data.location}.`}
                    label="🔊 Listen"
                    size="sm"
                  />
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-soft font-medium">
                  <MapPin className="size-3.5 text-terracotta" aria-hidden="true" />
                  <span>{data.artisan} · {data.location}</span>
                </p>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="font-display text-3xl font-bold text-terracotta">
                    ₹{data.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-soft">({data.inventory} units available)</span>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-ink/90 bg-muted/30 p-4 rounded-2xl border border-border/50">
                  {data.description}
                </p>

                {/* Materials Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {data.materials.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-terracotta/10 text-terracotta">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* MEET THE MAKER / ARTISAN STORY SECTION */}
              {(() => {
                const artisanInfo = getArtisanForProduct(data);
                return (
                  <Card className="surface-card border border-border/80 p-5 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta">
                        {t("meetTheMaker")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="size-3" /> Master Artisan
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <img
                        src={artisanInfo.avatar || IMAGES.savita}
                        alt={data.artisan}
                        onError={(e) => {
                          if (e.currentTarget.src !== IMAGES.savita) e.currentTarget.src = IMAGES.savita;
                        }}
                        className="size-16 rounded-2xl object-cover ring-2 ring-terracotta/20 shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <h3 className="font-display text-base font-bold text-ink">{artisanInfo.name}</h3>
                        <p className="text-xs text-soft font-medium">{artisanInfo.craft} · {artisanInfo.location}</p>
                        <p className="text-xs text-ink/80 leading-relaxed italic">
                          "Learned generational craft techniques from her mother and has trained over 30 women in her village collective."
                        </p>
                      </div>
                    </div>

                    {/* Hear Her Story Audio Player */}
                    <div className="pt-2 flex items-center justify-between border-t border-border/50">
                      <button
                        type="button"
                        onClick={toggleAudioStory}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta/15 text-terracotta hover:bg-terracotta hover:text-cream transition text-xs font-semibold cursor-pointer"
                      >
                        {isPlayingStory ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
                        <span>{isPlayingStory ? "Pause Audio Story" : t("hearHerStory")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setThankOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition text-xs font-semibold cursor-pointer"
                      >
                        <Heart className="size-3.5 fill-rose-500" />
                        <span>{t("thankTheArtisan")}</span>
                      </button>
                    </div>
                  </Card>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={() => setEnquiryOpen(true)}
                  className="flex-1 rounded-full bg-terracotta text-cream shadow-glow font-bold text-xs"
                >
                  <MessageSquare className="size-4 mr-2" />
                  Ask the Artisan
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setThankOpen(true)}
                  className="rounded-full text-xs font-semibold"
                >
                  <Heart className="size-4 mr-1.5 text-rose-500" />
                  Say Thanks
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Enquiry Modal */}
      {enquiryOpen && data && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md p-6 bg-card rounded-3xl border border-border shadow-2xl">
            {enquirySent ? (
              <div className="text-center py-4">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <CheckCircle2 className="size-7" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">Enquiry Sent Successfully!</h3>
                <p className="mt-2 text-xs text-soft leading-relaxed">
                  {data.artisan} has received your inquiry in their Karigar AI dashboard and will get in touch with you.
                </p>
                <div className="mt-5 flex justify-center">
                  <Button
                    onClick={() => {
                      setEnquiryOpen(false);
                      setEnquirySent(false);
                    }}
                    className="rounded-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h3 className="font-display text-lg font-bold text-ink">Ask {data.artisan}</h3>
                  <button
                    type="button"
                    onClick={() => setEnquiryOpen(false)}
                    className="size-7 rounded-full grid place-items-center text-soft hover:bg-muted"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-soft">
                  Inquiring about: <strong>{data.name}</strong> (₹{data.price})
                </div>

                <Field label="Your Name">
                  <input
                    className={inputClass}
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="WhatsApp / Phone / Email">
                  <input
                    className={inputClass}
                    required
                    placeholder="e.g. +91-9876543210"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  />
                </Field>
                <Field label="Message">
                  <textarea
                    className={inputClass}
                    rows={3}
                    required
                    placeholder="e.g. Is this available in custom red colour? How long for delivery to Pune?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setEnquiryOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-full bg-terracotta text-cream">
                    Send Enquiry
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* Thank the Artisan Modal */}
      {data && (
        <ThankArtisanModal
          open={thankOpen}
          onClose={() => setThankOpen(false)}
          artisanId={data.artisanId}
          artisanName={data.artisan}
          productId={data.id}
          productName={data.name}
        />
      )}
    </div>
  );
}
