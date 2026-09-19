import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Check, LogOut, RefreshCw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell, LanguageSwitcher } from "@/components/AppShell";
import { Badge, Button, Card, DemoTag, Field, SectionTitle, inputClass } from "@/components/ui-kit";
import { IMAGES } from "@/data/mockData";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { api } from "@/services/api";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile — KarigarAI" },
      { name: "description", content: "Your artisan details, craft, location and language preference." },
      { property: "og:title", content: "My profile — KarigarAI" },
      { property: "og:description", content: "Artisan profile and language settings." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

const PRESET_AVATARS = [
  { id: "savita", name: "Savita (Weaver)", url: IMAGES.savita },
  {
    id: "artisan-m",
    name: "Master Craftsman",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "artisan-f",
    name: "Artisan Potter",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "artisan-sculptor",
    name: "Wood/Metal Sculptor",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "artisan-textile",
    name: "Textile Artisan",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
  },
];

function Profile() {
  const { t } = useI18n();
  const { user, updateUser, signOut } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user.name,
    business: user.business,
    craft: user.craft,
    location: user.location,
    avatar: user.avatar,
    since: user.since || "2021",
  });

  useEffect(() => {
    setForm({
      name: user.name,
      business: user.business,
      craft: user.craft,
      location: user.location,
      avatar: user.avatar,
      since: user.since || "2021",
    });
  }, [user]);

  function handleAvatarUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setForm((prev) => ({ ...prev, avatar: dataUrl }));
        toast.success("Profile photo uploaded! Click 'Save changes' to apply.");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const updated = {
      name: form.name.trim() || user.name,
      business: form.business.trim() || user.business,
      craft: form.craft.trim() || user.craft,
      location: form.location.trim() || user.location,
      avatar: form.avatar,
      since: form.since,
    };
    updateUser(updated);
    await api.updateProfile(updated);
    toast.success("Profile saved successfully!");
  }

  return (
    <AppShell title={t("profile")} subtitle="Buyers see this alongside your products.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <Card className="p-6 text-center">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarUpload(file);
            }}
          />

          {/* Avatar with Camera Overlay */}
          <div className="relative mx-auto inline-block">
            <img
              src={form.avatar || IMAGES.savita}
              alt={form.name}
              className="size-32 rounded-3xl object-cover shadow-soft ring-4 ring-terracotta/20 transition hover:opacity-90"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload new profile photo"
              className="absolute -bottom-2 -right-2 grid size-10 place-items-center rounded-2xl bg-terracotta text-white shadow-md transition hover:bg-terracotta-deep hover:scale-105"
            >
              <Camera className="size-5" />
            </button>
          </div>

          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-terracotta font-semibold"
            >
              <Upload className="size-3.5 mr-1.5" /> Upload Custom Photo
            </Button>
          </div>

          <p className="mt-3 font-display text-xl font-bold">{form.name}</p>
          <p className="text-sm text-soft">{form.business}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge tone="brand">{form.craft}</Badge>
            <Badge tone="info">Since {form.since}</Badge>
          </div>

          {/* Preset Avatars Selection */}
          <div className="mt-6 border-t border-border/50 pt-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-soft">Or choose an avatar:</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2.5">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = form.avatar === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, avatar: preset.url }));
                      toast.info(`Selected ${preset.name}`);
                    }}
                    title={preset.name}
                    className={`relative size-12 overflow-hidden rounded-2xl border-2 transition ${
                      isSelected ? "border-terracotta ring-2 ring-terracotta/40 scale-105" : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="size-full object-cover" />
                    {isSelected && (
                      <span className="absolute inset-0 grid place-items-center bg-terracotta/30 text-white">
                        <Check className="size-4 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-center border-t border-border/50 pt-4">
            <LanguageSwitcher />
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Your details" />
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Full name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Atharv Patil"
                required
              />
            </Field>
            <Field label="Business name">
              <input
                className={inputClass}
                value={form.business}
                onChange={(e) => setForm({ ...form, business: e.target.value })}
                placeholder="e.g. Atharv Handmade Crafts"
                required
              />
            </Field>
            <Field label="Craft">
              <input
                className={inputClass}
                value={form.craft}
                onChange={(e) => setForm({ ...form, craft: e.target.value })}
                placeholder="e.g. Wood Carving / Brass Casting / Pottery"
                required
              />
            </Field>
            <Field label="Location" hint="Village or city and state">
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Pune, Maharashtra"
                required
              />
            </Field>
            <Field label="Crafting Since (Year)">
              <input
                className={inputClass}
                value={form.since}
                onChange={(e) => setForm({ ...form, since: e.target.value })}
                placeholder="e.g. 2019"
              />
            </Field>
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  signOut();
                  toast.info("Logged out successfully");
                  navigate({ to: "/auth" });
                }}
                className="text-soft hover:text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="size-4 mr-1.5" /> Sign out
              </Button>
              <Button type="submit">
                <RefreshCw className="size-4 mr-1.5" /> Save changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
