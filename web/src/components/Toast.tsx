"use client";

import { useActivity } from "@/lib/activity";
import { txUrl } from "@/lib/contract";

export function Toast() {
  const { toast, dismissToast } = useActivity();
  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] animate-toast-in">
      <div className="card flex items-start gap-3 p-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green/15 text-sm text-green">
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{toast.title}</p>
          <p className="truncate text-sm text-muted">{toast.detail}</p>
          {toast.hash && (
            <a
              className="mt-1 inline-block font-mono text-xs text-indigo hover:text-indigo-deep"
              href={txUrl(toast.hash)}
              target="_blank"
              rel="noreferrer"
            >
              {toast.hash.slice(0, 10)}… ↗
            </a>
          )}
        </div>
        <button
          aria-label="Dismiss"
          className="text-muted hover:text-ink"
          onClick={dismissToast}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
