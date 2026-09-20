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
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  numberToHex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { activeChain } from "./arc";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193;
  }
}

type WalletState = {
  address: `0x${string}` | null;
  chainId: number | null;
  isConnected: boolean;
  wrongNetwork: boolean;
  hasWallet: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  walletClient: WalletClient | null;
  publicClient: PublicClient;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: activeChain,
        transport: http(),
      }) as PublicClient,
    [],
  );

  const walletClient = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum || !address) return null;
    return createWalletClient({
      account: address,
      chain: activeChain,
      transport: custom(window.ethereum),
    });
  }, [address]);

  const refreshChain = useCallback(async () => {
    if (!window.ethereum) return;
    const hex = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    setChainId(parseInt(hex, 16));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) return;
    setConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts[0]) setAddress(accounts[0] as `0x${string}`);
      await refreshChain();
    } finally {
      setConnecting(false);
    }
  }, [refreshChain]);

  const disconnect = useCallback(() => setAddress(null), []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    const hexId = numberToHex(activeChain.id);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexId }],
      });
    } catch (err: unknown) {
      // 4902 = chain not added to wallet yet
      if ((err as { code?: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexId,
              chainName: activeChain.name,
              nativeCurrency: activeChain.nativeCurrency,
              rpcUrls: activeChain.rpcUrls.default.http,
              blockExplorerUrls: [activeChain.blockExplorers.default.url],
            },
          ],
        });
      }
    }
    await refreshChain();
  }, [refreshChain]);

  useEffect(() => {
    const eth = window.ethereum;
    setHasWallet(!!eth);
    if (!eth) return;

    void refreshChain();

    const onAccounts = (...args: unknown[]) => {
      const accs = args[0] as string[];
      setAddress(accs && accs[0] ? (accs[0] as `0x${string}`) : null);
    };
    const onChain = (...args: unknown[]) => {
      setChainId(parseInt(args[0] as string, 16));
    };
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [refreshChain]);

  const value: WalletState = {
    address,
    chainId,
    isConnected: !!address,
    wrongNetwork: !!address && chainId !== activeChain.id,
    hasWallet,
    connecting,
    connect,
    disconnect,
    switchNetwork,
    walletClient,
    publicClient,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
