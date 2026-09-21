"use client";

import { useWallet } from "@/lib/wallet";
import { activeChain, TARGET_NETWORK } from "@/lib/arc";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const {
    address,
    isConnected,
    wrongNetwork,
    hasWallet,
    connecting,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  if (!hasWallet) {
    return (
      <a
        className="btn-primary"
        href="https://metamask.io/download/"
        target="_blank"
        rel="noreferrer"
      >
        Install a Wallet
      </a>
    );
  }

  if (!isConnected) {
    return (
      <button className="btn-primary" disabled={connecting} onClick={() => void connect()}>
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 font-mono text-[11px] text-muted sm:inline-flex">
          Ethereum Mainnet
        </span>
        <button
          className="btn bg-ochre-deep text-white hover:brightness-110"
          onClick={() => void switchNetwork()}
        >
          Switch to {activeChain.name}
        </button>
      </div>
    );
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 font-mono text-xs text-ink transition hover:border-ink/25"
      onClick={disconnect}
      title="Disconnect"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green" />
      {address ? short(address) : "Disconnect"}
    </button>
  );
}

export function NetworkBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green/10 px-3 py-1.5 font-mono text-[11px] text-green">
      <span className="h-1.5 w-1.5 rounded-full bg-green" />
      {TARGET_NETWORK === "mainnet" ? "Arc Mainnet" : "Arc Testnet"}
    </span>
  );
}
