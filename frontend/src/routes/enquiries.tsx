import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/enquiries")({
  head: () => ({
    meta: [
      { title: "Buyer enquiries — KarigarAI" },
      { name: "description", content: "New, responded and completed enquiries from stores and gifting buyers." },
      { property: "og:title", content: "Buyer enquiries — KarigarAI" },
      { property: "og:description", content: "Track buyer enquiries for your handmade products." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Enquiries,
});

const TABS = ["new", "responded", "completed"] as const;

function Enquiries() {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("new");
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["enquiries"], queryFn: api.getEnquiries });

  const list = (data ?? []).filter((e) => e.status === tab);

  return (
    <AppShell title={t("enquiries")} subtitle="Messages from buyers interested in your products.">
      <div className="surface-glass mb-6 inline-flex rounded-full p-1" role="tablist" aria-label="Enquiry status">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold capitalize transition",
              tab === key ? "bg-terracotta text-cream" : "text-soft hover:text-ink",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState message={t("somethingWrong")} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState label={t("loading")} />
      ) : list.length === 0 ? (
        <EmptyState title="No enquiries here" help="New buyer messages will appear in this tab." />
      ) : (
        <div className="space-y-4">
          {list.map((e) => (
            <Card key={e.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-base font-bold">{e.buyer}</p>
                <Badge tone={e.status === "new" ? "brand" : e.status === "responded" ? "info" : "success"}>
                  {e.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-soft">
                {e.productName} · {e.date}
              </p>
              <p className="mt-3 text-sm text-soft">{e.message}</p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
