# OnChainCarFacts — Problem 1 Build Plan (Compressed)

**Status:** Revised 2026-04-15. Timeline compressed to match two real
deadlines:

- **2026-04-22 — Video presentation deliverable** (one week from today).
  Must clearly communicate: the narrowed problem, why it matters, the
  design decisions we made, and the tradeoffs.
- **2026-04-29 — Final project deliverable** (two weeks from today).
  Working demo + written report + completed sources.

This plan supersedes the earlier 4-week draft. Several milestones have
been shortened; none have been cut.

**Ratified decisions (unchanged):**

1. Contract shape: Option 1 (`anchor(bytes32)`) and Option 3
   (`anchorRoot(bytes32)` with Merkle proofs). Skip Option 2.
2. Deploy same contract to Ethereum Sepolia and Base Sepolia.
3. Phase 0 NHTSA app is untouched; anchoring work lives in `anchor/`.

**New decisions (from this session):**

4. Framework: Hardhat + TypeScript.
5. Demo UI: minimal web UI (not CLI) — easier to share with classmates
   for review.
6. Schema: expanded per the schema review memo
   (`docs/schema-review-memo.md`). See §"Locked schema" below.

Attribution: `[S#]` / `[S?:tag]` / `[CC]` / `[OWN]` per `SOURCES.md`.

---

## Goal and non-goals (unchanged)

Same as the prior draft: answer the Problem 1 research question with a
working demo, measured cost data, and a threat model. No attestation,
reputation, privacy, fraud detection, or mainnet deployment.

## Tech stack

| Layer | Choice |
|---|---|
| Contract framework | Hardhat + TypeScript. `[CC]` `[S?:hardhat]` |
| Language | Solidity ^0.8.24 |
| Chains | Ethereum Sepolia, Base Sepolia. `[S?:base-sepolia]` |
| Hash | keccak256. `[S?:keccak256]` |
| Merkle | OpenZeppelin `MerkleProof` on chain + `merkletreejs` (or OZ StandardMerkleTree) off chain. `[S?:oz-merkle-proof]` |
| Web UI | Vite + React, separate app in `anchor/web/`. Uses viem or ethers for read-only chain queries. |
| Off-chain client | Node.js + TypeScript |
| Tests | Hardhat + Chai |

## Locked schema (v1.0)

Pending Mitch's explicit sign-off on the schema review memo. Proposed
canonical schema for anchoring:

```ts
{
  schemaVersion: "1.0",        // string, literal for now
  recordId: string,            // UUID v4 generated at record creation
  vin: string,                 // 17 chars, ISO 3779 validated
  eventType: enum,             // title_transfer | odometer_reading | service
                               //  | accident | total_loss | salvage | junk | inspection
  location: {
    countryCode: string,       // ISO 3166-1 alpha-2
    adminArea: string,         // state/province
    postalCode?: string
  },
  mileage: integer,
  odometerUnit: "mi" | "km",
  timestamp: string,           // ISO 8601 with TZ offset — event time
  recordCreatedAt: string,     // ISO 8601 with TZ offset — authoring time
  contributorAddress: string,  // 0x... Ethereum address; contract enforces msg.sender == contributorAddress
  previousRecordHash: string | null,  // bytes32 hex or null for first record per VIN
  sourceIdentifier: string     // opaque; invoice #, report #, etc.
}
```

`details` field **dropped** per the memo — free text inside a hashed
record causes typo-driven re-anchoring. If we need `service` details, add
a typed `serviceDetails: { serviceType, partsReplaced[] }` subobject in
v1.1, not v1.0. `[OWN]`

## Milestones (compressed)

Every milestone keeps its acceptance test — the bar for "done" does not
move, only the time budget.

### M0 — Video presentation (due 2026-04-22)

Dedicated milestone for the week-1 deliverable. Content sketch lives in
`docs/video-presentation-outline.md`. Target length: whatever the
assignment requires (Mitch to confirm).

**The video must cover:**

1. The original proposal and the feedback that narrowed it (scope
   honesty — Ariel's point).
2. The research question: does on-chain hash anchoring meaningfully
   improve proof-of-existence-at-time vs. a centralized timestamp?
3. The three contract-shape options and why we chose 1 + 3.
4. The L1 vs L2 cost comparison (with explicit "ballpark, measured
   numbers coming in the final report").
5. The threat model — what anchoring proves and what it doesn't. This is
   the payoff slide: separating the narrow blockchain property from the
   broader "immutable vehicle history" marketing.
6. What remains open and why (attestation, reputation, privacy — named
   as future work, not solved).

**Acceptance:** Video recorded, edited, under the time limit, submitted.
Every external claim in the narration traces to a source in
`SOURCES.md` or a `[CC]`/`[OWN]` tag in the script.

### M1 — Scaffold (½ day, by 2026-04-16)

- Initialize `anchor/` with Hardhat + TypeScript.
- `.env.example` with `SEPOLIA_RPC_URL`, `BASE_SEPOLIA_RPC_URL`,
  `DEPLOYER_PRIVATE_KEY`, `ETHERSCAN_API_KEY`, `BASESCAN_API_KEY`.
- `.gitignore` for `node_modules`, `.env`, `anchor/data/measurements/`.

**Acceptance:** `npx hardhat compile` succeeds on a stub contract.

### M2 — Canonicalization + hash parity (1–2 days, by 2026-04-18)

- `canonicalize.ts` produces deterministic bytes from a v1.0 record.
  Exact rule: `abi.encode` with fixed field order matching the schema
  above, nested `location` flattened as three concatenated fields.
- `hash.ts` wraps keccak256.
- Solidity `RecordAnchor.canonicalHash(...)` with identical output.

**Acceptance:** 20-record test corpus hashes identically in JS and in
Solidity. Any divergence fails the test loud.

**Risk:** This is still the hardest correctness problem and now has 2
days instead of a full week. If it slips past 2026-04-18, flag
immediately — it cascades into everything else.

### M3 — `RecordAnchor.sol` v1 (1 day, by 2026-04-19)

- `anchor(bytes32)`, `anchorRoot(bytes32)`, `verifyLeaf(...)`,
  `getAnchor(...)`, `getRoot(...)` per the prior draft.
- Contract enforces `msg.sender` tracking so `contributorAddress` in the
  record is structural, not reputational. `[OWN]`
- Duplicate anchor reverts (keep the first-writer-wins decision).

**Acceptance:** Unit tests from prior draft all pass. Gas usage printed.

### M5a — Deploy to Base Sepolia only (½ day, by 2026-04-20)

**Split from original M5:** get one chain deployed before the video so
the presentation can show a real transaction on a block explorer. The
Ethereum Sepolia deployment moves to week 2.

**Acceptance:** `RecordAnchor` deployed on Base Sepolia, source-verified
on Basescan, address committed to `anchor/deployments.json`, one real
anchor transaction visible on the explorer.

### Video production (1–2 days, by 2026-04-22)

- Script from `docs/video-presentation-outline.md`.
- Slides + recorded screen demo showing: the verification web UI
  (shell), the Base Sepolia transaction, the cost comparison table (with
  ballpark numbers marked as such).
- Record, edit, submit.

### M4 — Merkle tree tooling (1 day, by 2026-04-24)

Same as prior draft. Off-chain build/proof matching OZ on-chain verifier.

**Acceptance:** 100 randomized trees, every leaf's proof verifies on
chain; tampered proofs fail.

### M5b — Ethereum Sepolia deployment (½ day, by 2026-04-24)

Second chain. Source-verified on Etherscan.

### M6 — Cost measurement (1 day, by 2026-04-25)

Same as prior draft. 100 records, both chains, three scenarios.

**Acceptance:** Measured JSON files + summary table. Every dollar figure
sourced to a cited gas price × ETH price.

### M7 — Minimal web UI (1.5 days, by 2026-04-27)

Single-page Vite/React app in `anchor/web/`:

- Paste-in or upload a record JSON → canonicalize → hash → query chain →
  show status (ANCHORED / NOT ANCHORED / HASH MISMATCH).
- Secondary flow: paste Merkle root + proof → verify.
- Deployed to Vercel or a static host so classmates can try it.

**Acceptance:** Against the records anchored in M6, the UI reports
ANCHORED for originals and NOT ANCHORED for a record with one edited
digit. A classmate can open the URL and repeat the test unaided.

### M8 — Threat model + write-up + sources (2–3 days, parallel; by 2026-04-29)

- Expand §6 of `problem1-record-anchoring.md` with evidence from M6.
- Fill every `[S?]` in `SOURCES.md` with a real `[S#]`, read-in-full.
- Final report answers the research question with measured evidence.

**Acceptance:** Zero `[S?]` markers remain. Submission-ready.

## Compressed timeline at a glance

| Date | Milestone | Type |
|---|---|---|
| 2026-04-16 | M1 scaffold | Build |
| 2026-04-17 – 18 | M2 canonicalization + hash parity | Build (critical path) |
| 2026-04-19 | M3 contract | Build |
| 2026-04-20 | M5a Base Sepolia deploy | Build |
| 2026-04-20 – 22 | Video script, record, submit | **Deliverable** |
| 2026-04-22 | **Video due** | — |
| 2026-04-23 – 24 | M4 Merkle + M5b Eth Sepolia | Build |
| 2026-04-25 | M6 cost measurement | Build + evidence |
| 2026-04-26 – 27 | M7 web UI | Build |
| 2026-04-26 – 29 | M8 write-up + sources (parallel) | Writing |
| 2026-04-29 | **Final project due** | — |

## Risk register

| Risk | Mitigation |
|---|---|
| M2 hash-parity bug takes > 2 days | Strip schema back to a minimal v0.9 (vin + eventType + timestamp + contributorAddress only) for the video, expand to full v1.0 in week 2. `[OWN]` |
| Faucet unavailability on either testnet | Keep a backup funded wallet; note in video that numbers are from real deployments. `[OWN]` |
| Web UI eats more than 1.5 days | Ship with read-only verification only (no UI for creating records — records can be entered as JSON). `[OWN]` |
| Source-gathering eats M8 time | Start filling `[S?]` entries on 2026-04-16 in parallel with M1, not at the end. `[OWN]` |
| Schema scope creep during M2 | Lock schema v1.0 above before M2 starts; any change triggers the v0.9 fallback. `[OWN]` |

## Status of prerequisites

1. **Schema sign-off — DONE (2026-04-15).** Mitch accepted schema v1.0
   as specified above. Any change from here triggers a change-log
   entry.
2. **Video assignment specifics** — Mitch will confirm length / format /
   submission channel later. Does not block M1.
3. **Class context for the video** — confirmed that the class has seen
   the original proposal; the video can lead with "narrowing to a
   subproblem of the overarching project" rather than re-introducing
   the whole problem space. `video-presentation-outline.md` reflects
   this.

---

## Change log

- 2026-04-15 (schema sign-off + framing update): Mitch signed off on
  schema v1.0; confirmed class has seen the original proposal so the
  video can lead with narrowing rather than full context; solution-
  tradeoff analysis (`problem1-solution-tradeoffs.md`) now positioned
  as the intellectual core of the submission, with the demo as
  supporting evidence.
- 2026-04-15 (revision): Compressed 4-week plan to 2 weeks with a week-1
  video deliverable. Added M0 video milestone. Split M5 into M5a
  (pre-video) and M5b (post-video). Locked schema v1.0 from schema
  review memo. Added risk register. `[CC]` structure proposed by Claude.
- 2026-04-15 (initial): First draft.
