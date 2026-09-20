import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RefreshCw,
  ShieldAlert,
  DollarSign,
  Package,
  Camera,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Check,
  Calculator,
  LayoutGrid,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Share2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { api } from "@/services/api";
import { toast } from "sonner";

type TabMode = "chat" | "hub" | "pricing" | "scam" | "marketing" | "guide";

type Message = {
  id: string;
  sender: "user" | "saathi";
  text: string;
  category?: string;
  timestamp: string;
  actions?: string[];
};

const PROMPT_CHIPS = [
  { icon: DollarSign, label: "What price should I keep for my craft?" },
  { icon: MessageSquare, label: "Write a WhatsApp marketing message" },
  { icon: ShieldAlert, label: "How to know if a buyer message is a scam?" },
  { icon: Package, label: "How should I package fragile craft items?" },
  { icon: Camera, label: "How to photograph products with mobile?" },
  { icon: TrendingUp, label: "How can I increase my monthly sales?" },
];

export function Assistant({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { t, lang } = useI18n();
  const { user } = useApp();

  const [activeTab, setActiveTab] = useState<TabMode>("chat");
  const [isExpanded, setIsExpanded] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "saathi",
      text: `Namaste ${user.name || "Artisan"}! 🙏 I am **AI Saathi (एआई साथी)**, your 24/7 personal craft business mentor.\n\nI can help you **calculate fair pricing**, **protect you from scams**, **create WhatsApp & Instagram marketing posts**, **guide packaging**, and answer any questions in Hindi, Marathi, or English. How can I assist your craft business today?`,
      timestamp: "Just now",
      actions: ["What price should I keep?", "Write a WhatsApp marketing message", "Check scam message", "Packaging guide"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Pricing Tool State
  const [rawMaterialsCost, setRawMaterialsCost] = useState(350);
  const [laborHours, setLaborHours] = useState(4);
  const [hourlyWage, setHourlyWage] = useState(100);
  const [packagingShippingCost, setPackagingShippingCost] = useState(60);
  const [profitMarginPercent, setProfitMarginPercent] = useState(40);

  // Scam Tool State
  const [scamInputText, setScamInputText] = useState("");
  const [isCheckingScam, setIsCheckingScam] = useState(false);
  const [scamResult, setScamResult] = useState<{
    is_suspicious: boolean;
    risk_score: number;
    warning_flags: string[];
    advice: string;
  } | null>(null);

  // Marketing Post Generator State
  const [marketingCraft, setMarketingCraft] = useState(user.craft || "Handloom Sarees");
  const [marketingTone, setMarketingTone] = useState<"festive" | "heritage" | "launch">("festive");
  const [generatedPost, setGeneratedPost] = useState<{
    whatsapp: string;
    instagram: string;
    hashtags: string[];
  } | null>(null);
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, activeTab]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Voice Recording for Chat
  function toggleVoiceInput() {
    if (isVoiceRecording) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsVoiceRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setInput(text);
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsVoiceRecording(false);
        };

        recognition.onend = () => {
          setIsVoiceRecording(false);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        setIsVoiceRecording(true);
        toast.info("Listening... Speak your question now.");
        return;
      } catch (e) {
        console.warn("SpeechRecognition init error:", e);
      }
    }

    toast.info("Microphone not supported on this browser. You can type directly in the chat box.");
  }

  // Text to Speech
  function speakText(text: string) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
      utterance.lang = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      toast.info("🔊 Reading answer aloud...");
    } else {
      toast.info("Text-to-speech audio not supported in this browser.");
    }
  }

  // Handle Send Chat
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
    if (activeTab !== "chat") setActiveTab("chat");

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
      // Intelligent fallback
      const m_low = text.toLowerCase();
      let replyText = `Based on your craft (${user.craft || "Handicrafts"}), always compute: Materials Cost + (Hours spent × ₹80-₹120 fair hourly wage) + ₹50 Packaging, plus a 35-45% profit margin for your handmade artistry!`;
      let actions = ["How to package safely?", "Write WhatsApp promotion", "Scam safety warning"];

      if (m_low.includes("scam") || m_low.includes("fraud") || m_low.includes("pin") || m_low.includes("otp") || m_low.includes("धोखा")) {
        replyText = "🛡️ **Golden Safety Rule:** NEVER type your UPI PIN to receive money. Receiving payment goes straight to your bank account automatically. If a buyer sends a QR code or asks for your PIN, it is a scam.";
        actions = ["How to receive payment safely?", "Check a suspicious buyer message"];
      } else if (m_low.includes("whatsapp") || m_low.includes("post") || m_low.includes("market") || m_low.includes("instagram")) {
        replyText = "📱 **Instant Marketing Tip:** Share the story of your handmade craft process along with 2 close-up photos. Mention natural materials, dimensions, and free safe shipping across India.";
        actions = ["Generate WhatsApp post for me", "What hashtags should I use?"];
      }

      const fallbackReply: Message = {
        id: `reply-${Date.now()}`,
        sender: "saathi",
        text: replyText,
        timestamp: "Just now",
        actions,
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsTyping(false);
    }
  }

  // Calculate Pricing
  const totalCost = rawMaterialsCost + laborHours * hourlyWage + packagingShippingCost;
  const suggestedPrice = Math.round(totalCost * (1 + profitMarginPercent / 100));
  const profitAmount = suggestedPrice - totalCost;
  const wholesalePrice = Math.round(totalCost * 1.2);

  // Evaluate Scam
  async function handleScamEvaluate() {
    if (!scamInputText.trim()) return;
    setIsCheckingScam(true);
    try {
      const res = await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/saathi/check-scam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_text: scamInputText }),
      });
      if (res.ok) {
        const data = await res.json();
        setScamResult(data);
      } else {
        throw new Error("Scam check fallback");
      }
    } catch {
      const isSus = /pin|otp|qr|scan|refund|urgent|army|advance/i.test(scamInputText);
      setScamResult({
        is_suspicious: isSus,
        risk_score: isSus ? 88 : 12,
        warning_flags: isSus
          ? ["Demands UPI PIN or QR scan to receive funds", "Pressure tactics"]
          : ["Standard buyer inquiry"],
        advice: isSus
          ? "⚠️ High Risk! Never share OTP, UPI PIN, or scan any QR code sent by a buyer. Legitimate buyers transfer funds directly."
          : "✅ Low Risk. Message appears legitimate. Ensure you verify credited bank balance before shipping.",
      });
    } finally {
      setIsCheckingScam(false);
    }
  }

  // Generate Marketing Post
  async function handleGenerateMarketing() {
    setIsGeneratingMarketing(true);
    try {
      // Heuristic & crafted templates
      const craftName = marketingCraft || "Handmade Artisan Craft";
      let wa = "";
      let ig = "";
      let tags: string[] = [];

      if (marketingTone === "festive") {
        wa = `🪔 *Festive Celebration Special!* 🪔\n\nNamaste friends! Celebrate this festive season with authentic, handcrafted *${craftName}* crafted by traditional master artisans.\n\n✨ 100% Genuine Handmade Quality\n🌿 Natural & Sustainable Materials\n📦 Free & Safe Eco-Packaging\n\n👉 *Order directly on Karigar AI:* https://karigar.ai/shop\n💬 Reply here for customized designs!`;
        ig = `Celebrate festive traditions with the timeless charm of authentic ${craftName}! ✨ Each creation is individually handcrafted with patience, devotion, and generational artistry.\n\n🌿 100% Artisan Made\n📦 Safe Eco-Friendly Dispatch\n\n🔗 Shop directly via link in bio.\n\n#KarigarAI #VocalForLocal #HandmadeInIndia #ArtisanCraft #${craftName.replace(/\s+/g, "")} #IndianHandicrafts #SustainableArt`;
        tags = ["#KarigarAI", "#VocalForLocal", "#HandmadeInIndia", `#${craftName.replace(/\s+/g, "")}`, "#IndianCrafts"];
      } else if (marketingTone === "heritage") {
        wa = `🏛️ *Authentic Heritage Craftsmanship*\n\nDiscover the beauty of pure, generational *${craftName}*. Crafted with time-honored techniques passed down through generations.\n\n✔️ Authentic Artisan Certified\n✔️ Direct from Maker to Home\n\n🛒 *Explore collection:* https://karigar.ai/shop\n📞 WhatsApp us to reserve your piece!`;
        ig = `Every thread, carve, and shape tells a story centuries in the making. 🌟 Introducing our mastercrafted ${craftName} — where cultural heritage meets modern elegance.\n\n🌿 Direct from Master Artisans\n✨ Certified Authentic\n\nTap link in bio to bring heritage into your home.\n\n#HeritageCraft #ArtisanStory #KarigarAI #TraditionalArt #${craftName.replace(/\s+/g, "")}`;
        tags = ["#HeritageCraft", "#ArtisanStory", "#KarigarAI", "#HandloomIndia", "#SupportArtisans"];
      } else {
        wa = `🎉 *New Creation Alert!* 🎉\n\nWe just finished crafting a new batch of *${craftName}*! Limited pieces available.\n\n🔹 Premium Finish & Fine Detailing\n🔹 Direct Artisan Price (No Middlemen)\n\n🛒 *View & Buy here:* https://karigar.ai/shop\nDM or WhatsApp for instant ordering.`;
        ig = `Fresh off the artisan workbench! 🔥 Our newest ${craftName} is now live on our marketplace.\n\nLimited batch handcrafted with immense love and precision.\n\n🛒 Shop now before it sells out — Link in bio!\n\n#NewLaunch #KarigarAI #Handcrafted #${craftName.replace(/\s+/g, "")} #ArtisanMarket`;
        tags = ["#NewLaunch", "#KarigarAI", "#ArtisanDirect", "#BuyHandmade", "#IndianArt"];
      }

      setGeneratedPost({ whatsapp: wa, instagram: ig, hashtags: tags });
      toast.success("✨ Marketing kit generated!");
    } finally {
      setIsGeneratingMarketing(false);
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Open AI Saathi"
        aria-expanded={open}
        className="fixed right-4 bottom-24 z-40 grid size-14 place-items-center rounded-full bg-terracotta text-cream shadow-glow transition-all hover:scale-105 active:scale-95 lg:bottom-6 cursor-pointer"
      >
        {open ? <X className="size-6" /> : <Sparkles className="size-6 animate-pulse" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className={`fixed right-4 z-40 flex flex-col rounded-3xl surface-card shadow-2xl border border-border overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "bottom-4 top-4 left-4 right-4 lg:left-auto lg:right-6 lg:w-[680px] lg:bottom-6 lg:top-6"
                : "bottom-40 w-[min(28rem,calc(100vw-2rem))] h-[580px] max-h-[80vh] lg:bottom-24"
            }`}
            role="dialog"
            aria-label="AI Saathi"
          >
            {/* Header */}
            <div className="p-3.5 bg-gradient-to-r from-terracotta to-terracotta-deep text-cream flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-2xl bg-cream/20 font-bold backdrop-blur-sm shadow-inner">
                  <Bot className="size-5 text-cream" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-sm leading-tight">AI Saathi (एआई साथी)</h3>
                    <span className="text-[10px] bg-cream/20 px-2 py-0.5 rounded-full font-semibold">Super Mentor</span>
                  </div>
                  <p className="text-[11px] text-cream/80">Pricing • Safety • Marketing • Packaging Advisor</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse" : "Expand window"}
                  className="size-7 rounded-full grid place-items-center hover:bg-cream/20 transition text-cream/90 cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="size-7 rounded-full grid place-items-center hover:bg-cream/20 transition text-cream/90 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="px-2 py-1.5 bg-muted/60 border-b border-border flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: "chat", label: "Chat & Voice", icon: MessageSquare },
                { id: "hub", label: "All Tools (6)", icon: LayoutGrid },
                { id: "pricing", label: "Smart Pricing", icon: Calculator },
                { id: "scam", label: "Scam Shield", icon: ShieldAlert },
                { id: "marketing", label: "Marketing Kit", icon: Share2 },
                { id: "guide", label: "Packaging & Photo", icon: Package },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? "bg-terracotta text-cream shadow-sm"
                        : "text-soft hover:text-ink hover:bg-muted"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* MAIN TAB CONTENT BODIES */}

            {/* 1. CHAT & VOICE TAB */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-background/50">
                {/* Chat Messages Body */}
                <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                          m.sender === "user"
                            ? "bg-terracotta text-cream rounded-tr-none font-medium shadow-sm"
                            : "surface-card border border-border/80 text-ink rounded-tl-none shadow-sm"
                        }`}
                      >
                        <div className="whitespace-pre-line">{m.text}</div>

                        {/* Read Aloud button for Saathi replies */}
                        {m.sender === "saathi" && (
                          <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => speakText(m.text)}
                              className="inline-flex items-center gap-1 text-[11px] text-terracotta font-semibold hover:underline cursor-pointer"
                            >
                              <Volume2 className="size-3" />
                              <span>Listen (आवाज ऐका/सुनें)</span>
                            </button>
                            <span className="text-[10px] text-soft">{m.timestamp}</span>
                          </div>
                        )}
                      </div>

                      {/* Suggestion Action Chips */}
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
                      <RefreshCw className="size-3.5 animate-spin text-terracotta" />
                      <span>AI Saathi is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Prompt Carousel */}
                <div className="px-3 py-2 border-t border-border/50 bg-muted/20 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
                  {PROMPT_CHIPS.map((chip, idx) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(chip.label)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-card border border-border/80 text-ink hover:border-terracotta/50 hover:text-terracotta whitespace-nowrap transition cursor-pointer shrink-0"
                      >
                        <Icon className="size-3 text-terracotta" />
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Input Bar with Voice Mic & Send */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="p-3 border-t border-border/60 bg-card flex items-center gap-2 shrink-0"
                >
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    title="Speak to Saathi"
                    className={`size-9 rounded-full grid place-items-center transition cursor-pointer ${
                      isVoiceRecording
                        ? "bg-red-500 text-cream animate-pulse scale-110"
                        : "bg-muted text-soft hover:text-terracotta hover:bg-blush/20"
                    }`}
                  >
                    {isVoiceRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isVoiceRecording
                        ? "Listening... Speak in Hindi, Marathi, or English..."
                        : "Ask Saathi about pricing, scam checks, marketing..."
                    }
                    className="flex-1 rounded-full bg-muted/60 px-3.5 py-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-terracotta border border-border/50"
                  />

                  <Button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    size="sm"
                    className="rounded-full bg-terracotta text-cream shrink-0 size-9 p-0 grid place-items-center"
                  >
                    <Send className="size-3.5" />
                  </Button>
                </form>
              </div>
            )}

            {/* 2. ALL TOOLS HUB GRID */}
            {activeTab === "hub" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display text-sm font-bold text-ink">AI Saathi Mentor Tool Suite</h4>
                    <p className="text-[11px] text-soft">6 dedicated intelligent tools designed specifically for artisans</p>
                  </div>
                  <span className="text-[11px] font-bold text-terracotta bg-terracotta/10 px-2.5 py-0.5 rounded-full">
                    6 Active Tools
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tool 1: Smart Pricing */}
                  <div
                    onClick={() => setActiveTab("pricing")}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-terracotta/50 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="size-8 rounded-xl bg-amber-500/15 text-amber-600 grid place-items-center font-bold">
                        <Calculator className="size-4" />
                      </span>
                      <span className="text-[10px] text-soft group-hover:text-terracotta flex items-center gap-0.5">
                        Open Tool <ChevronRight className="size-3" />
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-ink group-hover:text-terracotta transition">
                      Smart Pricing Calculator
                    </h5>
                    <p className="text-[11px] text-soft mt-1 leading-snug">
                      Compute fair wages, raw material costs, packaging, and healthy profit margins.
                    </p>
                  </div>

                  {/* Tool 2: Scam & Fraud Shield */}
                  <div
                    onClick={() => setActiveTab("scam")}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-red-500/50 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="size-8 rounded-xl bg-red-500/15 text-red-600 grid place-items-center font-bold">
                        <ShieldAlert className="size-4" />
                      </span>
                      <span className="text-[10px] text-soft group-hover:text-red-600 flex items-center gap-0.5">
                        Open Tool <ChevronRight className="size-3" />
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-ink group-hover:text-red-600 transition">
                      Scam & UPI Fraud Shield
                    </h5>
                    <p className="text-[11px] text-soft mt-1 leading-snug">
                      Inspect suspicious buyer requests, fake payment screenshots, and UPI QR codes.
                    </p>
                  </div>

                  {/* Tool 3: Marketing Post Generator */}
                  <div
                    onClick={() => setActiveTab("marketing")}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/50 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="size-8 rounded-xl bg-emerald-500/15 text-emerald-600 grid place-items-center font-bold">
                        <Share2 className="size-4" />
                      </span>
                      <span className="text-[10px] text-soft group-hover:text-emerald-600 flex items-center gap-0.5">
                        Open Tool <ChevronRight className="size-3" />
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-ink group-hover:text-emerald-600 transition">
                      WhatsApp & Social Marketing
                    </h5>
                    <p className="text-[11px] text-soft mt-1 leading-snug">
                      Generate ready-to-share WhatsApp broadcasts and Instagram posts in 1 click.
                    </p>
                  </div>

                  {/* Tool 4: Safe Eco Packaging */}
                  <div
                    onClick={() => setActiveTab("guide")}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-blue-500/50 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="size-8 rounded-xl bg-blue-500/15 text-blue-600 grid place-items-center font-bold">
                        <Package className="size-4" />
                      </span>
                      <span className="text-[10px] text-soft group-hover:text-blue-600 flex items-center gap-0.5">
                        Open Tool <ChevronRight className="size-3" />
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-ink group-hover:text-blue-600 transition">
                      Eco-Packaging & Dispatch
                    </h5>
                    <p className="text-[11px] text-soft mt-1 leading-snug">
                      Zero-breakage packing checklist and thank-you card templates for buyers.
                    </p>
                  </div>

                  {/* Tool 5: Craft Photography Advisor */}
                  <div
                    onClick={() => setActiveTab("guide")}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-purple-500/50 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="size-8 rounded-xl bg-purple-500/15 text-purple-600 grid place-items-center font-bold">
                        <Camera className="size-4" />
                      </span>
                      <span className="text-[10px] text-soft group-hover:text-purple-600 flex items-center gap-0.5">
                        Open Tool <ChevronRight className="size-3" />
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-ink group-hover:text-purple-600 transition">
                      Mobile Craft Photography
                    </h5>
                    <p className="text-[11px] text-soft mt-1 leading-snug">
                      Lighting guides, background tips, and angle rules to make crafts stand out online.
                    </p>
                  </div>

                  {/* Tool 6: Business Growth Insights */}
                  <div
                    onClick={() => handleSend("How can I increase my monthly sales and orders?")}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-terracotta/50 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="size-8 rounded-xl bg-terracotta/15 text-terracotta grid place-items-center font-bold">
                        <TrendingUp className="size-4" />
                      </span>
                      <span className="text-[10px] text-soft group-hover:text-terracotta flex items-center gap-0.5">
                        Ask Saathi <ChevronRight className="size-3" />
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-ink group-hover:text-terracotta transition">
                      Artisan Business Growth
                    </h5>
                    <p className="text-[11px] text-soft mt-1 leading-snug">
                      Personalized recommendations based on your store sales and customer demand.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SMART PRICING CALCULATOR TAB */}
            {activeTab === "pricing" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">
                <div>
                  <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                    <Calculator className="size-4 text-terracotta" />
                    <span>Smart Artisan Pricing Calculator</span>
                  </h4>
                  <p className="text-[11px] text-soft">
                    Never underprice your work. Calculate fair wages and sustainable profit margins.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Raw Materials Cost (₹)">
                    <input
                      type="number"
                      value={rawMaterialsCost}
                      onChange={(e) => setRawMaterialsCost(Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Hours Worked">
                    <input
                      type="number"
                      value={laborHours}
                      onChange={(e) => setLaborHours(Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Fair Hourly Wage (₹/hr)">
                    <input
                      type="number"
                      value={hourlyWage}
                      onChange={(e) => setHourlyWage(Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Packaging & Box (₹)">
                    <input
                      type="number"
                      value={packagingShippingCost}
                      onChange={(e) => setPackagingShippingCost(Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-soft">Profit Margin Target</span>
                    <span className="font-bold text-terracotta">{profitMarginPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={profitMarginPercent}
                    onChange={(e) => setProfitMarginPercent(Number(e.target.value))}
                    className="w-full accent-terracotta"
                  />
                </div>

                {/* Calculation Result Card */}
                <div className="rounded-2xl p-4 bg-terracotta/10 border border-terracotta/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-soft font-semibold">Recommended Retail Price</p>
                      <p className="font-display text-2xl font-bold text-terracotta">₹{suggestedPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-soft font-semibold">Net Profit</p>
                      <p className="font-display text-lg font-bold text-emerald-600">+₹{profitAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-terracotta/20 grid grid-cols-2 text-[11px] text-soft gap-2">
                    <div>Base Production Cost: <strong className="text-ink">₹{totalCost}</strong></div>
                    <div>Wholesale Bulk Rate: <strong className="text-ink">₹{wholesalePrice}</strong></div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSend(`How do I justify charging ₹${suggestedPrice} for my handcrafted ${user.craft || "product"} to buyers?`)}
                  className="w-full rounded-xl bg-terracotta text-cream text-xs"
                >
                  Ask Saathi: How to pitch this price to buyers?
                </Button>
              </div>
            )}

            {/* 4. SCAM & FRAUD SHIELD TAB */}
            {activeTab === "scam" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">
                <div>
                  <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                    <ShieldAlert className="size-4 text-red-600" />
                    <span>Artisan Scam & UPI Fraud Shield</span>
                  </h4>
                  <p className="text-[11px] text-soft">
                    Paste any suspicious message, buyer demand, or screenshot text to verify risk.
                  </p>
                </div>

                {/* Golden Safety Rule Callout */}
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5">
                  <AlertTriangle className="size-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="text-xs text-red-950 dark:text-red-200">
                    <strong className="font-bold text-red-600">CRITICAL SAFETY RULE:</strong> Receiving money NEVER requires entering your UPI PIN or scanning a QR code.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soft mb-1.5">Paste Buyer Message / SMS</label>
                  <textarea
                    rows={3}
                    value={scamInputText}
                    onChange={(e) => setScamInputText(e.target.value)}
                    placeholder="E.g. I sent you payment via QR code, please scan and enter your UPI PIN to receive money..."
                    className={inputClass}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setScamInputText("I have sent ₹5,000 on Google Pay. Please scan this QR code and type your UPI PIN to approve the payment.")}
                      className="text-[10px] text-soft hover:text-terracotta underline cursor-pointer"
                    >
                      Try Scam Example
                    </button>
                    <button
                      type="button"
                      onClick={() => setScamInputText("Namaste, I want to order 2 blue sarees. Can you ship to Pune via courier? What is your account number?")}
                      className="text-[10px] text-soft hover:text-terracotta underline cursor-pointer"
                    >
                      Try Genuine Example
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleScamEvaluate}
                  disabled={!scamInputText.trim() || isCheckingScam}
                  className="w-full rounded-xl bg-red-600 text-cream text-xs hover:bg-red-700"
                >
                  {isCheckingScam ? <RefreshCw className="size-4 animate-spin mr-1" /> : <ShieldAlert className="size-4 mr-1" />}
                  Analyze Message Risk
                </Button>

                {/* Scam Result Box */}
                {scamResult && (
                  <div
                    className={`rounded-2xl p-4 border space-y-2 ${
                      scamResult.is_suspicious
                        ? "bg-red-500/10 border-red-500/40 text-red-950 dark:text-red-200"
                        : "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs flex items-center gap-1.5">
                        {scamResult.is_suspicious ? <ShieldAlert className="size-4 text-red-600" /> : <ShieldCheck className="size-4 text-emerald-600" />}
                        {scamResult.is_suspicious ? "HIGH SCAM RISK DETECTED" : "MESSAGE APPEARS SAFE"}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-card border">
                        Risk: {scamResult.risk_score}%
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed">{scamResult.advice}</p>

                    {scamResult.warning_flags && scamResult.warning_flags.length > 0 && (
                      <div className="pt-2 border-t border-border/40 text-[11px] space-y-1">
                        <strong className="block text-soft">Detected Warning Flags:</strong>
                        {scamResult.warning_flags.map((flag, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span>•</span>
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. MARKETING POST GENERATOR TAB */}
            {activeTab === "marketing" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">
                <div>
                  <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                    <Share2 className="size-4 text-emerald-600" />
                    <span>WhatsApp & Social Marketing Studio</span>
                  </h4>
                  <p className="text-[11px] text-soft">
                    Generate compelling promotional messages and social media copy with 1-click copy.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Craft / Item Name">
                    <input
                      type="text"
                      value={marketingCraft}
                      onChange={(e) => setMarketingCraft(e.target.value)}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Post Theme / Occasion">
                    <select
                      value={marketingTone}
                      onChange={(e: any) => setMarketingTone(e.target.value)}
                      className={inputClass}
                    >
                      <option value="festive">Festive Celebration</option>
                      <option value="heritage">Heritage & Craft Story</option>
                      <option value="launch">New Product Launch</option>
                    </select>
                  </Field>
                </div>

                <Button
                  onClick={handleGenerateMarketing}
                  disabled={isGeneratingMarketing}
                  className="w-full rounded-xl bg-emerald-600 text-cream text-xs hover:bg-emerald-700"
                >
                  {isGeneratingMarketing ? <RefreshCw className="size-4 animate-spin mr-1" /> : <Sparkles className="size-4 mr-1" />}
                  Generate Marketing Kit
                </Button>

                {generatedPost && (
                  <div className="space-y-3 pt-2">
                    {/* WhatsApp Card */}
                    <div className="rounded-2xl p-3.5 bg-card border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">📱 WhatsApp Broadcast Message</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(generatedPost.whatsapp, "wa")}
                          className="h-7 text-[11px] rounded-full"
                        >
                          {copiedKey === "wa" ? <Check className="size-3 text-emerald-600 mr-1" /> : <Copy className="size-3 mr-1" />}
                          {copiedKey === "wa" ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <p className="text-xs text-ink whitespace-pre-line leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/40">
                        {generatedPost.whatsapp}
                      </p>
                    </div>

                    {/* Instagram Card */}
                    <div className="rounded-2xl p-3.5 bg-card border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400">📸 Instagram Caption & Hashtags</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(generatedPost.instagram, "ig")}
                          className="h-7 text-[11px] rounded-full"
                        >
                          {copiedKey === "ig" ? <Check className="size-3 text-purple-600 mr-1" /> : <Copy className="size-3 mr-1" />}
                          {copiedKey === "ig" ? "Copied" : "Copy"}
                        </Button>
                      </div>
                      <p className="text-xs text-ink whitespace-pre-line leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/40">
                        {generatedPost.instagram}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. PACKAGING & PHOTO GUIDES TAB */}
            {activeTab === "guide" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50">
                <div>
                  <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                    <Package className="size-4 text-blue-600" />
                    <span>Safe Packaging & Mobile Photography Guides</span>
                  </h4>
                  <p className="text-[11px] text-soft">
                    Essential craft protection checklists and smartphone camera tips.
                  </p>
                </div>

                {/* Eco-Packaging Checklist */}
                <div className="rounded-2xl p-4 bg-card border border-border/80 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-ink">
                    <span className="size-6 rounded-lg bg-blue-500/15 text-blue-600 grid place-items-center font-bold text-[11px]">📦</span>
                    <span>Eco-Friendly Zero-Damage Packing Guide</span>
                  </div>
                  <ul className="text-xs text-soft space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta font-bold">1.</span>
                      <span><strong>Primary Layer:</strong> Wrap delicate pieces with biodegradable honeycomb paper or unbleached cotton pouch.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta font-bold">2.</span>
                      <span><strong>Cushioning:</strong> Use shredded kraft paper to fill empty void space inside a 3-ply corrugated box.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta font-bold">3.</span>
                      <span><strong>Personal Touch:</strong> Always insert a handwritten thank-you card with your artisan story and craft care tips.</span>
                    </li>
                  </ul>
                </div>

                {/* Photography Guide */}
                <div className="rounded-2xl p-4 bg-card border border-border/80 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-xs text-ink">
                    <span className="size-6 rounded-lg bg-purple-500/15 text-purple-600 grid place-items-center font-bold text-[11px]">📸</span>
                    <span>Mobile Photography Lighting & Angles</span>
                  </div>
                  <ul className="text-xs text-soft space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta font-bold">1.</span>
                      <span><strong>Soft Daylight:</strong> Shoot 2-3 feet from an open window during morning (8-10 AM) or afternoon (3-5 PM). Avoid harsh direct sun.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta font-bold">2.</span>
                      <span><strong>Clean Backdrop:</strong> Use a plain neutral sheet, solid wooden table, or earthen wall to avoid distracting clutter.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-terracotta font-bold">3.</span>
                      <span><strong>Essential Shots:</strong> Capture 1 front hero view, 1 fine close-up showing handloom weave or carving texture, and 1 lifestyle angle.</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => handleSend("Can you write a short thank you note template that I can put inside customer packages?")}
                  className="w-full rounded-xl bg-terracotta text-cream text-xs"
                >
                  Ask Saathi to write customer thank you note
                </Button>
              </div>
            )}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
