"use client";

import * as React from "react";

import { recallApi, type Health } from "@/lib/api/recall-api";

export interface RecallHealthState {
  health: Health | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetches backend health on mount, every `pollMs` while the tab is visible,
 * and whenever the tab becomes visible again. Exposes `refresh` for manual retries.
 */
export function useRecallHealth(pollMs = 15000): RecallHealthState {
  const [health, setHealth] = React.useState<Health | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const next = await recallApi.health();
      setHealth(next);
      setError(null);
    } catch (err) {
      setHealth(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error while contacting the backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      if (!cancelled) void refresh();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    void refresh();
    const interval = setInterval(tick, pollMs);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollMs, refresh]);

  return { health, loading, error, refresh };
}
