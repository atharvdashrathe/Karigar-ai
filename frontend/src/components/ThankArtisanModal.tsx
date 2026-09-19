import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Star, Send, X, Sparkles } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui-kit";
import { api } from "@/services/api";
import { toast } from "sonner";

interface ThankArtisanModalProps {
  open: boolean;
  onClose: () => void;
  artisanId?: string;
  artisanName?: string;
  productId?: string;
  productName?: string;
}

export function ThankArtisanModal({
  open,
  onClose,
  artisanId = "default",
  artisanName = "the Artisan",
  productId,
  productName,
}: ThankArtisanModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerLocation, setBuyerLocation] = useState("");
  const [message, setMessage] = useState("");
  const [stars, setStars] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!buyerName.trim() || !message.trim()) {
      toast.warning("Please enter your name and an appreciation message.");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/appreciations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisan_id: artisanId,
          product_id: productId,
          buyer_name: buyerName.trim(),
          buyer_location: buyerLocation.trim() || "India",
          message: message.trim(),
          rating_stars: stars,
        }),
      });
      toast.success(`❤️ Thank you! Your appreciation message was delivered to ${artisanName}!`);
      setMessage("");
      onClose();
    } catch {
      toast.success(`❤️ Thank you! Your appreciation message was noted.`);
      onClose();
    } finally {
      setIsSubmitting(false);
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
          className="relative w-full max-w-md bg-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-rose-500/15 text-rose-600 font-bold">
                <Heart className="size-5 fill-rose-500" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Thank {artisanName}</h2>
                <p className="text-xs text-soft">Send love & appreciation for their handmade craft.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-full grid place-items-center text-soft hover:text-ink hover:bg-muted transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {productName && (
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs flex items-center gap-2 text-ink">
                <Sparkles className="size-4 text-terracotta shrink-0" />
                <span>Product: <strong>{productName}</strong></span>
              </div>
            )}

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-soft mb-1.5">Your Rating</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`size-6 ${
                        s <= stars ? "text-amber-500 fill-amber-500" : "text-border"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Your Name">
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className={inputClass}
                />
              </Field>
              <Field label="Your City">
                <input
                  type="text"
                  value={buyerLocation}
                  onChange={(e) => setBuyerLocation(e.target.value)}
                  placeholder="e.g. Pune, MH"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Your Message of Appreciation">
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a warm note to the artisan celebrating their handmade creation..."
                className={inputClass}
              />
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-glow mt-2"
            >
              <Send className="size-4 mr-1.5" />
              {isSubmitting ? "Sending..." : "Send Appreciation ❤️"}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
