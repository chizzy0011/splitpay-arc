"use client";

import { txUrl } from "@/lib/contract";

type Props = {
  hash?: `0x${string}`;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error?: Error | null;
  successLabel?: string;
  onRetry?: () => void;
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
  onRetry,
}: Props) {
  if (error) {
    return (
      <div className="mt-3 rounded-lg border border-red/25 bg-red/5 px-3 py-3 text-sm text-red">
        <p>{cleanError(error)}</p>
        {onRetry && (
          <button
            className="mt-2 rounded-md border border-red/30 bg-card px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/5"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isPending) {
    return (
      <Line>
        <Dot />
        Confirm in your wallet…
      </Line>
    );
  }

  if (isConfirming) {
    return (
      <Line>
        <Spinner />
        Broadcasting, waiting for finality…
        {hash && <span className="ml-1 font-mono text-xs text-muted">{hash.slice(0, 10)}…</span>}
      </Line>
    );
  }

  if (isSuccess && hash) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-green/25 bg-green/10 px-3 py-2.5 text-sm text-green">
        <span aria-hidden>✓</span>
        <span className="font-medium">{successLabel}</span>
        <a
          className="ml-auto font-mono text-xs underline decoration-green/40 underline-offset-2 hover:decoration-green"
          href={txUrl(hash)}
          target="_blank"
          rel="noreferrer"
        >
          View on Arc Explorer ↗
        </a>
      </div>
    );
  }

  return null;
}

function Line({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-center gap-2 rounded-lg border border-indigo/20 bg-indigo/5 px-3 py-2.5 text-sm text-indigo-deep">
      {children}
    </p>
  );
}

function Dot() {
  return <span className="h-2 w-2 animate-pulse rounded-full bg-indigo" />;
}

function Spinner() {
  return (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo/30 border-t-indigo" />
  );
}
