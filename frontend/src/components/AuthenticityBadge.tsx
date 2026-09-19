import { CheckCircle2, Leaf, ShieldCheck, Sparkles, Award, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeType = "verified" | "handmade" | "gi_tagged" | "women_led" | "sustainable";

interface AuthenticityBadgeProps {
  type: BadgeType;
  className?: string;
  size?: "sm" | "md";
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; icon: any; bgClass: string; textClass: string; borderClass: string }
> = {
  verified: {
    label: "Artisan Verified",
    icon: ShieldCheck,
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-500/20",
  },
  handmade: {
    label: "100% Handmade",
    icon: Sparkles,
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-700 dark:text-amber-400",
    borderClass: "border-amber-500/20",
  },
  gi_tagged: {
    label: "GI Tagged Heritage",
    icon: Award,
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-700 dark:text-purple-400",
    borderClass: "border-purple-500/20",
  },
  women_led: {
    label: "Women-Led Collective",
    icon: Users,
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-700 dark:text-rose-400",
    borderClass: "border-rose-500/20",
  },
  sustainable: {
    label: "Eco-Friendly Material",
    icon: Leaf,
    bgClass: "bg-teal-500/10",
    textClass: "text-teal-700 dark:text-teal-400",
    borderClass: "border-teal-500/20",
  },
};

export function AuthenticityBadge({ type, className, size = "sm" }: AuthenticityBadgeProps) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-all select-none",
        config.bgClass,
        config.textClass,
        config.borderClass,
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5 shrink-0" : "size-4 shrink-0"} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

export function ProductBadgesList({
  isGiTagged,
  isHandmadeVerified = true,
  isWomenLed,
  isSustainable,
  className,
}: {
  isGiTagged?: boolean;
  isHandmadeVerified?: boolean;
  isWomenLed?: boolean;
  isSustainable?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {isHandmadeVerified && <AuthenticityBadge type="handmade" />}
      {isGiTagged && <AuthenticityBadge type="gi_tagged" />}
      {isWomenLed && <AuthenticityBadge type="women_led" />}
      {isSustainable && <AuthenticityBadge type="sustainable" />}
    </div>
  );
}
