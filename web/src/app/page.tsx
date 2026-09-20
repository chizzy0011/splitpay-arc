"use client";

import { ConnectButton, NetworkBadge } from "@/components/ConnectButton";
import { SplitVault } from "@/components/SplitVault";
import { StreamLock } from "@/components/StreamLock";
import {
  CONTRACT_ADDRESS,
  isContractConfigured,
  addressUrl,
} from "@/lib/contract";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-usdc font-mono text-sm font-bold text-white">
            $/
          </div>
          <div>
            <h1 className="font-mono text-base font-semibold tracking-tight">
              SplitPay<span className="text-arc"> Arc</span>
            </h1>
            <p className="text-xs text-muted">Native USDC settlement engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NetworkBadge />
          <ConnectButton />
        </div>
      </header>

      {/* Hero */}
      <section className="py-10 sm:py-14">
        <h2 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
          Atomic USDC payouts and time-locked vaults,{" "}
          <span className="text-arc">settled on Arc</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Split one USDC payment across many wallets by percentage in a single
          transaction, or lock funds for a recipient until a timer expires.
          No tokens, no custody — just Arc&apos;s native dollar as gas and value.
        </p>

        {/* Judge / self-test instructions */}
        <div className="mt-6 grid gap-2 rounded-xl border border-line bg-surface/60 p-4 text-sm sm:grid-cols-3">
          <Step n="1" t="Connect">
            Connect an EVM wallet on {" "}
            <span className="text-slate-200">Arc</span>. Get free test USDC from{" "}
            <a
              className="text-arc underline underline-offset-2"
              href="https://faucet.circle.com"
              target="_blank"
              rel="noreferrer"
            >
              faucet.circle.com
            </a>
            .
          </Step>
          <Step n="2" t="Try a preset">
            The recipient fields are prefilled with example addresses — clear them
            and paste your own to test.
          </Step>
          <Step n="3" t="Execute">
            Run a split or lock a vault. Every action links to the on-chain
            transaction on Arc&apos;s explorer.
          </Step>
        </div>

        {/* Contract line */}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-muted">Contract:</span>
          {isContractConfigured ? (
            <a
              className="text-arc underline underline-offset-2"
              href={addressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
            >
              {CONTRACT_ADDRESS}
            </a>
          ) : (
            <span className="rounded bg-amber-500/15 px-2 py-0.5 text-amber-400">
              set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local after deploy
            </span>
          )}
        </div>
      </section>

      {/* Modules */}
      <section className="grid gap-5 lg:grid-cols-2">
        <SplitVault />
        <StreamLock />
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-center text-xs text-muted">
        Built for Circle&apos;s Arc Microgrants · native-USDC settlement · zero-token
      </footer>
    </main>
  );
}

function Step({
  n,
  t,
  children,
}: {
  n: string;
  t: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-surface-2/60 p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-arc/20 font-mono text-[11px] text-arc">
          {n}
        </span>
        <span className="text-sm font-medium text-slate-200">{t}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{children}</p>
    </div>
  );
}
