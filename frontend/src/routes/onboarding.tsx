import { Link, createFileRoute } from "@tanstack/react-router";
import { Camera, IndianRupee, Mic, Sparkles } from "lucide-react";
import { useState } from "react";

import { Brand, LanguageSwitcher } from "@/components/AppShell";
import { Button, Card, FadeIn } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "How KarigarAI works — a quick tour" },
      {
        name: "description",
        content: "Four short slides showing how a photo and your voice become a complete product listing.",
      },
      { property: "og:title", content: "How KarigarAI works — a quick tour" },
      { property: "og:description", content: "Photograph, speak, let AI write the listing, then publish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const SLIDES = [
  {
    icon: Camera,
    title: "Take one photo",
    body: "Photograph your product in daylight. We clean the background and score the picture out of 100.",
  },
  {
    icon: Mic,
    title: "Speak, don't type",
    body: "Describe your craft in Marathi, Hindi or English. No forms, no typing, no English needed.",
  },
  {
    icon: Sparkles,
    title: "AI writes your listing",
    body: "A title, category, materials, keywords and a story-led description — in all three languages.",
  },
  {
    icon: IndianRupee,
    title: "Price it fairly and publish",
    body: "See a suggested price with cost and margin, then publish to the buyer marketplace.",
  },
];

function Onboarding() {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="ambient-glow -top-24 right-0 size-80 bg-amber/40" aria-hidden="true" />
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <LanguageSwitcher />
        </div>

        <div className="flex flex-1 items-center">
          <FadeIn key={slide.title} className="w-full">
            <Card className="p-8 text-center sm:p-12">
              <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-blush text-terracotta-deep">
                <slide.icon className="size-8" aria-hidden="true" />
              </div>
              <p className="mt-6 font-display text-3xl font-black tracking-tight">{slide.title}</p>
              <p className="mx-auto mt-3 max-w-md text-base text-soft">{slide.body}</p>
            </Card>
          </FadeIn>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2" role="tablist" aria-label="Slides">
            {SLIDES.map((s, index) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={index === i}
                aria-label={`Slide ${index + 1}: ${s.title}`}
                onClick={() => setI(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === i ? "w-8 bg-terracotta" : "w-2 bg-ink/15",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-semibold text-soft hover:text-ink">
              Skip
            </Link>
            {last ? (
              <Link to="/auth">
                <Button size="lg">{t("startSelling")}</Button>
              </Link>
            ) : (
              <Button size="lg" onClick={() => setI((n) => n + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
