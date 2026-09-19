import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  PlusCircle,
  Store,
  User,
  Users,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Calculator,
  Mic,
  Share2,
  Globe,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Assistant } from "@/components/Assistant";
import { VoiceSellModal } from "@/components/VoiceSellModal";
import { SafetyCenterModal } from "@/components/SafetyCenterModal";
import { SmartPricingModal } from "@/components/SmartPricingModal";
import { OfflineBanner } from "@/components/OfflineBanner";
import { VoiceGuideButton } from "@/components/VoiceGuideButton";
import { Button } from "@/components/ui-kit";
import { IMAGES } from "@/data/mockData";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";
import { useApp, type Role } from "@/lib/store";
import { cn } from "@/lib/utils";
import { type PageExplanationKey } from "@/lib/voice-guide";

function getPageKeyForPath(path: string): PageExplanationKey {
  if (path.includes("/products/new")) return "sell";
  if (path.includes("/products")) return "products";
  if (path.includes("/marketplace")) return "marketplace";
  if (path.includes("/enquiries")) return "orders";
  if (path.includes("/earnings")) return "earnings";
  if (path.includes("/marketing")) return "marketing";
  if (path.includes("/profile")) return "profile";
  return "dashboard";
}

const ARTISAN_NAV = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/products", key: "products", icon: Package },
  { to: "/marketplace", key: "marketplace", icon: Store },
  { to: "/collectives", key: "collectives", icon: Users },
  { to: "/marketing", key: "marketingStudio", icon: Share2 },
  { to: "/enquiries", key: "enquiries", icon: MessageSquare },
  { to: "/earnings", key: "earnings", icon: BarChart3 },
  { to: "/profile", key: "profile", icon: User },
] as const;

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-2xl bg-card border border-border/80 p-1">
      <Globe className="size-3.5 text-terracotta ml-1.5 shrink-0" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="bg-transparent text-xs font-semibold text-ink focus:outline-none pr-2 py-1 cursor-pointer"
        aria-label="Select Language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="bg-card text-ink">
            {l.native} ({l.label})
          </option>
        ))}
      </select>
    </div>
  );
}

export function RoleSwitcher() {
  const { role, setRole } = useApp();
  return (
    <div className="inline-flex rounded-full bg-muted/60 p-1 text-[11px] font-semibold border border-border/60">
      {(["artisan", "buyer", "admin"] as Role[]).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => {
            setRole(r);
            toast.info(`Switched view to ${r.toUpperCase()}`);
          }}
          className={cn(
            "rounded-full px-2.5 py-1 capitalize transition cursor-pointer",
            role === r ? "bg-terracotta text-cream shadow-sm" : "text-soft hover:text-ink",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function Brand({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-terracotta text-cream font-display text-lg font-bold shadow-sm">
        क
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block font-display text-lg font-bold tracking-tight text-ink">Karigar AI</span>
          <span className="block text-[11px] font-semibold tracking-wide text-soft uppercase">
            {t("tagline")}
          </span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { user, role, signOut } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [saathiOpen, setSaathiOpen] = useState(false);
  const [voiceSellOpen, setVoiceSellOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  function handleLogout() {
    signOut();
    toast.info("Logged out successfully");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Offline sync status banner */}
      <OfflineBanner />

      <div className="ambient-glow -top-24 -left-16 size-72 bg-blush/70" aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 lg:px-8 flex-1">
        {/* sidebar (desktop) */}
        <aside className="sticky top-6 hidden h-[calc(100vh-4.5rem)] w-64 shrink-0 flex-col justify-between rounded-3xl surface-card p-5 lg:flex border border-border/80">
          <div className="space-y-6">
            <Brand />

            {/* Quick 1-Tap "Sell Something" Voice button */}
            <Button
              onClick={() => setVoiceSellOpen(true)}
              className="w-full rounded-2xl bg-terracotta hover:bg-terracotta-deep text-cream shadow-glow font-bold text-xs py-3 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mic className="size-4 animate-pulse" />
              <span>{t("sellSomething")}</span>
            </Button>

            <nav className="space-y-1" aria-label="Main">
              {ARTISAN_NAV.map(({ to, key, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2 text-xs font-semibold transition",
                      active ? "bg-blush text-terracotta-deep" : "text-soft hover:bg-blush/50 hover:text-ink",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {t(key)}
                  </Link>
                );
              })}

              {/* Admin Dashboard link */}
              {role === "admin" && (
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2 text-xs font-bold transition",
                    pathname === "/admin" ? "bg-purple-500/15 text-purple-700 dark:text-purple-300" : "text-purple-600 hover:bg-purple-50",
                  )}
                >
                  <ShieldCheck className="size-4" />
                  {t("admin")}
                </Link>
              )}
            </nav>

            {/* Quick Tools */}
            <div className="pt-2 border-t border-border/50 space-y-1">
              <button
                type="button"
                onClick={() => setPricingOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-soft hover:text-ink hover:bg-muted/60 transition cursor-pointer"
              >
                <Calculator className="size-3.5 text-amber-600" />
                <span>Smart Pricing Tool</span>
              </button>
              <button
                type="button"
                onClick={() => setSafetyOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-soft hover:text-ink hover:bg-muted/60 transition cursor-pointer"
              >
                <ShieldAlert className="size-3.5 text-red-600" />
                <span>Scam Safety Center</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border/50">
            {/* Role switch pill */}
            <div className="flex justify-center">
              <RoleSwitcher />
            </div>

            <div className="flex items-center justify-between gap-1.5 rounded-2xl bg-cream/70 dark:bg-muted/40 p-2 transition">
              <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-2.5">
                <img
                  src={user?.avatar || IMAGES.savita}
                  alt={user?.name || "Artisan"}
                  className="size-9 shrink-0 rounded-xl object-cover ring-2 ring-terracotta/20"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{user?.name || "Savita Patil"}</p>
                  <p className="truncate text-[10px] text-soft">{user?.business || "Patil Handicrafts"}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="grid size-8 shrink-0 place-items-center rounded-xl bg-ink/5 text-soft transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
            <div className="flex justify-center">
              <LanguageSwitcher />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="lg:hidden flex items-center gap-3">
              <Brand compact />
              <Button
                size="sm"
                onClick={() => setVoiceSellOpen(true)}
                className="rounded-full bg-terracotta text-cream text-xs px-3 py-1.5"
              >
                <Mic className="size-3.5 mr-1" />
                Sell
              </Button>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-ink">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-soft">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              <VoiceGuideButton pageKey={getPageKeyForPath(pathname)} size="sm" />
              <div className="hidden sm:block lg:hidden">
                <LanguageSwitcher />
              </div>
              <div className="lg:hidden">
                <RoleSwitcher />
              </div>
              {action}
            </div>
          </header>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {children}
          </motion.div>
        </main>
      </div>

      {/* bottom nav (mobile) */}
      <nav
        className="surface-glass fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-3xl px-2 py-2 lg:hidden border border-border/80 shadow-lg"
        aria-label="Main"
      >
        {ARTISAN_NAV.slice(0, 5).map(({ to, key, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-semibold",
                active ? "text-terracotta-deep font-bold" : "text-soft",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="truncate">{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="h-24 lg:h-0" />

      {/* AI Saathi Drawer */}
      <Assistant open={saathiOpen} setOpen={setSaathiOpen} />

      {/* Voice-First "Sell Something" Modal */}
      <VoiceSellModal open={voiceSellOpen} onClose={() => setVoiceSellOpen(false)} />

      {/* Smart Pricing Tool Modal */}
      <SmartPricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />

      {/* Scam Safety Center Modal */}
      <SafetyCenterModal open={safetyOpen} onClose={() => setSafetyOpen(false)} />
    </div>
  );
}

export function PublicHeader() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <Brand />
        <div className="flex items-center gap-3">
          <VoiceGuideButton pageKey="marketplace" size="sm" />
          <Link to="/marketplace" className="hidden text-sm font-semibold text-soft hover:text-ink sm:block">
            {t("marketplace")}
          </Link>
          <Link to="/collectives" className="hidden text-sm font-semibold text-soft hover:text-ink sm:block">
            {t("collectives")}
          </Link>
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <Link to="/auth">
            <Button size="sm">{t("signIn")}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
