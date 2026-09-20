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
    <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      {/* Header */}
      <header className="flex h-[72px] items-center justify-between gap-3">
        <a href="#" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-gold/50 font-display text-lg italic text-gold">
            S
          </span>
          <span className="font-mono text-sm tracking-wide text-cream">
            SplitPay<span className="text-gold"> Arc</span>
          </span>
        </a>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <NetworkBadge />
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="hairline" />

      {/* Hero */}
      <section className="animate-rise py-16 sm:py-24">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Native USDC · Arc
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-light leading-[1.04] tracking-tightest text-cream sm:text-6xl md:text-7xl">
          Payouts, split{" "}
          <span className="italic text-gold">to the cent.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Send one dollar to many wallets by percentage in a single
          transaction, or lock funds until a timer. Settled in native USDC on
          Arc.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a href="#tools" className="btn-primary">
            Open the tools
          </a>
          {isContractConfigured && (
            <a
              href={addressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              View contract
            </a>
          )}
        </div>

        {/* Contract line */}
        <div className="mt-8 flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
          <span className="text-muted/70">Contract</span>
          {isContractConfigured ? (
            <a
              href={addressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
            >
              {CONTRACT_ADDRESS}
            </a>
          ) : (
            <span className="rounded-[4px] bg-gold/10 px-2 py-0.5 text-gold-soft">
              set NEXT_PUBLIC_CONTRACT_ADDRESS after deploy
            </span>
          )}
        </div>
      </section>

      {/* Trust band — grouped by hairlines, not cards */}
      <section className="grid grid-cols-1 gap-px overflow-hidden rounded-[4px] border border-line bg-line sm:grid-cols-3">
        <Trait k="Atomic" v="Every recipient is paid in one block, or the whole transfer reverts." />
        <Trait k="Native dollars" v="USDC is the gas and the value. No wrapper, no bridge at settlement." />
        <Trait k="Non-custodial" v="No token, no pooled funds. The contract only routes and time-locks." />
      </section>

      {/* Tools */}
      <section id="tools" className="scroll-mt-8 pt-16">
        <h2 className="mb-1 font-display text-2xl text-cream">The instruments</h2>
        <p className="mb-6 text-sm text-muted">
          Recipients are prefilled with example wallets. Clear them and use your
          own.
        </p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SplitVault />
          <StreamLock />
        </div>
      </section>

      {/* Judge / self-test steps */}
      <section className="pt-16">
        <div className="hairline mb-10" />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Step
            n="1"
            t="Connect"
            body={
              <>
                Connect a wallet on Arc. Get free test USDC from{" "}
                <a
                  className="text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  faucet.circle.com
                </a>
                .
              </>
            }
          />
          <Step
            n="2"
            t="Configure"
            body="Pick a split preset or a lock duration. Percentages must total 100."
          />
          <Step
            n="3"
            t="Settle"
            body="Run it. Each action links straight to the transaction on Arc's explorer."
          />
        </div>
      </section>

      <footer className="mt-20 flex flex-col items-center gap-2 border-t border-line pt-8 text-center">
        <span className="font-mono text-[11px] tracking-wide text-muted">
          Built for Circle's Arc Microgrants
        </span>
        <span className="font-mono text-[11px] text-muted/60">
          native USDC settlement · zero token
        </span>
      </footer>
    </main>
  );
}

function Trait({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-canvas p-6">
      <div className="font-display text-lg text-gold">{k}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{v}</p>
    </div>
  );
}

function Step({
  n,
  t,
  body,
}: {
  n: string;
  t: string;
  body: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-3xl italic text-gold">{n}</span>
        <span className="font-mono text-sm uppercase tracking-[0.14em] text-cream">
          {t}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
