import { activeChain } from "./arc";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "") as `0x${string}`;

export const isContractConfigured =
  /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);

export const explorerBase = activeChain.blockExplorers.default.url;
export const txUrl = (hash: string) => `${explorerBase}/tx/${hash}`;
export const addressUrl = (addr: string) => `${explorerBase}/address/${addr}`;

export const splitPayAbi = [
  {
    type: "function",
    name: "executeSplit",
    stateMutability: "payable",
    inputs: [
      { name: "_recipients", type: "address[]" },
      { name: "_bps", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "createEscrow",
    stateMutability: "payable",
    inputs: [
      { name: "_recipient", type: "address" },
      { name: "_durationSeconds", type: "uint256" },
    ],
    outputs: [{ name: "escrowId", type: "uint256" }],
  },
  {
    type: "function",
    name: "releaseEscrow",
    stateMutability: "nonpayable",
    inputs: [{ name: "_escrowId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "refundEscrow",
    stateMutability: "nonpayable",
    inputs: [{ name: "_escrowId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "nextEscrowId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "escrows",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "releaseTime", type: "uint256" },
      { name: "finalized", type: "bool" },
    ],
  },
  {
    type: "event",
    name: "PaymentSplit",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "totalAmount", type: "uint256", indexed: false },
      { name: "recipientCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EscrowCreated",
    inputs: [
      { name: "escrowId", type: "uint256", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "releaseTime", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EscrowReleased",
    inputs: [
      { name: "escrowId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "EscrowRefunded",
    inputs: [
      { name: "escrowId", type: "uint256", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
