# anchor/

Smart contract + tooling for Problem 1 (record anchoring) of the
OnChainCarFacts class project. See `docs/problem1-build-plan.md` at the
repo root for the full milestone schedule.

## What's here

- `contracts/RecordAnchor.sol` — anchors record hashes (Option 1) and
  Merkle roots (Option 3). Includes a `canonicalHash` view function used
  for cross-checking that off-chain hashing matches on-chain.
- `src/types.ts` — record schema v1.0 (TypeScript types).
- `src/canonicalize.ts` — deterministic ABI-encoding of a record.
- `src/hash.ts` — `keccak256(canonicalize(record))`.
- `test/` — Hardhat tests including the JS↔Solidity hash-parity check.

## Status

| Milestone | Status |
|---|---|
| M1 — Scaffold | Done — `npx hardhat compile` passes |
| M2 — Canonicalization + hash parity | Done — 5-record corpus matches JS and Solidity |
| M3 — `RecordAnchor.sol` v1 | Done — anchor / anchorRoot / verifyLeaf / getAnchor / getRoot all tested |
| M5a — Deploy to Base Sepolia | Not started — needs funded testnet wallet |

## Run

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deploy (when ready)

Copy `.env.example` to `.env`, fill in an RPC URL and a funded testnet
private key, then:

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

(deploy script lands in M5a.)
