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

- `[S?:carvertical]` — carVertical project description / outcome.
- `[S?:vinchain]` — VINchain project description / outcome.
- `[S?:l2-rollup-concept]` — Primary reference for what an "L2 rollup" is and
  how data availability / settlement differs from L1.
- `[S?:merkle-tree]` — Reference for Merkle tree construction (if we use
  batched anchoring via a Merkle root).
- `[S?:certificate-transparency]` — RFC 6962 or equivalent. We claim hash
  anchoring is "the same pattern as certificate transparency logs."
- `[S?:vehicle-fraud-aggregate]` — Aggregate US vehicle-fraud cost across all
  categories (odometer + title + accident + cross-jurisdiction). NHTSA's
  $1.06B figure ([S5]) covers odometer rollback only; the wider single-digit-
  billions claim still needs an aggregating source.
- `[S?:rfc-3161]` / `[S?:rfc-4998]` — IETF RFCs for trusted timestamping (TSA)
  and ERS re-timestamping; cited in §2 of the whitepaper.
- `[S?:nmvtis]` — National Motor Vehicle Title Information System overview
  (AAMVA / DOJ); cited in §2 of the whitepaper.
- `[S?:permissioned-chain]` — Reference for permissioned/consortium chain
  architecture; cited in §2 of the whitepaper.
- `[S?:opentimestamps]` — OpenTimestamps protocol description (Todd et al);
  cited in §2 of the whitepaper.
- `[S?:oz-merkle-proof]` — OpenZeppelin `MerkleProof.sol` documentation;
  cited in §3.1 of the whitepaper.
- `[S?:ethereum-timestamp-rules]` — Ethereum block.timestamp proposer-
  discretion rules; cited in §4.1 of the whitepaper.
- `[S?:mobi]` — MOBI consortium (only if we keep the OEM-interest claim).

### Confirmed entries

[S1] "Carfax hit with $50 million antitrust lawsuit by 120 dealerships" — Automotive News, 2013-04-24. https://www.autonews.com/article/20130424/RETAIL07/130429941/carfax-hit-with-50-million-antitrust-lawsuit-by-120-dealerships/. Accessed 2026-04-24.
    Used to support: Carfax's ~90% market share claim and the $50M / 120+ dealer antitrust class-action figure cited in §1. The article reports the complaint's allegation of ~90% market share via exclusive agreements with OEMs and listing platforms.
    Read status: [x] skimmed  [x] read in full  [x] verified claim in source

[S2] "Base — Base Documentation" — Base / Coinbase. https://docs.base.org/get-started/base. Accessed 2026-04-24.
    Used to support: Base is an OP-Stack optimistic rollup on Ethereum operated by Coinbase, with ~2s block times and no native token. Cited in §3.3 and §4 as the rollup we deployed to.
    Read status: [x] skimmed  [x] read in full  [x] verified claim in source

[S3] "Hashing with Keccak256" — Solidity by Example (Solidity 0.8.26). https://solidity-by-example.org/hashing/. Accessed 2026-04-24. Cross-referenced with the Solidity language documentation's description of `keccak256(bytes memory) returns (bytes32)` as a built-in.
    Used to support: keccak256 is the native Ethereum/Solidity hash function, producing a 32-byte output, suitable for identifying canonicalized records. Cited in §3.1.
    Read status: [x] skimmed  [x] read in full  [x] verified claim in source

[S4] "How Much Is a Carfax Report? Compare Costs & Alternatives" — VinAudit. https://www.vinaudit.com/how-much-is-a-carfax-report. Accessed 2026-04-26. Pricing figures stated current as of 2024-12-14.
    Used to support: Carfax single-report retail price of $44.99 cited in §1 of the whitepaper. VinAudit is a Carfax competitor that maintains a price-tracking page; the figure is corroborated by multiple secondary trackers (vehicledatabases.com, vininfohub.com).
    Read status: [x] skimmed  [x] read in full  [x] verified claim in source

[S5] "Preliminary Report: The Incidence Rate of Odometer Fraud" — NHTSA Office of Programs and Policy. DOT HS 809 441, NHTSA Technical Report, April 2002. https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/809441. Accessed 2026-04-26.
    Used to support: §1 figures of "approximately 452,000 cases of odometer fraud per year in the United States" (Executive Summary p. vi) and "$1,056 million per year" annual consumer cost with 95% confidence bounds $737M–$1,376M (Executive Summary p. vii, derived from $2,336 average per-case cost × 452,000 cases). Limitation: this is the most recent NHTSA *nationwide* estimate; numbers are 2002 dollars and may understate current dollar impact.
    Read status: [x] skimmed  [x] read in full (executive summary + TOC)  [x] verified claim in source

[S6] "Welcome to EAS" — Ethereum Attestation Service official documentation. https://docs.attest.org/. Accessed 2026-04-26. Source contracts at https://github.com/ethereum-attestation-service/eas-contracts (`EAS.sol`, `SchemaRegistry.sol`).
    Used to support: §3.3 and §5 references to EAS as the on-chain attestation primitive that a production attestation layer (Problem 2) would compose with. Establishes EAS exists, is open-source, runs on Ethereum L1 plus L2s including Base, and consists of two contracts (one for schema registration, one for attestations).
    Read status: [x] skimmed  [x] read in full  [x] verified claim in source

[S7] "Article 17 — Right to erasure ('right to be forgotten')" — Regulation (EU) 2016/679 (General Data Protection Regulation), Official Journal of the European Union, L 119, 2016-05-04. Mirrored at https://gdpr-info.eu/art-17-gdpr/. Accessed 2026-04-26.
    Used to support: §3.3 and §4.4 references to the GDPR right-to-erasure obligation that conflicts with on-chain immutability. Article 17(1) grants data subjects the right to obtain erasure of personal data without undue delay under enumerated grounds; Article 17(2) extends this to public-controller obligations to take "reasonable steps" to inform downstream controllers — directly relevant to the §4.4 argument that anchoring publicly-and-immutably commits to the existence of *something* about an identifiable VIN.
    Read status: [x] skimmed  [x] read in full  [x] verified claim in source

---

## Change log

- 2026-04-15: File created as part of the Problem 1 narrowing. Scaffold only;
  no sources confirmed yet. `[CC]` — tagging scheme proposed by Claude,
  accepted by Mitch.
- 2026-04-26: Added confirmed entries [S4] (Carfax pricing), [S5] (NHTSA
  odometer-fraud incidence + cost), [S6] (EAS docs), [S7] (GDPR Article 17).
  Removed the corresponding `[S?:carfax-pricing]`, `[S?:vehicle-fraud-cost]`,
  `[S?:eas]`, `[S?:gdpr-erasure]` placeholders. Also removed `[S?:carfax-
  market-share]`, `[S?:carfax-antitrust]`, `[S?:base-l2]`, `[S?:base-sepolia]`,
  `[S?:keccak256]`, `[S?:nhtsa-vpic]` from the placeholder list because they
  are already covered by [S1], [S2], [S3] respectively (or, for nhtsa-vpic,
  unused in the final whitepaper). Added new placeholders explicitly listed
  in `whitepaper.md` so the placeholder list reflects current state.
