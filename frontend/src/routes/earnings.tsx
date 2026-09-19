import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, IndianRupee, Package, ShoppingBag, ArrowUpRight, ShieldCheck, CheckCircle2, Clock, Truck, QrCode } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Card, ErrorState, LoadingState, SectionTitle, Button, Field, inputClass } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";

export const Route = createFileRoute("/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings & Payouts — KarigarAI" },
      { name: "description", content: "Total earnings, order payouts, transactions ledger and direct rural bank transfer simulation." },
    ],
  }),
  component: Earnings,
});

const RECENT_TRANSACTIONS = [
  {
    id: "tx-1",
    buyer: "Coastal Interiors Pvt Ltd",
    product: "Handmade Bamboo Basket (x4)",
    amount: 2796,
    date: "16 Sep 2026",
    status: "Completed",
    delivery: "Delivered",
  },
  {
    id: "tx-2",
    buyer: "Anita R.",
    product: "Handmade Bamboo Basket (x1)",
    amount: 699,
    date: "14 Sep 2026",
    status: "Completed",
    delivery: "Delivered",
  },
  {
    id: "tx-3",
    buyer: "Regional Handicrafts Store",
    product: "Hand-carved Sheesham Bowl (x6)",
    amount: 4500,
    date: "12 Sep 2026",
    status: "Pending Settlement",
    delivery: "Pickup Scheduled",
  },
  {
    id: "tx-4",
    buyer: "Pooja Sharma",
    product: "Heritage Brass Diya Lamp (x2)",
    amount: 2598,
    date: "10 Sep 2026",
    status: "Completed",
    delivery: "Delivered",
  },
];

function Earnings() {
  const { t } = useI18n();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [upiId, setUpiId] = useState("savitapatil@sbi");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawnSuccess, setWithdrawnSuccess] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["earnings"], queryFn: api.getEarnings });

  const stats = data?.stats;
  const availableBalance = stats ? Math.round(stats.earnings * 0.72) : 8950;
  const pendingSettlement = stats ? Math.round(stats.earnings * 0.28) : 3500;

  const tiles = [
    {
      icon: IndianRupee,
      label: "Total Sales",
      value: stats ? `₹${stats.earnings.toLocaleString("en-IN")}` : "₹12,450",
      sub: "100% fair-trade volume",
      tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      icon: ArrowUpRight,
      label: "Available for Payout",
      value: `₹${availableBalance.toLocaleString("en-IN")}`,
      sub: "Instant bank transfer ready",
      tone: "bg-terracotta/15 text-terracotta",
    },
    {
      icon: Clock,
      label: "In Transit / Pending",
      value: `₹${pendingSettlement.toLocaleString("en-IN")}`,
      sub: "Releases on delivery",
      tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    {
      icon: ShoppingBag,
      label: "Completed Orders",
      value: stats?.orders ?? "12",
      sub: "Across 4 states",
      tone: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    },
  ];

  function handleWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      setWithdrawnSuccess(true);
      toast.success("✅ Demo Payout initiated to " + upiId);
    }, 1200);
  }

  return (
    <AppShell
      title={t("earnings")}
      subtitle="Track your handmade sales volume, order settlements and direct artisan payouts."
      action={
        <Button
          onClick={() => {
            setWithdrawnSuccess(false);
            setWithdrawModalOpen(true);
          }}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-glow text-xs"
        >
          <IndianRupee className="size-3.5 mr-1" />
          Request Payout (₹{availableBalance.toLocaleString()})
        </Button>
      }
    >
      {isError ? (
        <ErrorState message={t("somethingWrong")} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState label={t("loading")} />
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
              <Card key={tile.label} className="p-5 surface-card border border-border/80 flex flex-col justify-between">
                <div>
                  <div className={`grid size-10 place-items-center rounded-2xl ${tile.tone}`}>
                    <tile.icon className="size-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 font-display text-2xl font-bold text-ink tabular-nums">{tile.value}</p>
                  <p className="text-xs font-semibold text-soft uppercase tracking-wider">{tile.label}</p>
                </div>
                <p className="text-[11px] text-soft pt-2 mt-2 border-t border-border/40">{tile.sub}</p>
              </Card>
            ))}
          </div>

          {/* Sales Chart */}
          <Card className="p-6 border border-border/80">
            <SectionTitle eyebrow="Performance" title="Monthly Craft Earnings (6-Month Trend)" />
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series ?? []} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-terracotta)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-terracotta)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-soft)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-soft)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "1rem",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Earnings"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--color-terracotta)"
                    strokeWidth={2.5}
                    fill="url(#earningsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Orders & Transactions Ledger */}
          <Card className="border border-border/80">
            <SectionTitle
              title="Recent Order Settlements & Ledger"
              subtitle="Detailed ledger of your customer sales and fulfillment status."
            />

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-soft">
                    <th className="pb-3 font-semibold">Customer / Store</th>
                    <th className="pb-3 font-semibold">Product Items</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Delivery Status</th>
                    <th className="pb-3 font-semibold text-right">Artisan Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {RECENT_TRANSACTIONS.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition">
                      <td className="py-3.5 font-bold text-ink">{tx.buyer}</td>
                      <td className="py-3.5 text-soft">{tx.product}</td>
                      <td className="py-3.5 text-soft">{tx.date}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            tx.delivery === "Delivered"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                          }`}
                        >
                          {tx.delivery === "Delivered" ? <CheckCircle2 className="size-3" /> : <Truck className="size-3" />}
                          {tx.delivery}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-display font-bold text-terracotta">
                        ₹{tx.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* UPI Payout Demo Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 bg-card rounded-3xl border border-border shadow-2xl">
            {!withdrawnSuccess ? (
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <h3 className="font-display text-lg font-bold text-ink">Transfer Earnings to Bank</h3>
                  <button
                    type="button"
                    onClick={() => setWithdrawModalOpen(false)}
                    className="size-7 rounded-full grid place-items-center text-soft hover:bg-muted"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-xs text-soft font-medium">Available for Transfer:</span>
                  <span className="font-display text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{availableBalance.toLocaleString()}
                  </span>
                </div>

                <Field label="Your UPI ID (VPA)">
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@sbi or mobile@upi"
                    className={inputClass}
                  />
                </Field>

                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 text-[11px] text-soft leading-relaxed">
                  🛡️ <strong>Safety Reminder:</strong> Karigar AI transfers funds directly into your bank. You will NEVER be asked to type your UPI PIN to receive money.
                </div>

                <div className="text-[10px] text-soft italic text-center">
                  * Prototype Demo Mode: Simulates direct bank deposit without processing live banking transactions.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setWithdrawModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isWithdrawing}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isWithdrawing ? "Initiating Transfer..." : `Transfer ₹${availableBalance.toLocaleString()}`}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-600 grid place-items-center mx-auto">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink">Payout Initiated!</h3>
                <p className="text-xs text-soft">
                  ₹{availableBalance.toLocaleString()} is being deposited to <strong>{upiId}</strong>.
                </p>
                <p className="text-[11px] text-emerald-600 font-mono">Reference: KRG-PAY-2026-9821</p>
                <Button onClick={() => setWithdrawModalOpen(false)} className="rounded-full mt-2">
                  Done
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
