import { shareColor } from "@/lib/palette";

const ROWS = [
  { seed: "7F", addr: "0x7Fa9…3D21", amount: "$700.00", pct: 70 },
  { seed: "4C", addr: "0x4C1e…9B08", amount: "$200.00", pct: 20 },
  { seed: "9c", addr: "0x9c4E…21Ab", amount: "$100.00", pct: 10 },
];

/** Static illustrative split, anchoring the hero. Not wired to the chain. */
export function HeroPreview() {
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
          Live preview
        </span>
        <span className="font-display text-lg italic text-ink">Split preview</span>
      </div>

      <div className="mb-6 flex h-2.5 w-full overflow-hidden rounded-full bg-inset">
        {ROWS.map((r, i) => (
          <div key={i} style={{ width: `${r.pct}%`, background: shareColor(i) }} />
        ))}
      </div>

      <div className="space-y-4">
        {ROWS.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-white"
              style={{ background: shareColor(i) }}
            >
              {r.seed}
            </span>
            <span className="font-mono text-sm text-ink">{r.addr}</span>
            <span className="ml-auto font-mono text-sm text-muted">{r.amount}</span>
            <span className="w-10 text-right font-mono text-sm font-semibold text-ink">{r.pct}%</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm text-muted">Total</span>
        <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-ink">
          100.00% <span className="text-green">✓</span>
        </span>
      </div>
    </div>
  );
}
