import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Check, DollarSign, HelpCircle, Info, Sparkles, X, ArrowRight } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";

interface SmartPricingModalProps {
  open: boolean;
  onClose: () => void;
  initialMaterialCost?: number;
  initialHours?: number;
  onApplyPrice?: (suggestedPrice: number, minPrice: number) => void;
}

export function SmartPricingModal({
  open,
  onClose,
  initialMaterialCost = 300,
  initialHours = 5,
  onApplyPrice,
}: SmartPricingModalProps) {
  const { t } = useI18n();

  const [materialCost, setMaterialCost] = useState(initialMaterialCost);
  const [labourHours, setLabourHours] = useState(initialHours);
  const [hourlyWage, setHourlyWage] = useState(80);
  const [packagingCost, setPackagingCost] = useState(50);
  const [shippingCost, setShippingCost] = useState(80);
  const [platformFee, setPlatformFee] = useState(0);

  const [result, setResult] = useState<{
    totalCost: number;
    labourCost: number;
    minPrice: number;
    recPrice: number;
    profit: number;
    artisanEarnings: number;
    explanation: string;
  } | null>(null);

  // Re-calculate whenever inputs change
  useEffect(() => {
    const labour = labourHours * hourlyWage;
    const base = materialCost + labour + packagingCost + shippingCost;
    const min = Math.round(base * 1.15);
    const rawRec = base * 1.45;
    const rec = Math.max(min, Math.round(rawRec / 10) * 10 - 1);
    const fee = Math.round(rec * (platformFee / 100));
    const profit = rec - base - fee;
    const earnings = labour + profit;

    const explanation =
      `Based on ₹${materialCost} materials and ${labourHours} hours of skilled craft labor @ ₹${hourlyWage}/hr (₹${labour}), ` +
      `plus ₹${packagingCost} packaging and ₹${shippingCost} shipping. ` +
      `Recommended ₹${rec} guarantees ₹${earnings} total earnings for you (fair wage + profit).`;

    setResult({
      totalCost: base,
      labourCost: labour,
      minPrice: min,
      recPrice: rec,
      profit,
      artisanEarnings: earnings,
      explanation,
    });
  }, [materialCost, labourHours, hourlyWage, packagingCost, shippingCost, platformFee]);

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
              <span className="grid size-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 font-bold">
                <Calculator className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Smart Fair-Trade Pricing</h2>
                <p className="text-xs text-soft">Ensure fair artisan living wage & transparent retail margins.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-full grid place-items-center text-soft hover:text-ink hover:bg-muted transition"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inputs Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-soft">Cost Components</h3>

              <Field label="Raw Material Cost (₹)">
                <input
                  type="number"
                  value={materialCost}
                  onChange={(e) => setMaterialCost(Math.max(0, Number(e.target.value)))}
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Labour Hours">
                  <input
                    type="number"
                    step="0.5"
                    value={labourHours}
                    onChange={(e) => setLabourHours(Math.max(0.5, Number(e.target.value)))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Hourly Wage (₹/hr)">
                  <input
                    type="number"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(Math.max(0, Number(e.target.value)))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Packaging (₹)">
                  <input
                    type="number"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(Math.max(0, Number(e.target.value)))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Shipping (₹)">
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            {/* Calculations & Results Column */}
            {result && (
              <div className="space-y-4 rounded-3xl surface-card p-5 border border-border/80 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-terracotta">Calculated Pricing</h3>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-soft pb-2 border-b border-border/40">
                      <span>Total Production Cost:</span>
                      <span className="font-semibold text-ink">₹{result.totalCost}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-soft pb-2 border-b border-border/40">
                      <span>Minimum Sustainable Price:</span>
                      <span className="font-semibold text-amber-600">₹{result.minPrice}</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-terracotta/10 border border-terracotta/20 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-terracotta uppercase">Recommended Price</p>
                        <p className="font-display text-2xl font-bold text-terracotta">₹{result.recPrice}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Your Take-Home</p>
                        <p className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-400">
                          ₹{result.artisanEarnings}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-soft leading-relaxed bg-muted/40 p-3 rounded-2xl border border-border/50">
                    <p className="font-semibold text-ink mb-0.5">Why this price?</p>
                    {result.explanation}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    onApplyPrice?.(result.recPrice, result.minPrice);
                    onClose();
                  }}
                  className="w-full rounded-full bg-terracotta text-cream shadow-glow mt-2"
                >
                  <Check className="size-4 mr-1.5" />
                  Apply ₹{result.recPrice} to Product
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
