# SplitPay Arc — `SplitPayEngine`

Programmatic **native-USDC** payout splitter + cancellable time-locked vault for
**Arc Mainnet**. Built for Circle's Arc Microgrants (DoraHacks).

Two primitives, one gas-cheap contract:

- **`executeSplit`** — atomic multi-recipient payout in a single tx, shares in
  **basis points** (so 33.33% works). Dust-safe: the final recipient absorbs any
  rounding remainder, so the contract never strands value.
- **Escrow vault** — sender locks USDC for a recipient until `releaseTime`.
  - After the lock: recipient (or sender) calls `releaseEscrow` → pays recipient.
  - Before the lock: sender calls `refundEscrow` → reclaims funds.
  - Honest scope: this is a **cancellable time-locked vault**, not milestone or
    multi-sig escrow. Don't market it as more than it is.

All value functions carry a `nonReentrant` guard and follow
checks-effects-interactions.

---

## Network details (from Circle's official `use-arc` skill)

| | Mainnet | Testnet |
|---|---|---|
| Chain ID | `5042` (`0x13B2`) | `5042002` (`0x4CEF52`) |
| RPC | `https://rpc.mainnet.arc.io` | `https://rpc.testnet.arc.io` |
| Explorer | `https://explorer.arc.io` | `https://explorer.testnet.arc.io` |
| Faucet | — (bridge real USDC via CCTP) | `https://faucet.circle.com` |

**Gas token = USDC.** Native gas *is* USDC — one balance, two interfaces:
- **ERC-20 view: 6 decimals** (use for balances/transfers/UI display)
- **Native/gas view: 18 decimals** (`msg.value`, gas math)
- USDC token address (both nets): `0x3600000000000000000000000000000000000000`
- CCTP domain: `26`

### ⚠️ Frontend decimals gotcha
This contract moves value via `msg.value`, which is the **18-decimal native**
view. To split **$10**, send `value = parseEther("10")` (= `10 × 10¹⁸`), **not**
`10 × 10⁶`. viem's built-in `arc` / `arcTestnet` chain configs already define the
native currency as 18 decimals, so `parseEther` is correct. Only drop to 6
decimals when *displaying* USDC balances or calling the ERC-20 interface.

---

## Setup

Install Foundry (Windows: use Git Bash or WSL):

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Install deps and configure env:

```bash
forge install foundry-rs/forge-std
cp .env.example .env       # then fill in PRIVATE_KEY
```

## Build & test

```bash
forge build
forge test -vvv
```

The test suite covers: even splits, dust conservation, bps/array/zero-value
validation, escrow release after lock, refund before lock, and all the
unauthorized / double-finalize revert paths.

## Deploy

**Testnet first** (free — fund the deployer at https://faucet.circle.com):

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url arc_testnet --broadcast
```

**Mainnet** (spends REAL USDC gas — only when ready to submit):

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url arc_mainnet --broadcast
```

To fund the mainnet deployer, bridge a few dollars of USDC to Arc via Circle
CCTP: https://developers.circle.com/cctp/quickstarts/transfer-usdc-ethereum-to-arc

---

## Known MVP limitations (put these in the submission, don't hide them)

- **Push payments:** `executeSplit` sends to each recipient directly, so a
  recipient *contract* that reverts on receive would block the whole split. Fine
  for wallet recipients; a v2 would use a pull-withdraw pattern.
- **Vault is time-based only:** no work-verification or dispute resolution — the
  recipient is guaranteed payment after the lock expires, and the sender can
  cancel before it.
