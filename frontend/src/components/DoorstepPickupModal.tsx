import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Truck, Calendar, MapPin, CheckCircle2, X, Clock, ShieldCheck } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui-kit";
import { toast } from "sonner";

interface DoorstepPickupModalProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
  productName?: string;
}

export function DoorstepPickupModal({ open, onClose, orderId, productName }: DoorstepPickupModalProps) {
  const [pickupAddress, setPickupAddress] = useState("Patil Craft Workshop, Walwa Village, Sangli, MH 416313");
  const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [specialInstructions, setSpecialInstructions] = useState("Fragile handcrafted items. Bubble wrap already applied.");
  const [isScheduled, setIsScheduled] = useState(false);

  function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setIsScheduled(true);
    toast.success("🚚 Doorstep Rural Pickup scheduled! Agent assigned: SpeedPost Rural Agent #14");
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-teal-500/15 text-teal-600 font-bold">
                <Truck className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Doorstep Rural Pickup</h2>
                <p className="text-xs text-soft">Schedule postal/courier agent directly from your workshop.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-full grid place-items-center text-soft hover:text-ink hover:bg-muted transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {!isScheduled ? (
            <form onSubmit={handleSchedule} className="mt-5 space-y-4">
              {productName && (
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs text-ink font-medium">
                  Dispatching: <strong>{productName}</strong>
                </div>
              )}

              <Field label="Workshop / Rural Pickup Address">
                <textarea
                  rows={2}
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Preferred Pickup Date">
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Time Slot">
                  <select className={inputClass} defaultValue="morning">
                    <option value="morning">Morning (9 AM - 1 PM)</option>
                    <option value="afternoon">Afternoon (2 PM - 6 PM)</option>
                  </select>
                </Field>
              </div>

              <Field label="Packaging Notes for Agent">
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-300 leading-relaxed">
                ℹ️ <strong>Rural Postal Service Integration (Demo):</strong> An IndiaPost / SpeedPost rural logistics agent will visit your workshop on the scheduled date with packaging labels.
              </div>

              <Button type="submit" className="w-full rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-glow mt-2">
                <Truck className="size-4 mr-1.5" />
                Confirm Rural Pickup Request
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-4 text-center py-4">
              <div className="size-16 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center mx-auto">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Pickup Scheduled Successfully!</h3>
                <p className="text-xs text-soft mt-1">Assigned Agent: <strong>SpeedPost Rural Agent #14</strong></p>
                <p className="text-xs text-soft">Pickup Date: <strong>{pickupDate}</strong></p>
                <p className="text-xs text-emerald-600 font-mono mt-2">Tracking ID: KRG-LOG-94821</p>
              </div>

              <Button onClick={onClose} variant="outline" className="rounded-full mt-4">
                Done
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
