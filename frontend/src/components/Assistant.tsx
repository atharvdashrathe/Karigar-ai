import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Bot, User, RefreshCw, ShieldAlert, DollarSign, Package, Camera, MessageSquare } from "lucide-react";
import { Button, inputClass } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { api } from "@/services/api";

type Message = {
  id: string;
  sender: "user" | "saathi";
  text: string;
  category?: string;
  timestamp: string;
  actions?: string[];
};

const PROMPT_CHIPS = [
  { icon: DollarSign, label: "What price should I keep?" },
  { icon: Package, label: "How should I package this product?" },
  { icon: MessageSquare, label: "Write a WhatsApp message" },
  { icon: Camera, label: "How to photograph this product?" },
  { icon: ShieldAlert, label: "Is this message suspicious?" },
  { icon: Sparkles, label: "How much have I earned?" },
];

export function Assistant({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { t, lang } = useI18n();
  const { user } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "saathi",
      text: `Namaste ${user.name || "Artisan"}! 🙏 I am **AI Saathi**, your personal craft business mentor. How can I assist you with pricing, packaging, marketing, or customer inquiries today?`,
      timestamp: "Just now",
      actions: ["What price should I keep?", "Write a WhatsApp message", "Scam safety warning"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/saathi/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language: lang,
          context: {
            artisan_name: user.name,
            craft_type: user.craft,
            total_sales: 12450,
            total_products: 6,
            total_orders: 12,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const saathiReply: Message = {
          id: `reply-${Date.now()}`,
          sender: "saathi",
          text: data.reply,
          category: data.category,
          timestamp: "Just now",
          actions: data.suggested_actions,
        };
        setMessages((prev) => [...prev, saathiReply]);
      } else {
        throw new Error("Server response error");
      }
    } catch {
      // Offline / fallback reply
      const fallbackReply: Message = {
        id: `reply-${Date.now()}`,
        sender: "saathi",
        text: `Based on your craft (${user.craft || "Handicrafts"}), always compute your raw material cost plus a fair living hourly wage of ₹80-₹120/hr, add ₹50 for eco-packaging, and maintain a 35% artisan profit margin!`,
        timestamp: "Just now",
        actions: ["How to package safely?", "Write Instagram caption"],
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Open AI Saathi"
        aria-expanded={open}
        className="fixed right-4 bottom-24 z-40 grid size-14 place-items-center rounded-full bg-terracotta text-cream shadow-glow transition hover:-translate-y-0.5 lg:bottom-6 cursor-pointer"
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6 animate-pulse" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed right-4 bottom-40 z-40 w-[min(26rem,calc(100vw-2rem))] h-[540px] max-h-[75vh] flex flex-col rounded-3xl surface-card shadow-2xl border border-border overflow-hidden lg:bottom-24"
            role="dialog"
            aria-label="AI Saathi"
          >
            {/* Header */}
            <div className="p-4 bg-terracotta text-cream flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-2xl bg-cream/20 font-bold">
                  <Bot className="size-5 text-cream" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-sm leading-tight">AI Saathi (एआई साथी)</h3>
                  <p className="text-[11px] text-cream/80">Your Artisan Business Mentor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="size-7 rounded-full grid place-items-center hover:bg-cream/20 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-background/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-terracotta text-cream rounded-tr-none font-medium"
                        : "surface-card border border-border/70 text-ink rounded-tl-none shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>
                  </div>

                  {/* Suggestion Chips below message */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(act)}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-muted hover:bg-blush hover:text-terracotta-deep border border-border/60 transition text-soft font-semibold cursor-pointer"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-soft p-2">
                  <RefreshCw className="size-3 animate-spin text-terracotta" />
                  <span>AI Saathi is thinking...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Carousel */}
            <div className="px-3 py-2 border-t border-border/50 bg-muted/30 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
              {PROMPT_CHIPS.map((chip, idx) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip.label)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-card border border-border/80 text-ink/80 hover:border-terracotta/40 hover:text-terracotta whitespace-nowrap transition cursor-pointer shrink-0"
                  >
                    <Icon className="size-3 text-terracotta" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-border/60 bg-card flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Saathi anything about your craft..."
                className="flex-1 rounded-full bg-muted/60 px-3.5 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-terracotta border border-border/50"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                size="sm"
                className="rounded-full bg-terracotta text-cream shrink-0 size-8 p-0 grid place-items-center"
              >
                <Send className="size-3.5" />
              </Button>
            </form>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
