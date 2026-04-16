# Video Presentation Outline — OnChainCarFacts (Problem 1)

**Due:** 2026-04-22
**Status:** Draft outline. Mitch to confirm assignment length and format.

**Goal:** Convey to the class, in the allotted time, (a) what problem we
are solving, (b) why it is worth solving at this narrowed scope, and
(c) what design decisions and tradeoffs we made. Not a product pitch.
A class research update.

Attribution tags inline so the script writing shows provenance from the
start. Every `[S?]` must become `[S#]` before recording.

---

## Narrative arc (7 beats)

### 1. Narrowing to a subproblem (≈45 sec)

The class has seen the original proposal, so this beat is brief:

- Original scope bundled six hard problems. Feedback (2026-04-15) asked
  us to pick one and go deep.
- We picked **record anchoring** — the foundational layer: proving a
  vehicle-history record existed in a given form at a given time,
  without depending on the record's original custodian remaining alive
  or cooperative. `[OWN]`
- Frame explicitly: this is a **subproblem of the original protocol**,
  not a replacement for the ambition. The rest of the video argues why
  it is the right subproblem to solve first.

**Why lead with this:** the class already knows the big picture;
spending time there wastes the clip. Lead with "here's the piece we
cut out and why."

### 2. The research question (≈30 sec)

> Does on-chain hash anchoring of vehicle-history records meaningfully
> improve the ability to prove a record existed in a given form at a
> given time, compared to a trusted centralized timestamp?

Emphasize: this is an analytical question with a yes/no/qualified-yes
answer, not "can we build a better Carfax." `[OWN]`

### 3. How anchoring works, in 3 slides (≈1.5 min)

1. **The record.** Fields: VIN, event type, location, mileage, timestamp,
   contributor address, and a few housekeeping fields (schema version,
   record ID, previous-record link). `[CC]` (schema fields derived from
   a review of NMVTIS and MOBI VID — see `docs/schema-review-memo.md`).
2. **The hash.** Canonicalize the record to a deterministic byte string,
   run keccak256, get a 32-byte commitment. `[S?:keccak256]`
3. **The anchor.** A minimal Solidity contract on Base Sepolia stores
   the hash and records the block timestamp. Later, anyone with the
   record can re-hash and compare. Visual: a real Basescan transaction
   we already deployed. `[S?:base-sepolia]`

### 4. Design decision — contract shape (≈1 min)

Briefly cover the three options (single, batch, Merkle root) and the
verdict: build 1 + 3, skip 2. Show the comparison table from the anchor
review doc. Key point: **Option 2 doesn't teach anything the other two
don't.** `[OWN]`

### 5. Design decision — L1 vs L2 (≈1 min)

Show the cost table. Two points:

- On Ethereum L1, Merkle-root batching isn't a design choice, it's
  forced by gas cost.
- On L2, both options are cheap enough that we can pick the simpler
  design. **The real value of L2 is that it unlocks simpler designs, not
  just that it's cheaper.** `[CC] [OWN]`

Flag explicitly: the numbers shown are ballpark; measured numbers from
our own Sepolia/Base Sepolia deployments will be in the final report.
`[OWN]` — the syllabus requires honesty about what is measured vs.
estimated.

### 6. The threat model — the payoff slide (≈1.5 min)

This is the most important slide. It separates what blockchain
**actually** provides from what "immutable vehicle history" marketing
tends to claim.

**Anchoring proves:**

- A record with exactly this content existed no later than block B's
  timestamp.
- A modified record has a different hash and will not match the anchor.

**Anchoring does NOT prove:**

- That the record is *true*.
- That the submitter is who they claim to be (attestation — out of scope).
- That the record is *complete* (omissions are undetectable).
- That the record existed *before* it was anchored.

Closing point: anchoring is a **necessary** but not sufficient building
block for useful vehicle history. Calling a tamper-proof database
"tamper-proof history" conflates storage integrity with data integrity.
That distinction is the research contribution of this narrowed
project. `[OWN]`

### 7. Anchoring as a primitive for the larger protocol (≈1 min)

This is the beat that reconciles the narrowing with the original
ambition. Reference `problem1-solution-tradeoffs.md` §6.

The original protocol decomposes into five primitives: anchoring,
attestation, reputation, privacy, fraud detection. Every one of the
other four **depends on** anchoring — if records can be silently
rewritten after the fact, none of the higher-level primitives work.

So the narrowed project is:
- A complete solution to the foundation layer.
- An explicit map of the four problems it does **not** solve, each
  named as the subject of a separate future project.

This reframes "we cut scope" as "we built the thing the rest of the
protocol would have to inherit from anyway." `[OWN]`

---

## Visual assets needed

- Slide: original scope → feedback → narrowed scope (1 slide)
- Slide: record → hash → anchor diagram (1 slide)
- Slide: contract shape comparison table (from anchor review docx)
- Slide: L1 vs L2 cost table (from anchor review docx)
- Slide: threat model two-column "proves / does not prove" (1 slide)
- Screen capture: real anchored transaction on Basescan (1 clip,
  ≈15 sec)
- Screen capture: verification web UI shell with a pasted record
  producing ANCHORED / NOT ANCHORED / HASH MISMATCH states (1 clip, ≈20
  sec)

## Script discipline

- Every factual claim in the script is tagged `[S#]`, `[S?]`, `[CC]`, or
  `[OWN]` in the script draft. Before recording, every `[S?]` becomes a
  real `[S#]` or the claim is cut. This is the syllabus rule — do not
  relax it for the video.
- Numbers stated on screen must be either measured (from our
  deployments) or labeled ballpark on the slide itself.

## Questions for Mitch

1. Required length? (Affects beat pacing above.)
2. Format — screen recording, slides-only, or talking-head + slides?
3. Submission channel and format (MP4? link?)
4. Can we assume the class has seen the original proposal, or does beat
   1 need more setup?

---

## Change log

- 2026-04-15: Initial outline. `[CC]` structure proposed by Claude in
  response to the compressed timeline.
