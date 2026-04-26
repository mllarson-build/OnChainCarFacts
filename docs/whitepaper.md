# OnChainCarFacts: On-Chain Record Anchoring for Vehicle History

**Final Whitepaper — Blockchain Use Case Evaluation**
**Author:** Mitch Larson
**Date:** 2026-04-29
**Code:** `anchor/` (Hardhat + Solidity), `anchor/verifier/` (static verifier UI)
**Deployed contract:** `RecordAnchor` at `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF` on Base Sepolia (chain id 84532).

**Attribution convention.** Every non-trivial external claim is tagged per
`docs/SOURCES.md`: `[S#]` = sourced, `[S?:tag]` = citation still needed,
`[CC]` = co-developed with Claude, `[OWN]` = my own analysis. Sources tagged
`[S?]` are claims drawn from public industry knowledge that were not yet
verified to a specific reference at submission time; they are preserved as
`[S?]` rather than papered over with invented citations, per the syllabus rule
that students must be able to defend any source they cite.

---

## 1. The economic problem

Used-vehicle transactions are an information-asymmetry market. A seller knows
more about the vehicle than the buyer, and that gap is monetised by an
intermediary industry that sells vehicle-history reports. In the US, that
market is dominated by Carfax, which holds roughly 90% share through
exclusive agreements with major listing platforms and certified-pre-owned
programs `[S1]`. A single consumer report retails at
\$40+ `[S?:carfax-pricing]`. Annual US vehicle fraud — odometer rollback,
title washing, undisclosed accidents, cross-jurisdiction laundering — is
estimated in the single-digit billions of dollars per year
`[S?:vehicle-fraud-cost]`, with roughly 450,000 odometer-rollback vehicles
alone per year per NHTSA `[S?:vehicle-fraud-cost]`.

The deeper issue is not price. It is that the *integrity* of the underlying
record depends on one private company remaining solvent, honest, and
cooperative forever. Records can be amended, withheld, or simply lost.
Cross-border data is incomplete: a vehicle's history in Mexico does not
appear in a US Carfax report. A \$50M antitrust class action by 120+ dealers
`[S1]` underscores the rent-extraction concern. The
intellectual problem is structural: **vehicle provenance is a coordination
good that has been privatised, and its integrity is only as good as a single
operator's continued cooperation.** `[OWN]`

### 1.1 The narrowed question this paper actually answers

An earlier iteration of this project proposed a full open vehicle-history
protocol: free reads, community contribution, on-chain anchoring, tokenless
reputation, fraud detection, privacy handling. Feedback from Prof. Ariel
Zetlin-Jones (2026-04-15) flagged that the proposal bundled six hard
problems. On his advice, I narrowed the project to **Problem 1: record
anchoring** — the foundation layer. The rest of this paper evaluates that
one mechanism honestly.

> **Research question.** Given a vehicle-history record *R*, produce at time
> *T₀* a commitment such that, at any later time *T₁*, any party holding *R*
> can verify that *R* existed in exactly this form by *T₀*, **without
> requiring the cooperation of any single entity that existed at T₀.** Call
> this property *P*. Does on-chain hash anchoring deliver property *P*
> better than the alternatives? `[OWN]`

Property *P* is *necessary but not sufficient* for useful vehicle history.
Attestation (who submitted), reputation (should we believe them),
completeness (are all events present), and privacy (GDPR/DPPA) are
separable problems and explicitly out of scope. Stating that boundary
clearly is, in my view, the research contribution here — separating what
blockchain *actually* provides from what "immutable vehicle history"
marketing conflates it with.

## 2. How this is addressed today (non-blockchain)

Six solution families deliver some version of property *P*. Listed roughly
in order of how many parties must be trusted. `[OWN]`

1. **Single trusted operator (Carfax, AutoCheck, DMS vendors).** Content and
   time binding, no operator independence. If the operator is compromised,
   acquired, bankrupt, or changes terms, verification is conditional on the
   new operator's cooperation `[OWN]`.
2. **RFC 3161 Trusted Timestamp Authority, with RFC 4998 (ERS) re-
   timestamping** `[S?:rfc-3161]` `[S?:rfc-4998]`. Signed-hash tokens,
   portable, with periodic re-timestamping to survive algorithm or
   certificate expiry. Stronger than people assume — the weakness is that
   the TSA operator is still identifiable, coercible, and can cease to
   exist; every ERS round re-enters that trust assumption with whichever
   TSA is then available `[CC]`.
3. **Federated database (NMVTIS-style).** Multiple reporting entities with
   regulatory oversight `[S?:nmvtis]`. No single operator can unilaterally
   rewrite, but the federation as a whole can, and access is gated by
   policy rather than public by default.
4. **Certificate Transparency-style log** (RFC 6962 family)
   `[S?:certificate-transparency]`. Append-only log of cryptographic
   commitments with inclusion and consistency proofs, watched by
   independent monitors. Strong on paper; in practice, monitor ecosystems
   have historically been patchier than the RFC implies, and argument
   strength depends on naming who the monitors actually are.
5. **Permissioned blockchain (consortium chain).** Fixed validator set
   drawn from known participants `[S?:permissioned-chain]`. For property
   *P* alone this is strictly worse than CT: same small-operator trust
   assumption, more operational overhead, no independent monitor ecosystem.
   It is a centralised system in blockchain vocabulary `[OWN]`.
6. **Public permissionless blockchain anchoring, two variants:**
   - **Smart-contract anchoring on an EVM chain** (Ethereum L1 or an L2
     rollup such as Base) `[S?:l2-rollup-concept]` `[S2]`. Store
     hashes in a contract; anyone can verify by reading chain state.
   - **Publication-based anchoring (OpenTimestamps family)**
     `[S?:opentimestamps]`. Aggregator servers commit a Merkle root of
     thousands of hashes to a permissionless chain (historically Bitcoin);
     clients hold a Merkle inclusion proof that verifies locally against
     the on-chain root.

### 2.1 Comparison against property *P*

| Solution | Content binding | Time binding | Operator independence | Per-record cost | Trust assumption |
|---|---|---|---|---|---|
| Single operator (Carfax) | ✓ | ✓ | ✗ | ~\$0 marginal | Operator honest, solvent, cooperative forever |
| RFC 3161 TSA (+ ERS) | ✓ | ✓ | ◐ | cents | TSA + cert chain valid at verify time; ERS extends |
| Federated DB (NMVTIS) | ✓ | ✓ | ◐ | low | Federation integrity + oversight body stable |
| CT-style log | ✓ | ✓ | ✓ (theory) / ◐ (practice) | low | ≥1 honest monitor *actually* watches |
| Permissioned chain | ✓ | ✓ | ◐ | low | Consortium majority honest |
| EVM smart contract (L1/L2) | ✓ | ✓ | ✓✓ | cents (L2) to dollars (L1) | L1 liveness + (L2) rollup DA/settlement |
| OpenTimestamps family | ✓ | ✓ | ✓✓ | ~free (aggregated) | L1 liveness; aggregator is convenience, not trust |

Legend: ✓✓ strong, ✓ yes, ◐ partial/conditional, ✗ no. `[OWN]`

The matrix collapses to a three-way comparison among CT, OpenTimestamps-
family (OTS), and EVM smart-contract anchoring. An earlier draft framed
this as CT vs. EVM; that was a false dichotomy — the OTS family is a
distinct, genuinely strong alternative that any argument for EVM anchoring
must clear `[OWN]`.

## 3. Blockchain approach — what we built

### 3.1 Architecture

The deployed system is deliberately minimal. It exists to make the narrow
property *P* concrete, not to ship a product.

1. **Record schema v1.0.** A vehicle-history record is a structured JSON
   object: `schemaVersion`, `recordId` (UUIDv4), `vin` (ISO 3779), one of
   eight event types (`title_transfer`, `odometer_reading`, `service`,
   `accident`, `total_loss`, `salvage`, `junk`, `inspection`),
   `location` (ISO 3166-1 country + admin area + optional postal code),
   `mileage` + `odometerUnit`, event `timestamp`, `recordCreatedAt`,
   `contributorAddress`, `previousRecordHash` (null or bytes32), and
   `sourceIdentifier`. A free-text `details` field was explicitly dropped:
   typo-driven re-anchoring is a predictable failure mode and anything
   genuinely useful can be expressed in a typed sub-object later `[OWN]`.
2. **Canonicalization.** `anchor/src/canonicalize.ts` produces a
   deterministic byte string for a given record by `abi.encode` with a
   fixed field order matching the schema. The nested `location` is
   flattened to three positional fields. Event type is encoded as a
   `uint8` index over a fixed enum list. `previousRecordHash = null` is
   encoded as `bytes32(0)`.
3. **Hash.** `keccak256` of the canonicalization `[S3]`. Chosen
   because it is the hash Ethereum uses natively, so the contract can
   verify off-chain-computed hashes without an extra library.
4. **Contract.** `anchor/contracts/RecordAnchor.sol` exposes:
   - `anchor(bytes32 hash)` — single-hash anchoring (Option 1).
   - `anchorRoot(bytes32 root)` — anchors a Merkle root of a batch
     (Option 3), with `verifyLeaf(leaf, root, proof[])` for inclusion
     proofs using OpenZeppelin's `MerkleProof` `[S?:oz-merkle-proof]`.
   - `canonicalHash(...)` — on-chain re-computation of the canonical hash
     over schema fields, used solely for hash-parity tests against the
     TypeScript canonicalizer.
   Duplicate anchors revert (first-writer-wins). There is no access
   control — anyone can anchor anything. That is intentional: anchoring
   binds content and time, not identity. Who submitted is an attestation
   concern.
5. **Deployment.** Base Sepolia, contract verified on Basescan,
   deployment record in `anchor/deployments.json` with block number, gas
   used, and deployer address. Base Sepolia was chosen for free testnet
   ETH and EVM parity with mainnet `[S2]`.
6. **Verifier UI.** `anchor/verifier/index.html` is a zero-dependency
   static page that canonicalizes a pasted record, computes its hash in
   the browser, calls `getAnchor(hash)` on the deployed contract over a
   public RPC, and reports `ANCHORED` / `NOT ANCHORED` / `HASH MISMATCH`.
   A "Tamper" button demonstrates the content-binding property visually:
   flipping one digit of the record flips the status.

### 3.2 Why EVM smart contract rather than OTS

On property *P* in isolation, EVM smart-contract anchoring and
publication-based anchoring (OTS family) are very close. OTS is cheaper
(aggregation amortises one on-chain transaction over thousands of
hashes), has a longer operational track record via Bitcoin, and has no
smart-contract attack surface. `[OWN]`

The honest argument for EVM anchoring **for property *P* alone** is narrow:

- **Tighter time binding.** EVM anchoring commits directly in a block;
  OTS aggregation introduces a delay (minutes-to-hours) during which the
  client holds only an aggregator receipt.
- **Self-contained verification.** EVM verification needs only the chain
  and the record. OTS verification needs the chain, the record, *and*
  the Merkle path the aggregator issued — a portable but extra artifact.

If property *P* were the only consideration, a fair write-up would
probably recommend the OTS family. The project lands on EVM because of
*composability with the four out-of-scope primitives* (attestation,
reputation, privacy, fraud detection), which is a property of the larger
protocol, not of anchoring in isolation. Stating that plainly is
cheaper than dressing up a substrate choice in property-*P* language
`[OWN]`.

### 3.3 Required infrastructure

What the demo relies on today:

- **Base Sepolia testnet** (Coinbase rollup) `[S2]`. An Ethereum
  L2 provides sub-cent per-record cost in the amortised case; Base
  Sepolia provides free testnet ETH.
- **Public RPC** (`https://sepolia.base.org`) for the verifier UI.
- **OpenZeppelin MerkleProof** for on-chain inclusion proofs.
- **Hardhat + TypeScript** for the development environment.

What a production deployment would additionally require (noted here but
not solved): an attestation layer (on-chain attestations such as EAS
`[S?:eas]`, verifiable credentials, or domain registries) to bind
records to identities; a privacy layer (hashed field commitments,
Merkle revelation, or ZK proofs over canonicalised records) to reconcile
on-chain immutability with GDPR Article 17 `[S?:gdpr-erasure]`; cross-
jurisdiction data-ingest partnerships; and a sustainable model for who
pays the gas at scale.

## 4. Evaluation — pros and cons

### 4.1 What this design actually proves

- **Content binding is real.** The "Tamper" demo shows any single-byte
  change to a record produces a different keccak256 and the verifier
  reports `HASH MISMATCH`. This is not an artifact of how the contract is
  written; it is a property of the hash function.
- **Time binding is real, with a caveat.** `block.timestamp` binds the
  record to a block that exists in a public chain and is observable by
  anyone. Proposer discretion over `block.timestamp` is bounded (must
  exceed parent, must be within a short future tolerance), not zero
  `[S?:ethereum-timestamp-rules]` — so the honest claim is "bound to a
  block time within seconds of wall-clock," not "unforgeable."
- **Operator independence is the actual contribution.** Verification at
  *T₁* requires only the deployed contract's code and the chain's
  liveness. It does not require the original record custodian to exist,
  cooperate, or remain honest. This is the property centralised
  alternatives (Carfax, a TSA) structurally cannot provide.

### 4.2 What this design does NOT prove

Re-stated from the threat model in `problem1-record-anchoring.md` §6
because it is the backbone of this paper's argument:

- **Not that the record is true.** Garbage in, anchored garbage out.
- **Not that the submitter is who they claim to be.** That is attestation
  (Problem 2), explicitly out of scope.
- **Not that the record is complete.** A dishonest actor can omit events
  and anchor only the ones they like. Omissions are undetectable.
- **Not that the record existed *before* it was anchored.** Only that
  it existed *by* the anchoring time. (The pre-dating attack: hold a
  record for months, then anchor it. Defending against this requires an
  independent attestation that authoring happened close to the event —
  again, attestation, out of scope.)

### 4.3 Pros of the blockchain approach (EVM smart-contract anchoring)

- **Operator independence.** No identifiable party can be coerced,
  go bankrupt, or change terms and thereby invalidate past records.
- **Censorship resistance, with qualification.** Substantially harder to
  censor than a named log operator; not impossible, because proposer-
  level censorship exists and L2 force-inclusion mechanisms vary
  by rollup and are not uniformly battle-tested `[OWN]`.
- **Composability.** An on-chain anchor commitment is directly
  referenceable by other on-chain primitives (attestation registries,
  ZK verifier contracts, access-control contracts). This is the property
  that makes EVM the right substrate for *the larger protocol*, even
  when it is close to OTS on property *P* alone.
- **Low per-record cost on L2.** Cents or fractions of a cent in the
  batched (Merkle-root) case `[S2]`.
- **No bespoke infrastructure to run.** No log servers, no monitor
  ecosystem, no TSA, no federation to stand up. Anyone with an RPC node
  or a block explorer can verify.

### 4.4 Cons of the blockchain approach

- **Honest trust assumption shift, not elimination.** Users now depend on
  Ethereum L1 liveness and, for L2s, rollup-specific data availability
  and settlement. Those assumptions are weaker (more adversarial-
  resistant) than "one company stays honest" but they are assumptions,
  not nothing.
- **Smart-contract attack surface.** Not present in OTS publication
  anchoring. Any logic written into the contract is additional code that
  can have bugs. The minimal contract here is roughly 100 lines, but any
  future composability will expand this.
- **Anchoring alone is marketing-adjacent without the other four
  primitives.** A chain of tamper-evident commitments to unattested,
  possibly-incomplete, possibly-backdated records is not "immutable
  vehicle history." It is a tamper-evident database that still inherits
  every truthfulness problem of its inputs. Calling storage integrity
  "data integrity" is exactly the conflation this paper argues against.
- **Governance of the canonicalizer.** The canonical-encoding rule and
  the event-type enum are effectively part of the trust surface.
  Changing either later without a migration plan breaks verification for
  historical records. Version pinning (`schemaVersion: "1.0"`) is in
  place; a real migration path is future work.
- **Privacy tension.** VINs linked to owners can be personal data under
  GDPR/DPPA. On-chain hashes are irreversible to PII, but the off-chain
  record is not, and anchoring it publicly-and-immutably commits to the
  existence of *something* about that VIN at that time. Reconciling
  Article 17 with a permanently observable anchor is a real open
  problem, not a documentation-only one `[S?:gdpr-erasure]`.
- **Honest positioning vs. alternatives.** For property *P* alone, OTS
  is cheaper and simpler. For property *P* alone, CT would cover most of
  the same ground without a blockchain. The EVM choice is defensible
  only by appeal to the *larger protocol*.

### 4.5 What is missing from this submission (honest disclosure)

Per the compressed build plan in `docs/problem1-build-plan.md`, the
original scope included: (a) measured gas-cost comparison between
Ethereum Sepolia and Base Sepolia across single, batched-100, and
Merkle-root scenarios (M6); (b) deployment on Ethereum Sepolia for
direct L1-vs-L2 comparison (M5b); and (c) a side-by-side OpenTimestamps
anchor of the same records as stretch evidence for §4.2's
"close-call-on-property-*P*-alone" claim. These were deprioritised in
favour of the verifier UI and the threat-model write-up, because the
intellectual core of this project is the tradeoff argument, not the
cost number. The cost figures cited in §3 and §4 therefore remain
industry-standard ballparks (`[S2]`), not measurements from
our own deployment `[OWN]`.

## 5. Anchoring as a primitive for the larger protocol

This section reconciles the narrowing with the original ambition.
Conditional on the operator-independent threat model in §1.1, the
vehicle-history protocol decomposes into five primitives:

1. **Anchoring** — this project.
2. **Attestation** — bind a record to a real-world identity via some
   credentialing layer. Must reference an anchor so the attested claim
   is pinned to an unrewritable record.
3. **Reputation / weighting** — weight attestations by contributor track
   record. A view over anchored attestations; no new substrate needed.
4. **Privacy** — selectively disclose fields while preserving anchor
   verifiability. Standard primitive family: hashed field commitments,
   Merkle revelation, ZK proofs over canonicalised records.
5. **Fraud detection** — cross-reference anchored records for
   inconsistencies (odometer rollback, title washing, geographic
   impossibility). Analytics over the anchored corpus.

Every one of 2–5 **requires** an anchor primitive of some kind under the
operator-independent threat model, because each relies on a record
whose content and time are not silently rewritable by the original
custodian. The substrate choice (CT, OTS, EVM) affects *how easy*
primitives 2–5 are to build on top of it, not whether they are buildable.
That is the honest argument for EVM: not that it wins property *P* in
isolation, but that primitives 2–5 already have composable EVM
infrastructure (on-chain attestations `[S?:eas]`, ZK verifier contracts,
access-control libraries) and building them on CT or OTS would require
more glue `[OWN]`.

So the contribution of this narrowed project, in one sentence: **it
builds the foundation layer the rest of the protocol would have to
inherit from anyway, and names the four problems it does not solve as
the subjects of separable future work.**

## 6. Conclusion

On-chain hash anchoring of vehicle-history records meaningfully improves
property *P* — proving a record existed in a given form at a given time
without depending on any single custodian — compared to a trusted
centralised timestamp. It does not improve truthfulness, completeness,
identity binding, or pre-dating protection; those are distinct problems
with distinct solution spaces. Within the narrow question, EVM smart-
contract anchoring is competitive with both certificate transparency
logs and OpenTimestamps-family publication anchoring; it wins on
grounds that belong to the larger protocol (composability with
attestation, reputation, privacy, and fraud-detection primitives), not
on property *P* in isolation. Stating that boundary plainly — what
blockchain *actually* provides, separated from what "immutable vehicle
history" marketing conflates it with — is the intellectual contribution
of this project `[OWN]`.

---

## Appendix A — Code deliverables

| Artifact | Path |
|---|---|
| `RecordAnchor.sol` (Solidity contract) | `anchor/contracts/RecordAnchor.sol` |
| TypeScript canonicalizer | `anchor/src/canonicalize.ts` |
| Hash-parity tests (TS ↔ Solidity) | `anchor/test/hash.test.ts` |
| Contract unit tests | `anchor/test/RecordAnchor.test.ts` |
| Deployment script | `anchor/scripts/deploy.ts` |
| Single-record anchoring script | `anchor/scripts/anchor-one.ts` |
| Static verifier web page | `anchor/verifier/index.html` |
| VIN history search page | `anchor/verifier/search.html` |
| Deployment record (address, tx, block) | `anchor/deployments.json` |
| Sample record corpus | `anchor/verifier/records.json` |

**Deployed contract:** `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF` on Base
Sepolia (chain id 84532). Source-verified on Basescan.

**How to run locally.** From `anchor/`: `npm install && npx hardhat test`
runs the unit and hash-parity tests. `npx hardhat run scripts/deploy.ts
--network baseSepolia` redeploys. The verifier UI is a static file; open
`anchor/verifier/index.html` in a browser or serve the directory with any
static HTTP server. The UI needs no wallet or private key — it reads the
chain over a public RPC.

## Appendix B — Supporting documents in this repository

- `docs/problem1-record-anchoring.md` — narrowed proposal, research
  question, in/out of scope, threat model, technical choices.
- `docs/problem1-solution-tradeoffs.md` — six-solution comparison,
  matrix, three-way argument among CT / OTS / EVM, anchoring as a
  protocol primitive.
- `docs/problem1-build-plan.md` — milestones, compressed timeline, risk
  register, what was built vs. deferred.
- `docs/schema-review-memo.md` — rationale for schema v1.0 field
  choices.
- `docs/SOURCES.md` — attribution log and placeholder bibliography.
- `docs/video-presentation-outline.md` — narrative arc for the
  2026-04-22 video deliverable.
- `docs/project-proposal.md`, `docs/project-proposal-short.md` —
  original (pre-narrowing) proposals, preserved as historical context
  for the scope change.

## Appendix C — Bibliography and limitations of attribution

**Confirmed sources used in this paper.** Three sources are read in full
and verified against the claims they back:

- **[S1]** "Carfax hit with $50 million antitrust lawsuit by 120
  dealerships," *Automotive News*, 2013-04-24. Supports the ~90% Carfax
  market-share figure and the \$50M / 120+ dealer antitrust class-action
  reference in §1.
- **[S2]** "Base — Base Documentation," Base / Coinbase, docs.base.org.
  Supports the characterization of Base as a Coinbase-operated
  OP-Stack optimistic rollup on Ethereum, cited in §3 and §4.
- **[S3]** "Hashing with Keccak256," Solidity by Example (Solidity
  0.8.26), cross-referenced with the Solidity language documentation's
  native-built-in description. Supports the keccak256 choice in §3.1.

**Claims still carrying `[S?:...]` placeholders.** The remaining
industry-context claims in §1–§2 and §3 (Carfax retail price, fraud cost
estimate, RFC 3161/4998, NMVTIS, certificate transparency /
RFC 6962, permissioned-chain reference, L2-rollup concept overview,
OpenTimestamps, OpenZeppelin MerkleProof, EAS, GDPR Article 17, and
Ethereum `block.timestamp` proposer-discretion rules) are preserved as
`[S?]` rather than replaced with sources I did not read end-to-end, per
the syllabus's requirement that cited sources be sources the student has
actually read and understood. Reviewers should treat those numbers and
references as industry-standard ballparks drawn from common public
knowledge, not as verified citations.

**Attribution of analysis.** Claims tagged `[OWN]` are my own analysis.
Claims tagged `[CC]` were framings proposed by Claude (Anthropic's
coding assistant) during drafting sessions that I reviewed and accepted
or extended. Claude was used throughout the project for drafting,
literature-style summarization, and critique; every piece of output was
reviewed, edited, and accepted by me before inclusion.

**Deployed contract verification.** The contract referenced throughout
this paper, `RecordAnchor` at `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF`
on Base Sepolia, was confirmed live on 2026-04-24 by an `eth_getCode`
RPC call to `https://sepolia.base.org` returning non-empty bytecode.
