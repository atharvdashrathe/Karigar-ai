/**
 * OFFLINE-FIRST SYNCHRONIZATION MANAGER
 * --------------------------------------
 * Manages local offline queueing for:
 * 1. Offline Product Creation (Draft listings saved while disconnected)
 * 2. Offline Inventory / Stock adjustments
 * Automatically detects reconnection and syncs with FastAPI backend.
 */

export type PendingSyncItem = {
  id: string;
  type: "product" | "inventory";
  payload: any;
  createdAt: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
  error?: string;
};

const SYNC_QUEUE_KEY = "karigar_offline_sync_queue";

class OfflineSyncManager {
  private listeners: ((isOnline: boolean, pendingCount: number) => void)[] = [];
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
    }
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public getQueue(): PendingSyncItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: PendingSyncItem[]) {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.error("Failed to save offline sync queue:", e);
    }
  }

  public queueProduct(productData: any): PendingSyncItem {
    const queue = this.getQueue();
    const item: PendingSyncItem = {
      id: `offline-prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "product",
      payload: productData,
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending",
    };
    queue.push(item);
    this.saveQueue(queue);
    return item;
  }

  public queueInventoryChange(productId: string, change: number): PendingSyncItem {
    const queue = this.getQueue();
    // Check if there's an existing pending change for this product to merge
    const existing = queue.find((q) => q.type === "inventory" && q.payload?.productId === productId && q.status === "pending");
    if (existing) {
      existing.payload.change += change;
      this.saveQueue(queue);
      return existing;
    }

    const item: PendingSyncItem = {
      id: `offline-inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "inventory",
      payload: { productId, change },
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending",
    };
    queue.push(item);
    this.saveQueue(queue);
    return item;
  }

  public async syncAll(apiBaseUrl: string = "http://localhost:8000"): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline) return { synced: 0, failed: 0 };
    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let syncedCount = 0;
    let failedCount = 0;
    const remaining: PendingSyncItem[] = [];

    for (const item of queue) {
      item.status = "syncing";
      try {
        if (item.type === "product") {
          const res = await fetch(`${apiBaseUrl}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          });
          if (res.ok) {
            syncedCount++;
            continue; // Successfully synced, do not keep in queue
          } else {
            throw new Error(`Server returned ${res.status}`);
          }
        } else if (item.type === "inventory") {
          const res = await fetch(
            `${apiBaseUrl}/api/products/${item.payload.productId}/inventory?change=${item.payload.change}`,
            { method: "PATCH" }
          );
          if (res.ok) {
            syncedCount++;
            continue; // Successfully synced
          } else {
            throw new Error(`Server returned ${res.status}`);
          }
        }
      } catch (err: any) {
        failedCount++;
        item.status = "failed";
        item.retryCount += 1;
        item.error = err.message || "Network error";
        remaining.push(item);
      }
    }

    this.saveQueue(remaining);
    return { synced: syncedCount, failed: failedCount };
  }

  public subscribe(fn: (isOnline: boolean, pendingCount: number) => void): () => void {
    this.listeners.push(fn);
    fn(this.isOnline, this.getQueue().length);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notifyListeners();
    if (online) {
      // Auto-trigger sync after 1s reconnection delay
      setTimeout(() => {
        this.syncAll();
      }, 1000);
    }
  }

  private notifyListeners() {
    const count = this.getQueue().length;
    this.listeners.forEach((fn) => fn(this.isOnline, count));
  }
}

export const offlineSync = new OfflineSyncManager();
