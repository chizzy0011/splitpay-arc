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
      <button
        className="btn bg-amber-500 text-black hover:bg-amber-400"
        onClick={() => void switchNetwork()}
      >
        Switch to {activeChain.name}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="chip text-executed">
        <span className="h-1.5 w-1.5 rounded-full bg-executed" />
        {activeChain.name}
      </span>
      <button className="btn-ghost" onClick={disconnect}>
        {address ? short(address) : "Disconnect"}
      </button>
    </div>
  );
}

export function NetworkBadge() {
  return (
    <span className="chip text-arc">
      {TARGET_NETWORK === "mainnet" ? "Arc Mainnet · 5042" : "Arc Testnet · 5042002"}
    </span>
  );
}
