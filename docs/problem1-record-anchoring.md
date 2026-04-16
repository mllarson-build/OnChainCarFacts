# OnChainCarFacts — Problem 1: Record Anchoring

**Status:** Narrowed proposal. Supersedes `project-proposal-short.md` for the
remainder of the class project. The original proposals are preserved as
historical artifacts.

**Scope change rationale:** Feedback from Ariel (2026-04-15) flagged that the
original proposal bundled six hard problems — anchoring, contributor
attestation, reputation, privacy law, fraud detection, and UX — and asked us
to pick one. We chose **record anchoring** (Problem 1 in the feedback).

**Attribution:** Every non-trivial external claim in this document is tagged
per the convention in `SOURCES.md`. `[S#]` = sourced, `[S?:tag]` = citation
still needed, `[CC]` = co-developed with Claude, `[OWN]` = my own analysis.

---

## 1. Research question

Does on-chain hash anchoring of vehicle-history records provide a meaningful
improvement over a trusted centralized timestamp for the specific property of
**proving that a given record existed in a given form at a given time**?
`[OWN]`

This reframes the project from "replace Carfax" to "evaluate one narrow
mechanism." It is a question we can answer with a working demo and a
cost/threat analysis, not a company pitch. `[OWN]`

## 2. What "record anchoring" means here

A vehicle-history record is a small, structured object — at minimum:
VIN, event type, location, mileage, contributor identifier, timestamp, and a
free-text detail field. `[OWN]`

Anchoring means: we compute a deterministic hash of the canonical
serialization of that record and store the hash on a public blockchain. The
record itself lives off-chain (database, file, printable PDF). Anyone with the
record can later re-compute the hash and check it against the on-chain
anchor. `[OWN]`

The analog is certificate transparency: CAs publish cryptographic commitments
to issued certificates in append-only logs so that misissuance is detectable
after the fact. We are doing the same thing for vehicle-history entries.
`[S?:certificate-transparency]` `[CC]` (Claude surfaced the CT analogy; I
accepted it.)

## 3. In scope

1. **Canonical serialization.** A rule set that produces the same byte string
   on every platform for a given logical record, so the hash is reproducible
   by any verifier. `[OWN]`
2. **Hash function choice.** keccak256, matching the hash used natively by
   Ethereum contracts so the contract can verify hashes computed off-chain.
   `[S?:keccak256]`
3. **Anchor contract.** A minimal Solidity contract that accepts a hash (or a
   Merkle root of a batch of hashes) and records the block timestamp, emitting
   an event. No access control beyond "anyone can anchor" in v1. `[OWN]`
4. **Batching via Merkle roots.** To amortize gas cost, batch N records into
   one Merkle root per on-chain transaction. `[S?:merkle-tree]`
5. **Verification UX.** A small web UI that takes a record (or VIN), fetches
   the anchor, and reports: anchored / not anchored / anchored but record
   mismatch. `[OWN]`
6. **Threat model.** What anchoring proves, what it does *not* prove, and
   which attacks remain. (See §6.) `[OWN]`
7. **Cost analysis.** Measured gas cost per record on Base Sepolia, projected
   to Base mainnet, as a function of batch size. `[S?:base-l2]`
   `[S?:base-sepolia]`

## 4. Explicitly out of scope (acknowledged, not solved)

These remain real problems in the broader vision but are **not** what this
project evaluates. We will mention them in the final write-up as future work.
`[OWN]`

- Contributor attestation (who is allowed to submit records, and why anyone
  should trust their submissions).
- Reputation / EAS integration.
- Privacy under GDPR / DPPA (right-to-erasure tension with immutable anchors).
- Fraud-pattern detection (odometer rollback, title washing, ghost vehicles).
- Contributor incentives / economics / tokens / credits.
- Business model, entity structure, competitive positioning against Carfax.
- Consumer UX polish beyond what the verification demo requires.

We are explicitly *not* claiming that solving anchoring solves vehicle history.
Anchoring is necessary for tamper-evidence; it is not sufficient for "useful
vehicle history." Ariel's feedback was explicit on this, and we agree. `[OWN]`

## 5. What blockchain adds (the thing we are actually testing)

A trusted centralized timestamp service (e.g., an RFC 3161 TSA, or a Carfax
internal log) can also prove "this record existed in this form at this time"
— **if** you trust the operator not to backdate, rewrite, or lose the log.
`[OWN]`

On-chain anchoring replaces that trust assumption with a different one: you
must trust that the L1 (Ethereum) remains live and censorship-resistant, and
in the case of an L2, that the L2's data availability and settlement
guarantees hold. `[S?:l2-rollup-concept]` `[CC]`

The concrete test for Problem 1 is: **given a realistic adversary who controls
the database operator but not the L1**, does on-chain anchoring detect the
tampering that a centralized log would miss? We will demonstrate this in the
final write-up with a worked scenario. `[OWN]`

## 6. Threat model (what anchoring does and does not prove)

**Anchoring proves:**
- A record with exactly this byte content existed no later than block *B*'s
  timestamp. `[OWN]`
- A later version of the record with different content is a *different*
  record; the original hash will not match it. `[OWN]`

**Anchoring does not prove:**
- That the record is *true*. Garbage in, anchored garbage out. `[OWN]`
- That the submitter is who they claim to be. (That's Problem 2 — attestation
  — which we are *not* solving.) `[OWN]`
- That the record is *complete*. A dishonest actor can simply omit an event
  and anchor only the ones they like. `[OWN]`
- That the record existed *before* it was anchored. Only that it existed by
  the anchoring time. `[OWN]`

Making this list explicit is, in my view, the most useful output of the
project: it separates the narrow property blockchain actually provides from
the broader properties that marketing around "immutable vehicle history"
tends to conflate. `[OWN]`

## 7. Technical choices and what needs citation

| Choice | Why | Citation needed? |
|---|---|---|
| Solidity smart contract on an EVM chain | Class-covered baseline. | No `[OWN]` |
| keccak256 as the hash function | Matches Ethereum native hash; usable inside the contract for verification. | Yes `[S?:keccak256]` |
| Deploy on Base Sepolia for the demo | Free testnet ETH; same EVM as mainnet. | Yes `[S?:base-sepolia]` |
| Base L2 (not L1 Ethereum) for eventual production | Gas cost per anchor is orders of magnitude lower on an L2 rollup. | Yes `[S?:base-l2]` `[S?:l2-rollup-concept]` |
| Merkle-root batching | Amortizes gas across many records per transaction. | Yes `[S?:merkle-tree]` |
| Certificate-transparency-style append-only log as conceptual model | Prior art for "commit to a record now, verify later." | Yes `[S?:certificate-transparency]` |

Everything in the left column marked "No" is class material and does not need
a source. Everything marked "Yes" is beyond what the class covered, and the
corresponding source must appear in `SOURCES.md` before final submission.
`[OWN]`

## 8. Deliverables

1. A deployed `RecordAnchor` contract on Base Sepolia. `[OWN]`
2. A small CLI or web tool that: takes a record → canonicalizes → hashes →
   anchors (single or batched) → later verifies. `[OWN]`
3. A written threat-model + cost analysis (this document, extended). `[OWN]`
4. A final write-up answering the research question in §1 with evidence from
   the demo and the threat model. `[OWN]`
5. A complete `SOURCES.md` with every `[S?]` replaced by a real `[S#]`. `[OWN]`

## 9. Open questions (for the next working session)

- Do we want a single `anchor(bytes32)` call, or a `anchorBatch(bytes32[])`
  that emits one event per hash, or a `anchorRoot(bytes32)` that commits to a
  Merkle root and requires a proof at verify time? The third is cheapest but
  adds client-side proof construction. Decide before writing the contract.
  `[OWN]`
- Do we anchor on Base Sepolia only, or also show an Ethereum Sepolia
  deployment to make the L1-vs-L2 cost comparison concrete? `[OWN]`
- How much of the existing `phase0/` React code stays? Most of it was built
  for the broader product; the narrowed project only needs the verification
  view. `[OWN]`

---

## Change log

- 2026-04-15: Created as the narrowed Problem 1 proposal in response to
  Ariel's feedback. `[CC]` structure and first draft proposed by Claude,
  reviewed and edited by Mitch.
