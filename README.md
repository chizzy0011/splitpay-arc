# SplitPay (`SplitPayEngine`)

A small, immutable smart contract that splits one native-coin payment across
many wallets in a single transaction, or locks a payment in a cancellable
time-locked vault. It uses the chain's own native coin: no wrapped token, no
custody, no admin keys. The same source is deployed on more than one EVM
network; see [Deployments](#deployments).

Two primitives in one contract:

- **`executeSplit`**: atomic multi-recipient payout by **percentage** (basis
  points, so 33.33% works). Dust-safe: the final recipient absorbs any rounding
  remainder, so the contract never strands value.
- **`executeSplitAmounts`**: the same, by **exact per-recipient amounts**; the
  sum must equal `msg.value`, so every payout is precise. The web app toggles
  between % and exact-amount modes over these two functions.
- **Escrow vault**: the sender locks funds for a recipient until `releaseTime`.
  - After the lock, the recipient (or sender) calls `releaseEscrow` and the
    recipient is paid.
  - Before the lock, the sender calls `refundEscrow` and reclaims the funds.
  - Scope: this is a **cancellable time-locked vault**, not milestone or
    multi-sig escrow.

All value functions carry a `nonReentrant` guard and follow
checks-effects-interactions. The contract has not been independently audited.

---

## Deployments

**Web app:** https://splitpay-arc-eight.vercel.app. A network picker lists every
network below; the default network is set in
[`web/src/lib/chains.ts`](web/src/lib/chains.ts).

| Network | Chain ID | Native coin | Contract | Tally |
|---|---|---|---|---|
| Arc Mainnet | 5042 | USDC | [`0xc0C5590e5827641DC0367B299A64D6bf6A47E9bd`](https://explorer.arc.io/address/0xc0C5590e5827641DC0367B299A64D6bf6A47E9bd) | Control proven (v1 registry record) |
| Arc Testnet | 5042002 | USDC | [`0xe5C08caa5f68Bd835456a79706D2fB09abE4E3f9`](https://explorer.testnet.arc.io/address/0xe5C08caa5f68Bd835456a79706D2fB09abE4E3f9) | none claimed |
| BOT Chain | 677 | BOT | [`0x6b2Cf0b6b1491Ed1d9908e2319cd646b0e5560d8`](https://scan.botchain.ai/address/0x6b2Cf0b6b1491Ed1d9908e2319cd646b0e5560d8) | **Tally Verified** |

Source is verified on the BOT Chain explorer. It has not been submitted on the
Arc explorers. `owner()` is `0x55192E653Df4f7Fb16f8988831075DC0C3cD7698` on Arc
Mainnet and BOT Chain; the Arc Testnet deployment is owned by a throwaway test
wallet (`0x2baF3c8f8c86d79427f7036E1F69F8443DDEb429`).

> Warning: **recipient addresses must be plain wallets (EOAs).** `executeSplit`
> and `releaseEscrow` use push payments, so a recipient that is a contract
> rejecting value, or a swept public-key address (for example the default
> Anvil/Hardhat accounts, whose keys are public and get drained by bots on live
> networks), makes the transfer revert with `"Transfer failed"`. Use real
> wallets.

### Network facts

| | Arc Mainnet | Arc Testnet | BOT Chain |
|---|---|---|---|
| RPC | `https://rpc.mainnet.arc.io` | `https://rpc.testnet.arc.io` | `https://rpc.botchain.ai` |
| Explorer | `https://explorer.arc.io` | `https://explorer.testnet.arc.io` | `https://scan.botchain.ai` |
| Native coin | USDC | USDC | BOT |
| Faucet | none | `https://faucet.circle.com` | none |

The contract settles in whatever the chain's native coin is, through
`msg.value`. In the contract's inline comments the coin is called "USDC", which
dates from the first deployment; on BOT Chain the same code moves BOT.

**Decimals.** `msg.value` is the 18-decimal native unit. To send 10 units of the
native coin, pass `parseEther("10")`. Arc additionally exposes its USDC as a
6-decimal ERC-20 view of the same balance; use that only for display or ERC-20
calls, never for `msg.value`.

---

## Provenance with Tally

[Tally](https://tallyarc.tech) is a registry that shows **who controls a
contract and where its source lives**. SplitPay is registered with it so anyone
can check that this contract was deployed by the wallet named here and matches
this repository.

- **`owner()`** on `SplitPayEngine` returns the deployer. It is an identity
  marker only: there are no owner-only functions and no privileges, so the
  owner cannot touch funds. It exists so the deployer can prove control.
- **[`tally.json`](tally.json)** lists each registered deployment and names the
  wallet that registered it (`signer`). Tally shows "Verified" only when the
  on-chain record, the unchanged contract code, and this file all agree.
- **Levels.** *Tally Verified*: control proven on-chain, code unchanged, and the
  repository lists the contract and names the signer. *Control proven*: the
  on-chain proof holds but the repository check is missing, so it stops short of
  Verified.

Check the BOT Chain deployment yourself:

- Record page: https://tallyarc.tech/c/0x6b2Cf0b6b1491Ed1d9908e2319cd646b0e5560d8?chain=bot
- JSON: https://tallyarc.tech/api/lookup/0x6b2Cf0b6b1491Ed1d9908e2319cd646b0e5560d8?chain=bot
- From a clone of this repo: `npx -p tally-provenance tally-verify` (reads
  `tally.json` and checks every listed contract)

![Tally](https://tallyarc.tech/api/badge/0x6b2Cf0b6b1491Ed1d9908e2319cd646b0e5560d8?chain=bot)

**What Tally does not say.** It is not an audit, it does not say the contract
is safe, and it is not an endorsement by any network. It records who controls
a contract and where its source lives, nothing more. Tally itself has not had an
external audit.

**To register a new deployment:** deploy from the wallet that will own it, open
`https://tallyarc.tech/register?chain=<network-key>` with that wallet, register
the contract against this repository, then add `{ "chainId", "address", "signer" }`
to `tally.json` and push it. Network keys are `arc`, `arc-testnet` and `bot`.

The repository is still named `splitpay-arc` because Tally records name the
repository URL and do not follow GitHub renames; renaming it would break the
existing records.

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

## Build and test

```bash
forge build
forge test -vvv
```

The test suite covers: even splits, dust conservation, bps/array/zero-value
validation, escrow release after lock, refund before lock, and all the
unauthorized and double-finalize revert paths.

## Deploy

`foundry.toml` defines the RPC names `arc_testnet`, `arc_mainnet` and `bot`.
Any other EVM network works by passing its RPC URL.

```bash
# Testnet first, where one exists
forge script script/Deploy.s.sol:Deploy --rpc-url arc_testnet --broadcast

# A live network (spends real gas)
forge script script/Deploy.s.sol:Deploy --rpc-url bot --broadcast --legacy
```

The compiler is pinned to solc 0.8.20 with the `paris` EVM version so the
bytecode avoids newer opcodes that not every chain supports. Verify the source
on a Blockscout-style explorer with:

```bash
forge verify-contract <address> src/SplitPayEngine.sol:SplitPayEngine \
  --chain-id <id> --verifier blockscout --verifier-url <explorer>/api/ \
  --compiler-version 0.8.20 --evm-version paris --num-of-optimizations 200
```

---

## Known MVP limitations

- **Push payments:** `executeSplit` sends to each recipient directly, so a
  recipient *contract* that reverts on receive would block the whole split. Fine
  for wallet recipients; a v2 would use a pull-withdraw pattern.
- **Vault is time-based only:** no work-verification or dispute resolution. The
  recipient is guaranteed payment after the lock expires, and the sender can
  cancel before it.
- **Not audited:** covered by the project's own tests only.
