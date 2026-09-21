"use client";

import { useActivity } from "@/lib/activity";
import { txUrl } from "@/lib/contract";
import { shareColor } from "@/lib/palette";

const DOT: Record<string, number> = { split: 0, lock: 1, release: 2, refund: 5 };

function ago(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function ActivityFeed() {
  const { items } = useActivity();

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-muted">
          No activity yet. Run a split or lock a vault, and confirmed transactions
          show up here with their Arc explorer links.
        </p>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-line">
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-3 px-5 py-4">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: shareColor(DOT[it.kind] ?? 0) }}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{it.title}</p>
            <p className="truncate text-sm text-muted">{it.detail}</p>
          </div>
          <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5">
            <span className="font-mono text-[11px] text-muted">{ago(it.ts)}</span>
            {it.hash && (
              <a
                className="font-mono text-[11px] text-indigo hover:text-indigo-deep"
                href={txUrl(it.hash)}
                target="_blank"
                rel="noreferrer"
              >
                {it.hash.slice(0, 8)}… ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
