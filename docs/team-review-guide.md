# Team Review Guide — Record Anchoring (Problem 1)

Audience: teammates and the instructor who want to (a) review the code,
(b) run the tests, and (c) understand *why* the design works.

This guide is deliberately short. For milestone-by-milestone scope see
`docs/problem1-build-plan.md`. For the design trade-offs see
`docs/problem1-solution-tradeoffs.md`. Attribution tags used below follow
`docs/SOURCES.md`.

---

## 1. What is deployed right now

| Item                | Value                                                                |
|---------------------|----------------------------------------------------------------------|
| Contract            | `RecordAnchor.sol`                                                   |
| Network             | Base Sepolia (chain id 84532)                                        |
| Contract address    | `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF`                         |
| Deploy tx           | `0xf566c99da45feee5da821b55547004eb25b3d92e5932c0c3ab076961cb4fbfcd` |
| Sample anchor tx    | `0xad6fd03965116b763ad9e7e34a86d3895de7a5a8dae5a5997ee37c88c4a02676` |
| Anchor gas used     | 90,594                                                               |

Explorer (clickable):
- Contract — https://sepolia.basescan.org/address/0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF
- Anchor tx — https://sepolia.basescan.org/tx/0xad6fd03965116b763ad9e7e34a86d3895de7a5a8dae5a5997ee37c88c4a02676

You can verify the anchor *without any of our code* by opening the contract
on Basescan, clicking "Read Contract" → `getAnchor`, and pasting the record
hash. It will return the timestamp, block, and submitter. That is the core
claim of the project: a third party can independently verify a record
existed at a given time, using only a public block explorer.

---

## 2. How to review the code (5-minute path)

Read these files in order. The whole pipeline is < 300 lines.

1. `anchor/src/types.ts` — the record schema (v1.0). What we hash.
2. `anchor/src/canonicalize.ts` — deterministic byte encoding of a record.
3. `anchor/src/hash.ts` — `keccak256(canonicalize(record))`.
4. `anchor/contracts/RecordAnchor.sol` — the contract (~110 lines).
5. `anchor/test/` — the tests, especially the **hash-parity** test that
   proves our TypeScript hash matches Solidity's.
6. `anchor/scripts/deploy.ts` and `anchor/scripts/anchor-one.ts` — how we
   deployed and how we wrote one record to Base Sepolia.

---

## 3. How to run it locally

Prereq: Node 20+, git, a terminal. No blockchain knowledge required for
the local run — it uses an in-memory Hardhat node.

```bash
git clone <this repo>
cd onchaincarfacts/anchor
npm install
npx hardhat compile
npx hardhat test
```

Expected: all tests pass, including `hash-parity` (JS and Solidity produce
the same `bytes32`) and Merkle-root verification.

### Optional: deploy to a public testnet yourself

You do **not** need to do this to grade the project — the deployment above
is already public and immutable. If you want to repeat it:

1. `cp .env.example .env` and fill in:
   - `BASE_SEPOLIA_RPC_URL` — e.g. `https://sepolia.base.org` (public) or
     an Alchemy/Infura endpoint.
   - `DEPLOYER_PRIVATE_KEY` — a **testnet-only** key. Fund it from a Base
     Sepolia faucet (~0.01 ETH is plenty).
2. `npx hardhat run scripts/deploy.ts --network baseSepolia`
3. `npx hardhat run scripts/anchor-one.ts --network baseSepolia`

Your own deployment will land at a different address; `deployments.json`
records both the shared deployment and anything you add locally.

---

## 4. How it works (the pipeline)

```
 vehicle record (JSON)
        │
        ▼  canonicalize.ts — encode fields in a fixed order
 canonical bytes
        │
        ▼  hash.ts — keccak256
 32-byte hash
        │
        ▼  contract.anchor(hash)   (sent as an Ethereum tx)
 on-chain mapping: hash → (timestamp, blockNumber, submitter)
        │
        ▼  anyone later:  contract.getAnchor(hash) → same tuple
 independently verifiable proof of existence
```

Two modes are implemented in the same contract:

- **Option 1 — single-hash anchor** (`anchor` / `getAnchor`). One tx per
  record. Simple, but one tx per record is ~90k gas.
- **Option 3 — Merkle-root anchor** (`anchorRoot` / `verifyLeaf`). You
  build a Merkle tree over many record hashes off-chain, anchor only the
  32-byte root, and prove any individual leaf later with a short proof.
  One tx covers arbitrarily many records. [OWN — choice to implement both
  so M6 can measure the cost delta.]

### Why the hash-parity test matters

The contract never sees the raw record — only the hash. If our off-chain
TypeScript hash didn't match what the contract *would* produce from the
same record, a verifier couldn't reconstruct the hash and the whole system
is worthless. The `canonicalHash` view function on the contract exists
solely to be called from a test with the same fields the TypeScript code
encoded; both must return the same `bytes32`. [OWN]

---

## 5. Why it works (the cryptography and the chain)

Three properties hold together, and each has a well-understood source.

### 5.1 `keccak256` is collision-resistant

A 256-bit cryptographic hash. Finding two different inputs that produce
the same output is computationally infeasible. This is why a 32-byte hash
is a faithful "fingerprint" of the record — change one character of the
VIN or one digit of the mileage and the hash changes completely.
[S?:keccak256 — Ethereum Yellow Paper / Solidity docs]

### 5.2 Ethereum ordering gives a trusted timestamp

When the contract stores `block.timestamp` at anchor time, that timestamp
is agreed on by the entire network as part of consensus. No single party
(including us, the submitter) can rewrite it after the fact without
rewriting Ethereum history — which the economic security of the chain
makes impractical. This is why the proof is "trustless": the verifier
doesn't have to trust us, only the chain. [S?:ethereum-consensus]

### 5.3 Base Sepolia inherits Ethereum's security model

We deploy to Base Sepolia rather than Ethereum mainnet for cost reasons:
gas on an L2 testnet is free (faucet ETH) and real Base mainnet txs are
~10-100× cheaper than L1. Base is an **optimistic rollup** — transactions
execute on Base, then batches are posted back to Ethereum L1, where the
data is available for anyone to re-derive Base's state. The security
argument for production would be "Base inherits L1 data availability and
settlement"; for this project the testnet is sufficient to demonstrate
the pattern. [S?:base-l2] [S?:l2-rollup-concept]

### 5.4 The pattern has a well-known precedent

What we are doing — hashing records off-chain and anchoring hashes to a
tamper-evident public log — is the same pattern used by Certificate
Transparency, which logs every TLS certificate issued by a trusted CA so
that mis-issuance is publicly detectable. That system has been running
since 2013 and is now required by major browsers. The blockchain replaces
the append-only log server; everything else is analogous.
[S?:certificate-transparency — RFC 6962]

---

## 6. Sources to read for deeper understanding

These are reading-list pointers, not yet fully cited entries. Confirmed
citations will land in `docs/SOURCES.md` as they're read.

| Topic                            | Suggested source                                                | Why read it                                   |
|----------------------------------|-----------------------------------------------------------------|-----------------------------------------------|
| What keccak256 actually computes | Ethereum Yellow Paper, appendix on hashing; Solidity docs       | Formal definition of the hash we rely on      |
| Why blockchain timestamps hold   | Ethereum consensus spec / any intro-to-PoS explainer            | Grounds the "trustless timestamp" claim       |
| L2 rollups vs. L1                | `ethereum.org/en/developers/docs/scaling/optimistic-rollups/`   | Why Base Sepolia is cheap and still credible  |
| Base specifically                | `docs.base.org`                                                 | Confirms Base is Coinbase's OP-Stack rollup   |
| Certificate Transparency         | RFC 6962                                                        | The canonical precedent for hash anchoring    |
| Merkle trees                     | Any cryptography textbook; `en.wikipedia.org/wiki/Merkle_tree`  | Background for Option 3 (batched anchoring)   |
| Solidity `abi.encode` determinism| Solidity language docs, ABI section                             | Why canonicalization + `abi.encode` is stable |

Every `[S?]` tag in this doc becomes a real `[S#]` entry in
`docs/SOURCES.md` as each source is read and verified before final
submission. [OWN]

---

## 7. What's **not** in scope (so reviewers don't ask)

Per the 2026-04-15 scope narrow (`docs/problem1-build-plan.md`), this
project is *only* record anchoring. The following are explicitly out of
scope and live in the solution-tradeoffs doc as future work:
attestations / source reputation, privacy-preserving record storage,
fraud detection, and a consumer-facing product. [OWN]
