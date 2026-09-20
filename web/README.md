# SplitPay Arc — Web dApp

Next.js (App Router) + **viem** dApp for the `SplitPayEngine` contract on Arc.
Deliberately **wagmi-free** — it talks to `window.ethereum` directly through viem,
keeping the dependency tree small and the install fast.

## Features

- **Connect wallet** (injected / MetaMask) with an automatic network guard that
  prompts "Switch to Arc" (and adds the chain to the wallet if missing).
- **SplitVault** — prefilled-but-editable recipient rows (clear ✕ per field,
  add/remove rows), 1-click presets (50/50, 70/20/10), live `executeSplit`.
- **StreamLock** — create a time-locked vault, then Release (after timer) or
  Refund (before timer) with a live countdown per vault.
- Every transaction shows pending → confirming → confirmed and links to the
  Arc explorer.

## Run

```bash
npm install
cp .env.local.example .env.local   # then set NEXT_PUBLIC_CONTRACT_ADDRESS
npm run dev                        # http://localhost:3000
```

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the address printed by the Foundry deploy
script, and `NEXT_PUBLIC_ARC_NETWORK` to `testnet` (default) or `mainnet`.

## Decimals note

The contract moves value via `msg.value` — the **18-decimal native** view of
USDC on Arc. The UI converts amounts with viem's `parseEther`, which is correct
because the chain config declares 18-decimal native currency. Only use 6
decimals when reading the ERC-20 USDC balance directly.

## Deploy (Vercel)

Set the same two env vars in the Vercel project, point the root to `web/`, and
deploy. `npm run build` is clean (static prerender).
