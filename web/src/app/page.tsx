"use client";

import { useState } from "react";
import { ConnectButton } from "@/components/ConnectButton";
import { NetworkToggle } from "@/components/NetworkToggle";
import { SplitVault } from "@/components/SplitVault";
import { StreamLock } from "@/components/StreamLock";
import { HeroPreview } from "@/components/HeroPreview";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Toast } from "@/components/Toast";
import { Mark } from "@/components/Logo";
import { useNetwork } from "@/lib/network";
import { NETWORKS, NETWORK_ORDER } from "@/lib/chains";
import { shortAddr } from "@/lib/palette";

const NAV = [
  { label: "Split", href: "#split" },
  { label: "Stream", href: "#stream" },
  { label: "Activity", href: "#activity" },
  { label: "How it works", href: "#how" },
];

export default function Home() {
  const { isLive, label, symbol, faucet } = useNetwork();

  return (
    <>
      {/* Network banner — very visible, changes with the toggle */}
      {isLive ? (
        <div className="bg-red px-4 py-2 text-center text-[13px] font-semibold text-white">
          You are on {label}. Transactions move REAL {symbol} and cannot be undone.
        </div>
      ) : (
        <div className="bg-ink px-4 py-2 text-center text-[13px] text-paper/90">
          You are on <span className="font-semibold text-paper">{label}</span>. Transactions use free test {symbol}. Switch to a live network only to move real money.
        </div>
      )}

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#" className="flex items-center gap-2.5">
            <Mark className="h-7 w-7" />
            <span className="font-display text-xl text-ink">SplitPay</span>
            <span className="rounded-md bg-indigo/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-indigo">
              ARC
            </span>
          </a>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="font-mono text-sm text-muted transition hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NetworkToggle />
            <ConnectButton />
          </div>
        </div>
        <nav className="flex items-center gap-5 overflow-x-auto border-t border-line px-5 py-2.5 md:hidden">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="whitespace-nowrap font-mono text-sm text-muted">
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Hero */}
        <section className="hero-grid grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-green">
              {label} · {isLive ? "Live" : "Testnet"}
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-tightest text-ink sm:text-6xl">
              Split it exactly.
              <br />
              Lock it precisely.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Settle one {symbol} payment across many wallets, or lock it for someone
              until a deadline. No wrapped tokens, no custody.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#tools" className="btn-primary">
                Try it in 60 seconds
              </a>
              <ViewContractLink />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">Contract</span>
              <ContractChip />
            </div>
          </div>

          <div className="animate-rise lg:pl-6">
            <HeroPreview />
          </div>
        </section>

        {/* Tools */}
        <section id="tools" className="scroll-mt-24 pt-8">
          <h2 className="font-display text-3xl text-ink">Try it in 60 seconds</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Recipients are prefilled with example wallets. Clear them and use your
            own before you run anything.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <SplitVault />
            <StreamLock />
          </div>
        </section>

        {/* Activity */}
        <section id="activity" className="scroll-mt-24 pt-16">
          <h2 className="font-display text-3xl text-ink">Activity</h2>
          <p className="mt-1 mb-6 text-sm text-muted">
            Every confirmed transaction from this session, with its explorer link.
          </p>
          <ActivityFeed />
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 py-16">
          <h2 className="font-display text-3xl text-ink">How it works</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Step n="1" t="Connect" body={faucet ? <>Connect a wallet on {label}, and grab free test {symbol} from <A href={faucet}>{faucet.replace("https://", "")}</A>.</> : <>Connect a wallet on {label}. You need a little {symbol} to settle and to pay gas.</>} />
            <Step n="2" t="Configure" body="Split by percentage or exact dollar amounts, or pick a release date and time for a locked vault." />
            <Step n="3" t="Settle" body={`Run it. ${symbol} moves in a single transaction, and every action links to the transaction on ${label}.`} />
          </div>
        </section>

        <footer className="flex flex-col items-center gap-2 border-t border-line py-10 text-center">
          <span className="font-mono text-[11px] tracking-wide text-muted">Networks: {NETWORK_ORDER.map((id) => NETWORKS[id].label).join(" · ")}</span>
          <span className="font-mono text-[11px] text-muted/70">Native {symbol} settlement. Non-custodial. Zero token.</span>
        </footer>
      </main>

      <Toast />
    </>
  );
}

function ViewContractLink() {
  const { contract, isContractConfigured, addressUrl } = useNetwork();
  if (!isContractConfigured) return null;
  return (
    <a href={addressUrl(contract)} target="_blank" rel="noreferrer" className="btn-ghost">
      View contract ↗
    </a>
  );
}

function ContractChip() {
  const { contract, isContractConfigured, addressUrl, isLive } = useNetwork();
  const [copied, setCopied] = useState(false);
  if (!isContractConfigured) {
    return <span className="rounded-md bg-ochre-deep/10 px-2 py-1 font-mono text-xs text-ochre-deep">not configured</span>;
  }
  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 font-mono text-xs text-ink transition hover:border-ink/25"
        onClick={() => {
          navigator.clipboard?.writeText(contract);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
        title="Copy address"
      >
        {shortAddr(contract)}
        <span className="text-muted">{copied ? "copied" : "⧉"}</span>
      </button>
      <a href={addressUrl(contract)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-mono text-xs text-green">
        <span aria-hidden>✓</span> {isLive ? "Live on mainnet" : "Live on testnet"}
      </a>
    </>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="text-indigo underline decoration-indigo/30 underline-offset-2 hover:decoration-indigo" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function Step({ n, t, body }: { n: string; t: string; body: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-3xl text-indigo">{n}</span>
        <span className="font-mono text-sm uppercase tracking-[0.12em] text-ink">{t}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
