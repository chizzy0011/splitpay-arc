"use client";

import { useNetwork } from "@/lib/network";
import { useWallet } from "@/lib/wallet";
import { NETWORKS, type NetworkId } from "@/lib/arc";

export function NetworkToggle() {
  const { network, setNetwork } = useNetwork();
  const { isConnected, switchToChain } = useWallet();

  function pick(id: NetworkId) {
    if (id === network) return;
    setNetwork(id);
    if (isConnected) void switchToChain(NETWORKS[id].chain);
  }

  return (
    <div
      className="flex rounded-full border border-line bg-inset p-0.5"
      role="group"
      aria-label="Choose network"
    >
      {(["testnet", "mainnet"] as NetworkId[]).map((id) => {
        const active = network === id;
        const live = id === "mainnet";
        const base = "rounded-full px-3 py-1.5 font-mono text-xs transition";
        const cls = active
          ? live
            ? "bg-red/15 text-red ring-1 ring-inset ring-red/40"
            : "bg-green/15 text-green ring-1 ring-inset ring-green/40"
          : "text-muted hover:text-ink";
        return (
          <button key={id} onClick={() => pick(id)} className={`${base} ${cls}`} aria-pressed={active}>
            {NETWORKS[id].short}
          </button>
        );
      })}
    </div>
  );
}
