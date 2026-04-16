# Sources & Attribution Log

This file tracks the provenance of every non-trivial claim, figure, or design
choice in the OnChainCarFacts project. Its purpose is to satisfy the course
requirement that we distinguish our own analysis from external source material
and from reasoning co-developed with generative AI.

---

## Tagging legend

Use these tags inline in any project doc (proposal, design notes, code
comments where relevant):

| Tag       | Meaning                                                                                                  |
|-----------|----------------------------------------------------------------------------------------------------------|
| `[S#]`    | External source. Numbered entry in the bibliography below. Must be a source we have actually read.       |
| `[CC]`    | Co-developed with Claude. Reasoning, framing, or wording proposed by Claude that I reviewed and accepted. |
| `[OWN]`   | My own analysis, decision, or synthesis. Not taken from a source, not proposed by Claude.                |
| `[S?]`    | Claim that needs a source. Placeholder — must be replaced with `[S#]` or removed before final submission. |

Rules of thumb:
- If a fact could be checked against a reference (market share, statute, protocol
  spec, gas price), it needs `[S#]`.
- If it's a design decision I made or an argument I am making, it's `[OWN]`.
- If Claude proposed a framing and I accepted it without adding my own reasoning,
  tag it `[CC]`. If I extended or challenged Claude's framing, tag it `[OWN]`
  with a `[CC]` note on what was originally suggested.
- Class-covered baseline (basic on-chain data storage, smart contract
  fundamentals, transactions, addresses, ABI) does **not** require a citation.
- Everything else the class did not cover — Layer-2 rollups, specific testnets
  (Sepolia, Base Sepolia), Ethereum Attestation Service, certificate
  transparency, GDPR/DPPA specifics, Carfax market data, prior blockchain
  vehicle-history attempts — **does** require a citation.

---

## Bibliography

Each entry format:

```
[S#] Title — Author/Org. URL. Accessed YYYY-MM-DD.
    Used to support: <one-line description of the claim this source backs>.
    Read status: [ ] skimmed  [ ] read in full  [ ] verified claim in source
```

### Placeholder entries to fill in

The following claims already appear in our proposal and need real sources.
Each is currently tagged `[S?:tag]` in `problem1-record-anchoring.md`.

- `[S?:carfax-market-share]` — Carfax's share of the US vehicle history report
  market (we wrote "roughly 90%").
- `[S?:carfax-pricing]` — Carfax single-report retail price (we wrote "$40+").
- `[S?:vehicle-fraud-cost]` — Annual US vehicle fraud cost (we wrote "$6B+").
- `[S?:carfax-antitrust]` — Carfax antitrust class action (we wrote "$50M, 120+ dealers").
- `[S?:nhtsa-vpic]` — NHTSA vPIC / VIN decoder API documentation.
- `[S?:carvertical]` — carVertical project description / outcome.
- `[S?:vinchain]` — VINchain project description / outcome.
- `[S?:base-l2]` — Base L2 overview (Coinbase). Establishes that Base exists,
  is an Ethereum rollup, and who operates it.
- `[S?:base-sepolia]` — Base Sepolia testnet documentation.
- `[S?:l2-rollup-concept]` — Primary reference for what an "L2 rollup" is and
  how data availability / settlement differs from L1.
- `[S?:keccak256]` — Specification or authoritative reference for keccak256 as
  used in Ethereum (e.g., Ethereum Yellow Paper or Solidity docs).
- `[S?:merkle-tree]` — Reference for Merkle tree construction (if we use
  batched anchoring via a Merkle root).
- `[S?:certificate-transparency]` — RFC 6962 or equivalent. We claim hash
  anchoring is "the same pattern as certificate transparency logs."
- `[S?:eas]` — Ethereum Attestation Service docs (only needed if we still
  mention EAS after the scope narrow; otherwise drop).
- `[S?:gdpr-erasure]` — GDPR Article 17 (right to erasure). Only needed if we
  keep the privacy-tension discussion in the narrowed proposal.
- `[S?:mobi]` — MOBI consortium (only if we keep the OEM-interest claim).

### Confirmed entries

(None yet — add entries here as sources are read and verified.)

---

## Change log

- 2026-04-15: File created as part of the Problem 1 narrowing. Scaffold only;
  no sources confirmed yet. `[CC]` — tagging scheme proposed by Claude,
  accepted by Mitch.
