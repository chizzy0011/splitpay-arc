"use client";

import { useWallet } from "@/lib/wallet";
import { useNetwork } from "@/lib/network";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected, wrongNetwork, hasWallet, connecting, connect, disconnect, switchNetwork } =
    useWallet();
  const { chain } = useNetwork();

  if (!hasWallet) {
    return (
      <a className="btn-primary" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
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
        className="btn bg-ochre-deep text-white hover:brightness-110"
        onClick={() => void switchNetwork()}
      >
        Switch to {chain.name}
      </button>
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
