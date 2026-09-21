"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, formatEther, isAddress, parseEther } from "viem";
import { useWallet } from "@/lib/wallet";
import { useTx } from "@/lib/useTx";
import { useActivity } from "@/lib/activity";
import { shortAddr } from "@/lib/palette";
import { CONTRACT_ADDRESS, isContractConfigured, splitPayAbi } from "@/lib/contract";
import { TxStatus } from "./TxStatus";

type Vault = {
  id: bigint;
  recipient: string;
  amount: bigint;
  releaseTime: number;
};

const DEFAULT_RECIPIENT = "0x5D2E9EdFF365945789f422Fdd97de4833b1d5973";

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function humanUntil(target: number, now: number): string {
  const s = Math.max(0, target - now);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function StreamLock() {
  const { isConnected } = useWallet();
  const { add } = useActivity();
  const now = useNow();

  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [amount, setAmount] = useState("50");
  const [deadline, setDeadline] = useState(() => toLocalInput(new Date(Date.now() + 3600_000)));
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [pendingLock, setPendingLock] = useState<{ amount: string; until: number } | null>(null);

  const { hash, receipt, isPending, isConfirming, isSuccess, error, write, reset } = useTx();

  const targetSec = useMemo(() => {
    const ms = new Date(deadline).getTime();
    return Number.isFinite(ms) ? Math.floor(ms / 1000) : NaN;
  }, [deadline]);
  const durationSeconds = Number.isFinite(targetSec) ? targetSec - now : NaN;

  const validation = useMemo(() => {
    if (!isAddress(recipient.trim())) return "Enter a valid recipient address.";
    if (!(parseFloat(amount) > 0)) return "Enter an amount greater than 0.";
    if (!Number.isFinite(targetSec)) return "Pick a release date and time.";
    if (durationSeconds < 60) return "Pick a deadline at least a minute from now.";
    return null;
  }, [recipient, amount, targetSec, durationSeconds]);

  // When createEscrow confirms, read the escrowId + releaseTime from the event
  // and log the activity.
  useEffect(() => {
    if (!receipt || !isSuccess) return;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: splitPayAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "EscrowCreated") {
          const a = decoded.args as {
            escrowId: bigint;
            recipient: string;
            amount: bigint;
            releaseTime: bigint;
          };
          setVaults((v) =>
            v.some((x) => x.id === a.escrowId)
              ? v
              : [
                  {
                    id: a.escrowId,
                    recipient: a.recipient,
                    amount: a.amount,
                    releaseTime: Number(a.releaseTime),
                  },
                  ...v,
                ],
          );
          if (pendingLock) {
            add({
              kind: "lock",
              title: "Vault locked",
              detail: `$${fmt(pendingLock.amount)} until ${new Date(pendingLock.until * 1000).toLocaleString()}`,
              hash: hash,
            });
            setPendingLock(null);
          }
        }
      } catch {
        /* not our event */
      }
    }
  }, [receipt, isSuccess, hash, pendingLock, add]);

  function createEscrow() {
    if (validation) return;
    reset();
    setPendingLock({ amount, until: targetSec });
    void write({
      address: CONTRACT_ADDRESS,
      abi: splitPayAbi,
      functionName: "createEscrow",
      args: [recipient.trim() as `0x${string}`, BigInt(Math.floor(durationSeconds))],
      value: parseEther(amount),
    });
  }

  const busy = isPending || isConfirming;

  return (
    <div className="card p-5 sm:p-6" id="stream">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-ink">Stream</h3>
          <p className="text-sm text-muted">
            Lock USDC for a recipient until a deadline. Release after, or cancel before.
          </p>
        </div>
        <span className="chip font-mono text-indigo">createEscrow()</span>
      </div>

      <label className="label">Recipient</label>
      <div className="relative mb-4">
        <input
          className="field pr-8"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x recipient address"
          spellCheck={false}
        />
        {recipient && (
          <button
            aria-label="Clear address"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            onClick={() => setRecipient("")}
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted">
              $
            </span>
            <input
              className="field pl-7"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
            />
          </div>
        </div>
        <div>
          <label className="label">Release on</label>
          <input
            type="datetime-local"
            className="field"
            value={deadline}
            min={toLocalInput(new Date())}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      {/* Quick deadline helpers */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted">Quick set</span>
        {[
          { l: "+1 hour", ms: 3600_000 },
          { l: "+1 day", ms: 86400_000 },
          { l: "+1 week", ms: 604800_000 },
        ].map((q) => (
          <button
            key={q.l}
            className="chip transition hover:border-indigo/40 hover:text-indigo"
            onClick={() => setDeadline(toLocalInput(new Date(Date.now() + q.ms)))}
          >
            {q.l}
          </button>
        ))}
        {Number.isFinite(durationSeconds) && durationSeconds >= 60 && (
          <span className="ml-auto font-mono text-xs text-muted">
            locks ~{humanUntil(targetSec, now)}
          </span>
        )}
      </div>

      <button
        className="btn-primary w-full"
        onClick={createEscrow}
        disabled={!isConnected || !isContractConfigured || !!validation || busy}
      >
        {!isConnected ? "Connect wallet to continue" : busy ? "Locking…" : `Lock $${fmt(amount)}`}
      </button>

      {validation && isConnected && <p className="mt-2 text-xs text-ochre-deep">{validation}</p>}

      <TxStatus
        hash={hash}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={error}
        successLabel="Vault locked"
        onRetry={createEscrow}
      />

      <div className="mt-6">
        <label className="label">Locked vaults</label>
        {vaults.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line bg-inset/50 px-3 py-6 text-center text-sm text-muted">
            No active vaults yet. Lock one above to see it here.
          </p>
        ) : (
          <div className="space-y-2">
            {vaults.map((v) => (
              <EscrowCard key={v.id.toString()} vault={v} now={now} onDone={add} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EscrowCard({
  vault,
  now,
  onDone,
}: {
  vault: Vault;
  now: number;
  onDone: ReturnType<typeof useActivity>["add"];
}) {
  const [done, setDone] = useState(false);
  const unlocked = now >= vault.releaseTime;
  const remaining = Math.max(0, vault.releaseTime - now);
  const { hash, isPending, isConfirming, isSuccess, error, write, reset } = useTx();
  const [action, setAction] = useState<"release" | "refund" | null>(null);

  useEffect(() => {
    if (isSuccess && !done) {
      setDone(true);
      onDone({
        kind: action === "refund" ? "refund" : "release",
        title: action === "refund" ? "Vault refunded" : "Vault released",
        detail: `$${formatEther(vault.amount)} · vault #${vault.id.toString()}`,
        hash,
      });
    }
  }, [isSuccess, done, action, hash, vault, onDone]);

  function act(fn: "releaseEscrow" | "refundEscrow") {
    reset();
    setAction(fn === "releaseEscrow" ? "release" : "refund");
    void write({
      address: CONTRACT_ADDRESS,
      abi: splitPayAbi,
      functionName: fn,
      args: [vault.id],
    });
  }

  const busy = isPending || isConfirming;

  return (
    <div className="rounded-lg border border-line bg-inset/60 p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-mono text-muted">#{vault.id.toString()}</span>
        <span className="font-mono font-medium text-ink">{formatEther(vault.amount)} USDC</span>
        {done ? (
          <span className="rounded-full bg-green/10 px-2 py-0.5 font-mono text-[11px] text-green">
            finalized
          </span>
        ) : unlocked ? (
          <span className="rounded-full bg-green/10 px-2 py-0.5 font-mono text-[11px] text-green">
            unlocked
          </span>
        ) : (
          <span className="rounded-full bg-indigo/10 px-2 py-0.5 font-mono text-[11px] text-indigo">
            {remaining}s left
          </span>
        )}
      </div>
      <div className="mt-1 truncate font-mono text-xs text-muted">→ {shortAddr(vault.recipient)}</div>

      {!done && (
        <div className="mt-3 flex gap-2">
          <button
            className="btn-primary flex-1 py-2"
            disabled={!unlocked || busy}
            onClick={() => act("releaseEscrow")}
          >
            {unlocked ? "Release" : "Locked"}
          </button>
          <button
            className="btn-danger flex-1 py-2"
            disabled={unlocked || busy}
            onClick={() => act("refundEscrow")}
          >
            Refund
          </button>
        </div>
      )}

      <TxStatus
        hash={hash}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={error}
        successLabel="Done"
      />
    </div>
  );
}

function fmt(v: string) {
  const n = parseFloat(v) || 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
