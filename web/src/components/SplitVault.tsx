"use client";

import { useMemo, useState } from "react";
import { isAddress, parseEther } from "viem";
import { useWallet } from "@/lib/wallet";
import { useTx } from "@/lib/useTx";
import { CONTRACT_ADDRESS, isContractConfigured, splitPayAbi } from "@/lib/contract";
import { TxStatus } from "./TxStatus";

type Row = { address: string; percent: string };

// Prefilled example recipients (well-known Anvil test accounts). Judges/users
// can clear these and paste their own wallets before executing.
const PRESETS: Record<string, Row[]> = {
  "50 / 50": [
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", percent: "50" },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", percent: "50" },
  ],
  "70 / 20 / 10": [
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", percent: "70" },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", percent: "20" },
    { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", percent: "10" },
  ],
};

export function SplitVault() {
  const { isConnected } = useWallet();
  const [rows, setRows] = useState<Row[]>(PRESETS["50 / 50"]);
  const [amount, setAmount] = useState("0.10");

  const { hash, isPending, isConfirming, isSuccess, error, write, reset } = useTx();

  const percentTotal = rows.reduce(
    (sum, r) => sum + (parseFloat(r.percent) || 0),
    0,
  );

  const validation = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return "Enter an amount greater than 0.";
    for (const r of rows) {
      if (!r.address.trim()) return "Fill in every recipient address (or remove the row).";
      if (!isAddress(r.address.trim())) return `Not a valid address: ${r.address.slice(0, 10)}…`;
      if (!(parseFloat(r.percent) > 0)) return "Every share must be greater than 0%.";
    }
    if (Math.abs(percentTotal - 100) > 0.001) return `Shares must total 100% (currently ${percentTotal}%).`;
    return null;
  }, [rows, amount, percentTotal]);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { address: "", percent: "" }]);
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));
  }

  function submit() {
    if (validation) return;
    reset();

    // percent -> basis points; force the total to exactly 10000 by giving any
    // rounding remainder to the last recipient (mirrors the contract's dust rule).
    const bps = rows.map((r) => Math.round(parseFloat(r.percent) * 100));
    const diff = 10000 - bps.reduce((a, b) => a + b, 0);
    bps[bps.length - 1] += diff;

    void write({
      address: CONTRACT_ADDRESS,
      abi: splitPayAbi,
      functionName: "executeSplit",
      args: [rows.map((r) => r.address.trim() as `0x${string}`), bps.map((b) => BigInt(b))],
      value: parseEther(amount),
    });
  }

  const totalOk = Math.abs(percentTotal - 100) < 0.001;

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">SplitVault</h3>
          <p className="text-sm text-muted">
            Send USDC to many wallets by percentage — one atomic transaction.
          </p>
        </div>
        <span className="chip text-usdc">executeSplit()</span>
      </div>

      {/* Presets */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="self-center text-xs uppercase tracking-wider text-muted">Preset:</span>
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            className="chip hover:border-arc"
            onClick={() => setRows(PRESETS[name].map((r) => ({ ...r })))}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="mb-4">
        <label className="label">Total amount to split (USDC)</label>
        <input
          className="field"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.10"
        />
      </div>

      {/* Recipients */}
      <label className="label">Recipients</label>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                className="field pr-8"
                value={row.address}
                onChange={(e) => updateRow(i, { address: e.target.value })}
                placeholder="0x recipient address"
                spellCheck={false}
              />
              {row.address && (
                <button
                  aria-label="Clear address"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-slate-200"
                  onClick={() => updateRow(i, { address: "" })}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="relative w-24">
              <input
                className="field pr-6 text-right"
                inputMode="decimal"
                value={row.percent}
                onChange={(e) => updateRow(i, { percent: e.target.value })}
                placeholder="0"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">%</span>
            </div>
            <button
              aria-label="Remove recipient"
              className="btn-ghost px-2.5 py-2"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
            >
              −
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button className="btn-ghost" onClick={addRow}>
          + Add recipient
        </button>
        <span className={`font-mono text-sm ${totalOk ? "text-executed" : "text-amber-400"}`}>
          Total: {percentTotal}%
        </span>
      </div>

      <button
        className="btn-primary mt-5 w-full"
        onClick={submit}
        disabled={!isConnected || !isContractConfigured || !!validation || isPending || isConfirming}
      >
        {!isConnected
          ? "Connect wallet to run"
          : isPending || isConfirming
            ? "Splitting…"
            : `Split ${amount || "0"} USDC`}
      </button>

      {validation && isConnected && (
        <p className="mt-2 text-xs text-amber-400">{validation}</p>
      )}

      <TxStatus
        hash={hash}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={error}
        successLabel="Split executed"
      />
    </div>
  );
}
