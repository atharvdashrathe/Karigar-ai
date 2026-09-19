import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, AlertTriangle, Lock, Eye, X, RefreshCw } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";

interface SafetyCenterModalProps {
  open: boolean;
  onClose: () => void;
}

export function SafetyCenterModal({ open, onClose }: SafetyCenterModalProps) {
  const { t } = useI18n();
  const [testMessage, setTestMessage] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    is_suspicious: boolean;
    risk_score: number;
    warning_flags: string[];
    advice: string;
  } | null>(null);

  async function handleCheckMessage() {
    if (!testMessage.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/saathi/check-scam`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_text: testMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data);
      } else {
        throw new Error("Fallback");
      }
    } catch {
      const m_low = testMessage.toLowerCase();
      const isSus = m_low.includes("pin") || m_low.includes("otp") || m_low.includes("qr code");
      setEvaluation({
        is_suspicious: isSus,
        risk_score: isSus ? 85 : 10,
        warning_flags: isSus ? ["Asks for PIN / OTP verification"] : [],
        advice: isSus
          ? "⚠️ This message contains critical warning signs. Legitimate buyers never ask you to enter a PIN to receive payment."
          : "✅ No obvious scam patterns detected. Always verify incoming bank balance directly.",
      });
    } finally {
      setIsEvaluating(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-red-500/15 text-red-600 font-bold">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Artisan Scam Protection & Safety Center</h2>
                <p className="text-xs text-soft">Essential rules to safeguard your bank account and hard-earned money.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-full grid place-items-center text-soft hover:text-ink hover:bg-muted transition"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {/* Golden Safety Rule Callout */}
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 text-red-600 mt-0.5" />
              <div className="text-xs text-red-950 dark:text-red-200 leading-relaxed">
                <strong className="block font-display text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                  CRITICAL RULE: Receiving Money NEVER Requires a UPI PIN
                </strong>
                If someone asks you to type your UPI PIN, scan a QR code, or approve a request to "receive payment", it is <strong>100% a fraud attempt</strong>. Money goes directly to your bank account automatically.
              </div>
            </div>

            {/* Never Share List */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { title: "OTP", desc: "Never share 4/6 digit SMS codes" },
                { title: "UPI PIN", desc: "Never enter to receive money" },
                { title: "Bank Password", desc: "Keep 100% private always" },
                { title: "Card CVV/PIN", desc: "Never send card photos" },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl surface-card border border-border/60">
                  <span className="text-xs font-bold text-red-600 block">❌ NEVER SHARE</span>
                  <p className="font-display text-sm font-bold text-ink mt-1">{item.title}</p>
                  <p className="text-[10px] text-soft mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Interactive Scam Message Checker */}
            <div className="pt-4 border-t border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-soft mb-2 flex items-center gap-1.5">
                <Eye className="size-4 text-terracotta" />
                Inspect a Suspicious Buyer Message
              </h3>
              <p className="text-xs text-soft mb-3">
                Paste any WhatsApp, SMS, or enquiry text below to check for warning signs:
              </p>

              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Paste message e.g. 'I am sending money, scan this QR code and type PIN to accept ₹2500...'"
                  className={inputClass}
                />
                <Button
                  onClick={handleCheckMessage}
                  disabled={!testMessage.trim() || isEvaluating}
                  className="rounded-full bg-terracotta text-cream shadow-glow"
                >
                  {isEvaluating ? <RefreshCw className="size-4 animate-spin mr-1.5" /> : <ShieldCheck className="size-4 mr-1.5" />}
                  Check Message for Scam Signs
                </Button>
              </div>

              {evaluation && (
                <div
                  className={`mt-4 p-4 rounded-2xl border text-xs leading-relaxed ${
                    evaluation.is_suspicious
                      ? "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  }`}
                >
                  <p className="font-bold text-sm mb-1">{evaluation.advice}</p>
                  {evaluation.warning_flags.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 mt-2 text-[11px]">
                      {evaluation.warning_flags.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
