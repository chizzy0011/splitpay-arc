"use client";

import { useEffect, useMemo, useState } from "react";
import { isAddress, parseEther } from "viem";
import { useWallet } from "@/lib/wallet";
import { useTx } from "@/lib/useTx";
import { useActivity } from "@/lib/activity";
import { shareColor, avatarSeed } from "@/lib/palette";
import { splitPayAbi } from "@/lib/contract";
import { useNetwork } from "@/lib/network";
import { TxStatus } from "./TxStatus";

type Mode = "pct" | "amt";
type Row = { address: string; val: string }; // val = percent (pct mode) or dollars (amt mode)

// Percentage templates. Applying one switches to % mode.
const PRESETS: Record<string, Row[]> = {
  "50 / 50": [
    { address: "0x5D2E9EdFF365945789f422Fdd97de4833b1d5973", val: "50" },
    { address: "0xBb9eE01D0dfb30be3C2A6D8cdf55Af66C5445523", val: "50" },
  ],
  "70 / 20 / 10": [
    { address: "0x5D2E9EdFF365945789f422Fdd97de4833b1d5973", val: "70" },
    { address: "0xBb9eE01D0dfb30be3C2A6D8cdf55Af66C5445523", val: "20" },
    { address: "0xf45ddf367AD1749ff503993bcBEDFf6EAA3B22C1", val: "10" },
  ],
};

export function SplitVault() {
  const { isConnected } = useWallet();
  const { add } = useActivity();
  const { contract, isContractConfigured } = useNetwork();
  const [mode, setMode] = useState<Mode>("pct");
  const [rows, setRows] = useState<Row[]>(PRESETS["70 / 20 / 10"].map((r) => ({ ...r })));
  const [total, setTotal] = useState("100"); // editable only in % mode
  const [lastSubmitted, setLastSubmitted] = useState<{ total: number; count: number } | null>(null);

  const { hash, isPending, isConfirming, isSuccess, error, write, reset } = useTx();

  const nums = rows.map((r) => parseFloat(r.val) || 0);
  const sumVals = nums.reduce((a, b) => a + b, 0);
  const pctTotal = mode === "pct" ? sumVals : 100;
  const pctOk = Math.abs(pctTotal - 100) < 0.001;
  const grandTotal = mode === "amt" ? sumVals : parseFloat(total) || 0;

  // Proportional widths for the split bar in either mode.
  const widths = nums.map((n) =>
    mode === "pct" ? n : sumVals > 0 ? (n / sumVals) * 100 : 0,
  );

  const validation = useMemo(() => {
    for (const r of rows) {
      if (!r.address.trim()) return "Fill in every recipient address, or remove the row.";
      if (!isAddress(r.address.trim())) return `Not a valid address: ${r.address.slice(0, 10)}…`;
      if (!(parseFloat(r.val) > 0)) return mode === "pct" ? "Every share must be greater than 0%." : "Every amount must be greater than $0.";
    }
    if (mode === "pct") {
      if (!(grandTotal > 0)) return "Enter a total amount greater than 0.";
      if (!pctOk) return `Shares must total 100%, currently ${round(pctTotal)}%.`;
    }
    return null;
  }, [rows, mode, grandTotal, pctOk, pctTotal]);

  useEffect(() => {
    if (isSuccess && lastSubmitted && hash) {
      const snap = lastSubmitted;
      setLastSubmitted(null);
      add({
        kind: "split",
        title: "Split confirmed",
        detail: `$${fmt(snap.total)} across ${snap.count} recipients`,
        hash,
      });
    }
  }, [isSuccess, hash, lastSubmitted, add]);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { address: "", val: "" }]);
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));
  }

  function applyPreset(name: string) {
    setMode("pct");
    setRows(PRESETS[name].map((r) => ({ ...r })));
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    if (next === "amt") {
      // percent -> dollars, using the current total
      const t = parseFloat(total) || 0;
      setRows((rs) => rs.map((r) => ({ ...r, val: clean((t * (parseFloat(r.val) || 0)) / 100) })));
    } else {
      // dollars -> percent, using the summed total
      const s = sumVals;
      setTotal(clean(s));
      setRows((rs) => rs.map((r) => ({ ...r, val: s > 0 ? clean(((parseFloat(r.val) || 0) / s) * 100) : "0" })));
    }
    setMode(next);
  }

  function submit() {
    if (validation) return;
    reset();
    const recipients = rows.map((r) => r.address.trim() as `0x${string}`);

    if (mode === "amt") {
      const amounts = rows.map((r) => parseEther(r.val));
      const value = amounts.reduce((a, b) => a + b, 0n);
      setLastSubmitted({ total: sumVals, count: rows.length });
      void write({
        address: contract,
        abi: splitPayAbi,
        functionName: "executeSplitAmounts",
        args: [recipients, amounts],
        value,
      });
    } else {
      const bps = rows.map((r) => Math.round(parseFloat(r.val) * 100));
      bps[bps.length - 1] += 10000 - bps.reduce((a, b) => a + b, 0);
      setLastSubmitted({ total: grandTotal, count: rows.length });
      void write({
        address: contract,
        abi: splitPayAbi,
        functionName: "executeSplit",
        args: [recipients, bps.map((b) => BigInt(b))],
        value: parseEther(total),
      });
    }
  }

  const busy = isPending || isConfirming;

  return (
    <div className="card p-5 sm:p-6" id="split">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-ink">Split</h3>
          <p className="text-sm text-muted">
            Send USDC to many wallets, by percentage or exact amount, in one transaction.
          </p>
        </div>
        <span className="chip font-mono text-indigo">
          {mode === "amt" ? "executeSplitAmounts()" : "executeSplit()"}
        </span>
      </div>

      {/* Total + mode toggle */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="flex-1">
          <label className="label">{mode === "amt" ? "Total (auto)" : "Total to split"}</label>
          {mode === "pct" ? (
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted">$</span>
              <input
                className="field pl-7"
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="100"
              />
            </div>
          ) : (
            <div className="flex h-[42px] items-center rounded-lg border border-line bg-inset px-3 font-mono text-sm text-ink">
              ${fmt(sumVals)}
            </div>
          )}
        </div>
        <div className="flex rounded-full border border-line bg-inset p-0.5">
          {(["pct", "amt"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`rounded-full px-3 py-1.5 font-mono text-sm transition ${
                mode === m ? "bg-indigo text-white" : "text-muted hover:text-ink"
              }`}
            >
              {m === "pct" ? "%" : "$"}
            </button>
          ))}
        </div>
      </div>

      {/* Split bar */}
      <div className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full bg-inset">
        {widths.map((w, i) => (
          <div key={i} style={{ width: `${w}%`, background: shareColor(i) }} className="h-full transition-all" />
        ))}
      </div>

      {/* Presets */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted">Preset</span>
        {Object.keys(PRESETS).map((name) => (
          <button key={name} className="chip transition hover:border-indigo/40 hover:text-indigo" onClick={() => applyPreset(name)}>
            {name}
          </button>
        ))}
      </div>

      {/* Recipients */}
      <label className="label">Recipients</label>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const valid = isAddress(row.address.trim());
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-white"
                style={{ background: shareColor(i) }}
              >
                {valid ? avatarSeed(row.address.trim()) : i + 1}
              </span>
              <div className="relative flex-1">
                <input
                  className="field pr-8"
                  value={row.address}
                  onChange={(e) => updateRow(i, { address: e.target.value })}
                  placeholder="0x recipient address"
                  spellCheck={false}
                />
                {row.address && (
                  <button aria-label="Clear address" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink" onClick={() => updateRow(i, { address: "" })}>
                    ✕
                  </button>
                )}
              </div>
              <div className={`relative ${mode === "amt" ? "w-28" : "w-20"}`}>
                {mode === "amt" && (
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
                )}
                <input
                  className={`field text-right ${mode === "amt" ? "pl-6" : "pr-6"}`}
                  inputMode="decimal"
                  value={row.val}
                  onChange={(e) => updateRow(i, { val: e.target.value })}
                  placeholder="0"
                />
                {mode === "pct" && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">%</span>
                )}
              </div>
              <button aria-label="Remove recipient" className="btn-ghost px-2.5 py-2" onClick={() => removeRow(i)} disabled={rows.length <= 1}>
                −
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button className="text-sm font-medium text-indigo hover:text-indigo-deep" onClick={addRow}>
          + Add recipient
        </button>
        {mode === "pct" ? (
          <span className={`font-mono text-sm ${pctOk ? "text-green" : "text-ochre-deep"}`}>
            Total {round(pctTotal)}% {pctOk && "✓"}
          </span>
        ) : (
          <span className="font-mono text-sm text-green">Total ${fmt(sumVals)}</span>
        )}
      </div>

      <button
        className="btn-primary mt-5 w-full"
        onClick={submit}
        disabled={!isConnected || !isContractConfigured || !!validation || busy}
      >
        {!isConnected ? "Connect wallet to continue" : busy ? "Splitting…" : `Split $${fmt(grandTotal)}`}
      </button>

      {validation && isConnected && <p className="mt-2 text-xs text-ochre-deep">{validation}</p>}

      <TxStatus
        hash={hash}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={error}
        successLabel="Split confirmed"
        onRetry={submit}
      />
    </div>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
function clean(n: number) {
  return (Math.round(n * 1e6) / 1e6).toString();
}
function fmt(v: number | string) {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
