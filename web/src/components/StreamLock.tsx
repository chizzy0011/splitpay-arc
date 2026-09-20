"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, formatEther, isAddress, parseEther } from "viem";
import { useWallet } from "@/lib/wallet";
import { useTx } from "@/lib/useTx";
import { CONTRACT_ADDRESS, isContractConfigured, splitPayAbi } from "@/lib/contract";
import { TxStatus } from "./TxStatus";

type Vault = {
  id: bigint;
  recipient: string;
  amount: bigint; // native (18dp)
  releaseTime: number; // unix seconds
};

// Fresh, unswept EOA (not a public-key Anvil account — those get swept on live
// networks and would make releaseEscrow's payout revert). Users can replace it.
const DEFAULT_RECIPIENT = "0x5D2E9EdFF365945789f422Fdd97de4833b1d5973";

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
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [amount, setAmount] = useState("0.10");
  const [duration, setDuration] = useState(60); // seconds
  const [vaults, setVaults] = useState<Vault[]>([]);

  const { hash, receipt, isPending, isConfirming, isSuccess, error, write, reset } =
    useTx();

  // When createEscrow confirms, pull the escrowId + releaseTime from the event.
  useEffect(() => {
    if (!receipt) return;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: splitPayAbi,
          data: log.data,
          topics: log.topics,
        });
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
        }
      } catch {
        /* not one of our events */
      }
    }
  }, [receipt]);

  const validation = useMemo(() => {
    if (!isAddress(recipient.trim())) return "Enter a valid recipient address.";
    if (!amount || parseFloat(amount) <= 0) return "Enter an amount greater than 0.";
    if (duration < 1) return "Lock duration must be at least 1 second.";
    return null;
  }, [recipient, amount, duration]);

  function createEscrow() {
    if (validation) return;
    reset();
    void write({
      address: CONTRACT_ADDRESS,
      abi: splitPayAbi,
      functionName: "createEscrow",
      args: [recipient.trim() as `0x${string}`, BigInt(duration)],
      value: parseEther(amount),
    });
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-cream">StreamLock</h3>
          <p className="text-sm text-muted">
            Lock USDC for a recipient. Release after the timer, or cancel before it.
          </p>
        </div>
        <span className="chip text-usdc">createEscrow()</span>
      </div>

      <div className="mb-4">
        <label className="label">Recipient</label>
        <div className="relative">
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-cream"
              onClick={() => setRecipient("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount (USDC)</label>
          <input
            className="field"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.10"
          />
        </div>
        <div>
          <label className="label">Lock for</label>
          <div className="flex gap-1.5">
            {[60, 300, 3600].map((s) => (
              <button
                key={s}
                className={`chip flex-1 justify-center ${duration === s ? "border-arc text-arc" : ""}`}
                onClick={() => setDuration(s)}
              >
                {s < 3600 ? `${s / 60}m` : "1h"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>Duration</span>
          <span className="font-mono text-cream">{duration}s</span>
        </div>
        <input
          type="range"
          min={10}
          max={3600}
          step={10}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        className="btn-primary w-full"
        onClick={createEscrow}
        disabled={!isConnected || !isContractConfigured || !!validation || isPending || isConfirming}
      >
        {!isConnected
          ? "Connect wallet to run"
          : isPending || isConfirming
            ? "Locking…"
            : `Lock ${amount || "0"} USDC`}
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
        successLabel="Escrow locked"
      />

      {vaults.length > 0 && (
        <div className="mt-6">
          <label className="label">Your locked vaults (this session)</label>
          <div className="space-y-2">
            {vaults.map((v) => (
              <EscrowCard key={v.id.toString()} vault={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EscrowCard({ vault }: { vault: Vault }) {
  const now = useNow();
  const [done, setDone] = useState(false);
  const unlocked = now >= vault.releaseTime;
  const remaining = Math.max(0, vault.releaseTime - now);

  const { hash, isPending, isConfirming, isSuccess, error, write, reset } = useTx();

  useEffect(() => {
    if (isSuccess) setDone(true);
  }, [isSuccess]);

  function act(fn: "releaseEscrow" | "refundEscrow") {
    reset();
    void write({
      address: CONTRACT_ADDRESS,
      abi: splitPayAbi,
      functionName: fn,
      args: [vault.id],
    });
  }

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-mono text-muted">#{vault.id.toString()}</span>
        <span className="font-mono text-cream">{formatEther(vault.amount)} USDC</span>
        {done ? (
          <span className="chip text-executed">finalized</span>
        ) : unlocked ? (
          <span className="chip text-executed">unlocked</span>
        ) : (
          <span className="chip text-arc">{remaining}s left</span>
        )}
      </div>
      <div className="mt-1 truncate font-mono text-xs text-muted">→ {vault.recipient}</div>

      {!done && (
        <div className="mt-3 flex gap-2">
          <button
            className="btn-primary flex-1 py-2"
            disabled={!unlocked || isPending || isConfirming}
            onClick={() => act("releaseEscrow")}
          >
            {unlocked ? "Release" : "Locked"}
          </button>
          <button
            className="btn-danger flex-1 py-2"
            disabled={unlocked || isPending || isConfirming}
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
