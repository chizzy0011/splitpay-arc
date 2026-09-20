"use client";

import { txUrl } from "@/lib/contract";

type Props = {
  hash?: `0x${string}`;
  isPending: boolean; // wallet signing / submitting
  isConfirming: boolean; // waiting for receipt
  isSuccess: boolean;
  error?: Error | null;
  successLabel?: string;
};

function cleanError(error: Error): string {
  const msg = (error as { shortMessage?: string }).shortMessage ?? error.message;
  if (/user rejected|denied/i.test(msg)) return "Transaction rejected in wallet.";
  return msg.length > 160 ? msg.slice(0, 160) + "…" : msg;
}

export function TxStatus({
  hash,
  isPending,
  isConfirming,
  isSuccess,
  error,
  successLabel = "Confirmed on Arc",
}: Props) {
  if (error) {
    return (
      <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {cleanError(error)}
      </p>
    );
  }

  if (isPending) {
    return <StatusLine tone="wait">Confirm in your wallet…</StatusLine>;
  }

  if (isConfirming) {
    return <StatusLine tone="wait">Broadcasting, waiting for finality…</StatusLine>;
  }

  if (isSuccess && hash) {
    return (
      <div className="mt-3 rounded-lg border border-executed/30 bg-executed/10 px-3 py-2 text-sm text-executed">
        {successLabel} ·{" "}
        <a
          className="underline underline-offset-2 hover:opacity-80"
          href={txUrl(hash)}
          target="_blank"
          rel="noreferrer"
        >
          view transaction ↗
        </a>
      </div>
    );
  }

  return null;
}

function StatusLine({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "wait";
}) {
  return (
    <p className="mt-3 flex items-center gap-2 rounded-lg border border-arc/30 bg-arc/10 px-3 py-2 text-sm text-arc">
      <span className="h-2 w-2 animate-pulse rounded-full bg-arc" />
      {children}
    </p>
  );
}
