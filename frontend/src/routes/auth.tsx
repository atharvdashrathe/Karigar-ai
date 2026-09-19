import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Brand, LanguageSwitcher } from "@/components/AppShell";
import { Button, Card, Field, inputClass } from "@/components/ui-kit";
import { artisan } from "@/data/mockData";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { api } from "@/services/api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — KarigarAI" },
      { name: "description", content: "Sign in or create an artisan account to list your handmade products." },
      { property: "og:title", content: "Sign in — KarigarAI" },
      { property: "og:description", content: "Artisan sign in for KarigarAI listings and enquiries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res =
        mode === "login"
          ? await api.login(identifier || "9876543210", password || "demo")
          : await api.register({ name, identifier, password });
      signIn({
        name: res.user.name,
        business: res.user.business,
        location: res.user.location,
        avatar: res.user.avatar,
      });
      toast.success(`Welcome, ${res.user.name}`);
      navigate({ to: "/dashboard" });
    } catch {
      toast.error(t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  function demo() {
    signIn({
      name: artisan.name,
      business: artisan.business,
      location: artisan.location,
      avatar: artisan.avatar,
    });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="ambient-glow top-10 left-10 size-80 bg-blush/70" aria-hidden="true" />
      <Card glass className="w-full max-w-md p-7">
        <div className="flex items-center justify-between gap-3">
          <Brand />
        </div>

        <div className="mt-6 inline-flex rounded-full bg-ink/5 p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${mode === m ? "bg-terracotta text-cream" : "text-soft"}`}
            >
              {m === "login" ? t("login") : t("createAccount")}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "register" ? (
            <Field label={t("name")}>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Savita Patil" />
            </Field>
          ) : null}
          <Field label="Phone or email">
            <input
              className={inputClass}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="9876543210"
            />
          </Field>
          <Field label={t("password")} hint="Prototype — any details work.">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? t("loading") : mode === "login" ? t("login") : t("createAccount")}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={demo}>
            {t("tryDemo")}
          </Button>
          <LanguageSwitcher />
        </div>
      </Card>
    </div>
  );
}
