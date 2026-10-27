"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Chain } from "viem";
import {
  DEFAULT_NETWORK,
  NETWORKS,
  explorerAddrUrl,
  explorerTxUrl,
  type NetworkId,
} from "./chains";

const STORAGE_KEY = "splitpay-network";

type NetworkState = {
  network: NetworkId;
  setNetwork: (id: NetworkId) => void;
  chain: Chain;
  contract: `0x${string}`;
  isLive: boolean;
  label: string;
  symbol: string;
  faucet?: string;
  isContractConfigured: boolean;
  txUrl: (hash: string) => string;
  addressUrl: (addr: string) => string;
};

const Ctx = createContext<NetworkState | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<NetworkId>(DEFAULT_NETWORK);

  // Restore the last choice after mount (avoids hydration mismatch).
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    // Earlier versions saved "testnet" / "mainnet", which were both Arc.
    const migrated = saved === "mainnet" ? "arc" : saved === "testnet" ? "arc-testnet" : saved;
    if (migrated && migrated in NETWORKS) setNetworkState(migrated as NetworkId);
  }, []);

  const setNetwork = useCallback((id: NetworkId) => {
    setNetworkState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const cfg = NETWORKS[network];

  const value = useMemo<NetworkState>(
    () => ({
      network,
      setNetwork,
      chain: cfg.chain,
      contract: cfg.contract,
      isLive: cfg.live,
      label: cfg.label,
      symbol: cfg.symbol,
      faucet: cfg.faucet,
      isContractConfigured: /^0x[a-fA-F0-9]{40}$/.test(cfg.contract),
      txUrl: (hash: string) => explorerTxUrl(cfg.chain, hash),
      addressUrl: (addr: string) => explorerAddrUrl(cfg.chain, addr),
    }),
    [network, setNetwork, cfg],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNetwork() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
