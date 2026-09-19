import { motion } from "framer-motion";
import { AlertCircle, Loader2, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ============================================================
   Small reusable building blocks used across every screen.
   All colours come from design tokens in src/styles.css.
   ============================================================ */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ink" | "ghost" | "glass" | "danger";
  size?: "sm" | "md" | "lg";
};

const BUTTON_VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-terracotta text-cream shadow-glow hover:-translate-y-0.5",
  ink: "bg-ink text-cream shadow-soft hover:-translate-y-0.5",
  ghost: "text-terracotta-deep hover:bg-blush/60",
  glass: "surface-glass text-ink hover:-translate-y-0.5",
  danger: "bg-destructive text-destructive-foreground hover:-translate-y-0.5",
};

const BUTTON_SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-4 text-base",
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
    />
  );
}

export function Card({ className, children, glass }: { className?: string; children: ReactNode; glass?: boolean }) {
  return <div className={cn(glass ? "surface-glass" : "surface-card", "rounded-3xl", className)}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, aside }: { eyebrow?: string; title: string; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold tracking-[0.25em] text-terracotta uppercase">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {aside}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "brand" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/5 text-soft",
    success: "bg-sage/25 text-sage-deep",
    warning: "bg-amber/25 text-ink",
    brand: "bg-blush text-terracotta-deep",
    info: "bg-mist/25 text-ink",
  } as const;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone], className)}>{children}</span>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-soft">
          <span>{label}</span>
          <span className="tabular-nums text-ink">{value}</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-2 overflow-hidden rounded-full bg-ink/8"
      >
        <motion.div
          className="gradient-meter h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ title, help, action }: { title: string; help?: string; action?: ReactNode }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blush/70 text-terracotta-deep">
        <PackageOpen aria-hidden="true" />
      </div>
      <p className="mt-4 font-display text-xl font-semibold">{title}</p>
      {help ? <p className="mx-auto mt-2 max-w-sm text-sm text-soft">{help}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Card>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl border border-border bg-card/60 p-10 text-sm text-soft">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span role="status">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm text-soft">{message}</p>
      {onRetry ? (
        <div className="mt-4 flex justify-center">
          <Button variant="glass" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold tracking-wide text-soft uppercase">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-soft">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-input bg-card px-4 py-3 text-base text-ink placeholder:text-soft/70 focus:border-terracotta focus:outline-none";

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <Badge tone="neutral" className={cn("uppercase tracking-wide", className)}>
      Demo data
    </Badge>
  );
}
