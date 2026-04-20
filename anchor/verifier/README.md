# Record Anchor Verifier (static web page)

A zero-dependency, read-only web page that:

1. Takes a vehicle record (JSON) pasted into a textarea.
2. Computes `keccak256(canonicalize(record))` in the browser.
3. Calls `getAnchor(hash)` on the deployed `RecordAnchor` contract on Base Sepolia
   over a public RPC (no wallet, no private key).
4. Shows whether the record is anchored, and if so its on-chain timestamp,
   block, submitter, and a Basescan link to the anchor transaction.

Intended as the visual half of the video demo: CLI anchors a record, this page
verifies it. Mutating any field (there's a "Tamper" button) flips the status
from ✓ to ✗ — the tamper-evident property of hash anchoring.

## How to run

It's a single static HTML file. Options:

- **Easiest**: open `anchor/verifier/index.html` directly in a browser.
  The ESM CDN (`esm.sh`) is reached over HTTPS; the `file://` origin is
  permitted by esm.sh.
- **Cleanest**: serve it from any static server so the URL bar looks normal:
  ```bash
  cd anchor/verifier
  python -m http.server 8000
  # then open http://localhost:8000
  ```

## What matches what

The canonicalization + field-order logic in `index.html` must stay in sync with
`anchor/src/canonicalize.ts`. If the schema changes, update both. The
hash-parity test in `anchor/test/` covers the TS ↔ Solidity side; the browser
reuses the same ethers.js primitives (`AbiCoder`, `keccak256`), so if TS matches
Solidity and JS matches TS, all three agree.

## Config (hard-coded at the top of `index.html`)

| Field | Value |
|---|---|
| Contract | `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF` |
| Network  | Base Sepolia (chain id 84532) |
| RPC      | `https://sepolia.base.org` (public) |
| Explorer | `https://sepolia.basescan.org` |

## Limitations

- Read-only. No submit flow. To anchor a new record, use the CLI
  (`npx hardhat run scripts/anchor-one.ts --network baseSepolia`).
- Public RPC may rate-limit under load. For the demo, one user, fine.
- `queryFilter` for the anchor tx walks from the deploy block forward. If we
  redeploy, bump `DEPLOY_BLOCK` in `index.html` to avoid scanning stale
  history.
