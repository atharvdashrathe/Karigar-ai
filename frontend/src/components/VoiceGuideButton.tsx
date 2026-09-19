import { Volume2, VolumeX, Square, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import { voiceGuide, type PageExplanationKey } from "@/lib/voice-guide";
import { cn } from "@/lib/utils";

interface VoiceGuideButtonProps {
  pageKey?: PageExplanationKey;
  customText?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline" | "glass" | "pill";
  label?: string;
}

export function VoiceGuideButton({
  pageKey,
  customText,
  className,
  size = "md",
  variant = "pill",
  label,
}: VoiceGuideButtonProps) {
  const { lang, t } = useI18n();
  const [speaking, setSpeaking] = useState(voiceGuide.getIsSpeaking());
  const [muted, setMuted] = useState(voiceGuide.getIsMuted());

  useEffect(() => {
    const unsub = voiceGuide.subscribe((isSpk) => {
      setSpeaking(isSpk);
    });
    return unsub;
  }, []);

  function handleAction(e: React.MouseEvent) {
    e.stopPropagation();
    if (speaking) {
      voiceGuide.stop();
      return;
    }

    if (customText) {
      voiceGuide.speak(customText, lang);
    } else if (pageKey) {
      voiceGuide.explainPage(pageKey, lang);
    }
  }

  const defaultLabel = speaking ? "Stop" : label || "🔊 Explain";

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleAction}
        aria-label={speaking ? "Stop voice guide" : "Listen to page explanation"}
        title={speaking ? "Stop voice guide" : "Listen to page explanation"}
        className={cn(
          "inline-flex items-center gap-2 rounded-full font-bold transition-all duration-300 cursor-pointer shadow-sm active:scale-95 select-none",
          speaking
            ? "bg-terracotta text-cream ring-2 ring-terracotta/40 animate-pulse px-3.5 py-1.5 text-xs"
            : "bg-terracotta/10 text-terracotta-deep hover:bg-terracotta/20 border border-terracotta/25 px-3 py-1.5 text-xs",
          size === "sm" && "px-2.5 py-1 text-[11px]",
          size === "lg" && "px-4 py-2 text-sm",
          className,
        )}
      >
        {speaking ? (
          <>
            <Square className="size-3.5 fill-current" />
            <span>Stop</span>
            <span className="flex items-center gap-0.5 ml-1">
              <span className="h-2 w-0.5 bg-cream animate-ping" />
              <span className="h-3 w-0.5 bg-cream" />
              <span className="h-1.5 w-0.5 bg-cream animate-ping" />
            </span>
          </>
        ) : (
          <>
            <Volume2 className="size-3.5 text-terracotta" />
            <span>{defaultLabel}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAction}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition cursor-pointer",
        speaking
          ? "bg-terracotta text-cream shadow-glow"
          : "bg-cream/80 text-ink hover:bg-cream border border-border/80 shadow-sm",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-base",
        className,
      )}
    >
      {speaking ? (
        <>
          <Square className="size-4 fill-current" />
          <span>Stop Voice</span>
        </>
      ) : (
        <>
          <Volume2 className="size-4 text-terracotta" />
          <span>{label || "🔊 Explain this"}</span>
        </>
      )}
    </button>
  );
}
