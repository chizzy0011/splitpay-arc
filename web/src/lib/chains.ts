import { defineChain, type Chain } from "viem";

/**
 * Supported chains. BOT Chain is the primary network; Arc stays available as
 * a secondary one (its contracts are still live). Every chain here uses its
 * native coin as the settlement asset, in an 18-decimal view, so `parseEther`
 * correctly encodes `msg.value`.
 */
export const botMainnet = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.botchain.ai"] } },
  blockExplorers: {
    default: { name: "BOTScan", url: "https://scan.botchain.ai" },
  },
});

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

export type NetworkId = "bot" | "arc" | "arc-testnet";

type NetworkConfig = {
  id: NetworkId;
  chain: Chain;
  contract: `0x${string}`;
  label: string; // full label
  short: string; // chip label
  symbol: string; // native settlement coin
  live: boolean; // true = real money
  faucet?: string; // free test funds, testnets only
};

// Deployed contract addresses (env overrides win; defaults are the live deploys).
const BOT_CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_BOT ??
  "0x6b2Cf0b6b1491Ed1d9908e2319cd646b0e5560d8") as `0x${string}`;
const ARC_TESTNET_CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_TESTNET ??
  "0xe5C08caa5f68Bd835456a79706D2fB09abE4E3f9") as `0x${string}`;
const ARC_MAINNET_CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_MAINNET ??
  "0xc0C5590e5827641DC0367B299A64D6bf6A47E9bd") as `0x${string}`;

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  bot: {
    id: "bot",
    chain: botMainnet,
    contract: BOT_CONTRACT,
    label: "BOT Chain",
    short: "BOT Chain",
    symbol: "BOT",
    live: true,
  },
  arc: {
    id: "arc",
    chain: arcMainnet,
    contract: ARC_MAINNET_CONTRACT,
    label: "Arc Mainnet",
    short: "Arc",
    symbol: "USDC",
    live: true,
  },
  "arc-testnet": {
    id: "arc-testnet",
    chain: arcTestnet,
    contract: ARC_TESTNET_CONTRACT,
    label: "Arc Testnet",
    short: "Arc Testnet",
    symbol: "USDC",
    live: false,
    faucet: "https://faucet.circle.com",
  },
};

// Display order in the network picker.
export const NETWORK_ORDER: NetworkId[] = ["bot", "arc", "arc-testnet"];

// BOT Chain is the primary network. The red banner and the picker make it
// obvious that it moves real value.
export const DEFAULT_NETWORK: NetworkId = "bot";

export function explorerTxUrl(chain: Chain, hash: string) {
  return `${chain.blockExplorers?.default.url}/tx/${hash}`;
}
export function explorerAddrUrl(chain: Chain, addr: string) {
  return `${chain.blockExplorers?.default.url}/address/${addr}`;
}
