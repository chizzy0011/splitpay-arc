import { defineChain } from "viem";

/**
 * Arc chain definitions.
 *
 * IMPORTANT: nativeCurrency.decimals = 18. On Arc, USDC *is* the native gas
 * asset, and the native/gas view uses 18 decimals (the ERC-20 view uses 6).
 * Because these are the native-currency configs, `parseEther("10")` correctly
 * encodes 10 USDC for `msg.value`. Only drop to 6 decimals when displaying the
 * ERC-20 balance or calling the USDC token contract directly.
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.io"] } },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.testnet.arc.io" },
  },
  testnet: true,
});

export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.arc.io"] } },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://explorer.arc.io" },
  },
});

export const TARGET_NETWORK =
  process.env.NEXT_PUBLIC_ARC_NETWORK === "mainnet" ? "mainnet" : "testnet";

export const activeChain =
  TARGET_NETWORK === "mainnet" ? arcMainnet : arcTestnet;
