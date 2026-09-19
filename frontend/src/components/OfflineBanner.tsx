import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { offlineSync } from "@/lib/offline-sync";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function OfflineBanner() {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState(offlineSync.getIsOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = offlineSync.subscribe((online, count) => {
      setIsOnline(online);
      setPendingCount(count);
    });
    return unsub;
  }, []);

  async function handleManualSync() {
    if (!isOnline) {
      toast.warning("Cannot sync while offline. Reconnect to the internet first.");
      return;
    }
    setIsSyncing(true);
    try {
      const res = await offlineSync.syncAll();
      if (res.synced > 0) {
        toast.success(`Synced ${res.synced} offline item(s) to server!`);
      } else if (res.failed > 0) {
        toast.error(`Failed to sync ${res.failed} item(s). Will retry automatically.`);
      }
    } finally {
      setIsSyncing(false);
    }
  }

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`w-full px-4 py-2.5 text-xs font-medium flex items-center justify-between transition-colors ${
        !isOnline
          ? "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-b border-amber-500/30"
          : "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-b border-emerald-500/30"
      }`}
      role="status"
    >
      <div className="flex items-center gap-2 max-w-2xl">
        {!isOnline ? (
          <>
            <CloudOff className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
            <span>
              <strong>Offline Mode Active:</strong> You can still create products and update inventory. Everything is saved locally.
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>
              <strong>Online:</strong> {pendingCount} offline update(s) ready to synchronize with the backend.
            </span>
          </>
        )}
      </div>

      {pendingCount > 0 && isOnline && (
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 text-[11px] font-semibold shrink-0 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
          {isSyncing ? "Syncing..." : `Sync (${pendingCount})`}
        </button>
      )}
    </div>
  );
}
