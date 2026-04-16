# Solution Tradeoffs — Record Anchoring for Vehicle History

**Status:** Analysis doc. Drafted 2026-04-15 as the intellectual core of
the narrowed Problem 1 submission. This is the argument; the demo and the
cost numbers are evidence for it.

**Attribution:** `[S#]` / `[S?:tag]` / `[CC]` / `[OWN]` per `SOURCES.md`.
Every external claim needs a `[S#]` before final submission.

---

## 1. The property we are comparing against

Before comparing solutions, the property we actually care about must be
stated precisely. Most "blockchain for X" arguments fail because the
property is loose. Ours: `[OWN]`

> **Property P:** Given a vehicle-history record R, produce at time T₀
> a commitment such that, at any later time T₁ (possibly years later,
> possibly in a different jurisdiction, possibly after the original
> record's custodian has disappeared), any party holding R can
> independently verify that R existed in exactly this form by time T₀,
> without requiring the cooperation of any single entity that existed at
> T₀.

Three parts of P that matter for the comparison:

1. **Content binding.** The commitment binds to R's exact content. One
   flipped digit must produce a different commitment.
2. **Time binding.** The commitment binds to a time that a verifier can
   later check without trusting the submitter's clock.
3. **Operator independence.** Verification at T₁ does not require any
   single party from T₀ to still exist, cooperate, or be honest.

Property P is **necessary but not sufficient** for "useful vehicle
history." Sufficient requires attestation (who submitted it), reputation
(should we believe them), and completeness (are all events present) —
all out of scope for this project. The point of narrowing is that
solving P is a concrete, checkable contribution that the larger protocol
can build on. `[OWN]`

## 2. Solution taxonomy

Six solution families that provide some version of P. Listed roughly in
order of how many parties must be trusted (more → fewer).

### 2.1 Single trusted operator (status quo — Carfax, dealer management systems)

A single company holds the canonical record database. Verification means
asking the operator. `[S?:carfax-market-share]`

- **Content binding:** Yes, if the operator doesn't mutate the record.
- **Time binding:** Yes, if the operator's timestamps are honest.
- **Operator independence:** **No.** If Carfax is acquired, goes
  bankrupt, is compromised, or simply changes its terms, records become
  unverifiable or verification becomes conditional on the new
  operator's cooperation. `[OWN]`

### 2.2 Trusted timestamp authority (RFC 3161 TSA)

A standards-based service signs hashes of documents with a timestamp,
producing a portable token. Used widely for software signing, legal
documents. `[S?:rfc-3161]`

- **Content binding:** Yes — the TSA signs the hash.
- **Time binding:** Yes — the signed timestamp is part of the token.
- **Operator independence:** **Partial.** The token is portable, so
  verification doesn't require the TSA to be online. But it does require
  the TSA's signing certificate chain to still be valid at verify time.
  A compromised or expired TSA root breaks verification retroactively.
  Note: RFC 4998 (Evidence Record Syntax, "ERS") and long-term
  validation extensions exist specifically to mitigate this by
  re-timestamping tokens before the underlying algorithms or
  certificates weaken — a TSA proponent will raise this, and the
  comparison should acknowledge it rather than pretend it doesn't exist.
  `[S?:rfc-4998]` `[OWN]`

Notable: RFC 3161 + ERS is much better for P than people assume. It is
not an obvious loser to blockchain on content and time binding. The real
weakness is that the TSA operator is still identifiable, coercible, and
can cease to exist — and every ERS re-timestamping round re-enters that
same trust assumption with whichever TSA is then available. `[CC]`
(framing surfaced by Claude; Mitch to verify.)

### 2.3 Federated database (NMVTIS-style)

Multiple operators (states, reporting entities) contribute to a shared
database with regulatory oversight. `[S?:nmvtis]`

- **Content binding:** Yes, within the federation's integrity
  guarantees.
- **Time binding:** Yes, per participant reporting.
- **Operator independence:** **Weak-to-medium.** No single operator can
  unilaterally rewrite, but the federation as a whole can (and the
  oversight body can change access rules). Verification is gated by the
  federation's access policy, not public by default. `[OWN]`

### 2.4 Certificate Transparency-style append-only log

Public append-only log with cryptographic proofs of inclusion and
consistency, operated by a small number of log servers that independent
monitors watch. Originally designed for TLS certificate misissuance.
`[S?:rfc-6962]`

- **Content binding:** Yes — via Merkle inclusion proof.
- **Time binding:** Yes — via the log's signed tree heads.
- **Operator independence:** **Strong in theory, weaker in practice.**
  The log operator can attempt to rewrite history, but monitors will
  detect inconsistency between published tree heads; misbehavior is
  attributable and loggers can be distrusted. Verification requires only
  the proof, not the log operator's cooperation at verify time. Caveat:
  CT's gossip and monitor ecosystem has historically been patchier in
  practice than the RFC 6962 design implies — the *theoretical*
  detection property is sound, but an argument that relies on monitors
  actually watching should name who the monitors are. `[OWN]`

This is the closest smart-contract-free analog to what we are building.
It achieves the same three property components with considerably
lighter infrastructure than a public blockchain. We must argue honestly
about why blockchain beats CT for this use case, or we should use CT.
`[OWN]`

### 2.5 Permissioned blockchain (consortium chain — Hyperledger, private EVM)

A blockchain with a fixed validator set drawn from known participants.
Frequently proposed as a "compromise" for enterprise use.
`[S?:permissioned-chain]`

- **Content binding:** Yes.
- **Time binding:** Yes, subject to consortium timestamps.
- **Operator independence:** **Weak.** The consortium, by majority, can
  reorganize the chain. Verification requires trusting the consortium's
  ongoing operation. For property P specifically, this is strictly
  worse than CT: same trust assumption (a small set of operators), more
  operational overhead, no independent-monitor ecosystem. `[OWN]`

Permissioned chains look attractive because they map to existing
institutional relationships. For the narrow property P, they are not a
real answer — they are a centralized system wearing blockchain
vocabulary. `[OWN]` (strong claim; must stand up in the write-up.)

### 2.6 Public permissionless blockchain (Ethereum L1, Base L2, other rollups)

A chain whose validator set is open and whose consensus and data
availability are secured by economic incentives rather than identity.
`[S?:l2-rollup-concept]` `[S?:base-l2]`

- **Content binding:** Yes.
- **Time binding:** Yes, via block timestamps that proposers cannot
  forge by more than a few seconds without the block being rejected by
  consensus rules. Proposer discretion over `block.timestamp` is
  bounded (must exceed parent block, must be within a short future
  tolerance), not zero — so claiming "cannot forge" is overreach.
  `[S?:ethereum-timestamp-rules]` `[OWN]`
- **Operator independence:** **Strongest of the families above.** No
  identifiable operator can be coerced; verification is performed by
  anyone running an RPC node or using a block explorer; the chain
  outlives any single participant. `[OWN]`

Trust assumption: Ethereum liveness and censorship resistance, plus (for
L2s) the specific rollup's data availability and settlement guarantees
— these are rollup-specific and should be cited against a particular
rollup's spec, not a generic post. `[S?:l2-rollup-concept]`
`[S?:base-l2]`

### 2.7 Publication-based anchoring on a permissionless chain (OpenTimestamps family)

A distinct family from §2.6: uses a permissionless chain (historically
Bitcoin, via OP_RETURN) **purely as a proof-of-publication substrate**,
with no smart contracts involved. Clients submit hashes to aggregator
servers that periodically commit a Merkle root of thousands of
submissions to the chain. The client receives a Merkle inclusion proof
they can verify locally against the on-chain root. OpenTimestamps is
the canonical example; OriginStamp and Chainpoint are variants.
`[S?:opentimestamps]`

- **Content binding:** Yes — via Merkle inclusion proof.
- **Time binding:** Yes — via the block carrying the aggregated root
  (with the same proposer-discretion caveat as §2.6).
- **Operator independence:** **Strong.** The aggregator servers are a
  convenience for batching, not a trust dependency: once the Merkle
  proof is issued, verification needs only the chain, not the
  aggregator. Bitcoin itself has no identifiable operator. `[OWN]`

Per-record cost approaches free because aggregation amortizes one
on-chain transaction over thousands of hashes.

This is the most serious alternative to a smart-contract-based approach
for property P. It achieves all three components of P without requiring
a programmable substrate and without depending on monitor ecosystems.
For anchoring alone — the narrow property — it is competitive with
EVM-based anchoring on every dimension in §3 and cheaper. Any argument
for EVM anchoring has to clear this bar, not just the CT bar. `[OWN]`

## 3. Comparison against property P

Matrix. Each cell is a qualitative rating against the property
components from §1. `[OWN]`

| Solution | Content binding | Time binding | Operator independence | Per-record cost | Trust assumption |
|---|---|---|---|---|---|
| Single operator (Carfax) | ✓ | ✓ | ✗ | ~$0 marginal | Operator honest, solvent, cooperative forever |
| RFC 3161 TSA (with ERS) | ✓ | ✓ | ◐ | cents | TSA honest, cert chain valid at verify time; ERS extends this with periodic re-timestamping |
| Federated database (NMVTIS) | ✓ | ✓ | ◐ | low | Federation integrity + oversight body stable |
| Certificate Transparency log | ✓ | ✓ | ✓ (theory) / ◐ (practice) | low | ≥1 honest monitor *actually* watches the log |
| Permissioned blockchain | ✓ | ✓ | ◐ | low | Consortium majority honest |
| Public blockchain, smart-contract (EVM L1/L2) | ✓ | ✓ | ✓✓ | cents (L2) to dollars (L1) | Ethereum/L1 liveness + (for L2) rollup-specific DA/settlement |
| Public-chain publication (OpenTimestamps family) | ✓ | ✓ | ✓✓ | ~free (aggregated) | Bitcoin/L1 liveness; aggregator is a convenience, not a trust dependency |

Legend: ✓✓ = strong, ✓ = yes, ◐ = partial/conditional, ✗ = no. Ratings
use a "(theory) / (practice)" notation where a design's operational
history materially differs from its spec — CT being the notable case.
`[OWN]`

## 4. The specific argument — three-way comparison

Starting from the matrix, three solution families clear the bar on all
three components of property P: Certificate Transparency logs (§2.4),
publication-based anchoring on a permissionless chain (§2.7, OpenTimestamps
family), and smart-contract anchoring on a public blockchain (§2.6,
EVM L1/L2). A pre-critique draft of this section argued EVM
anchoring vs. CT as a two-way choice; that was a false dichotomy — the
OTS family is the omitted third option and has to be addressed directly.
`[OWN]`

This section compares the three honestly on **property P alone**.
Composability with other on-chain primitives is a real advantage of the
EVM path, but it is a property of the *larger protocol*, not of
anchoring in isolation — that argument is moved to §6.

### 4.1 CT-style logs vs. the two permissionless-chain options

Against CT, both permissionless-chain approaches (§2.6 and §2.7) share
two advantages that are genuine and property-P-relevant:

1. **No log-operator role to staff.** CT requires operating or
   contracting log servers, and — critically — a monitor ecosystem that
   must actually watch the logs for the detection property in §2.4 to
   hold. Permissionless chains externalize both: anyone runs the
   infrastructure, and block explorers already serve a monitor-like
   function. For a protocol meant to span jurisdictions, this
   operational simplification is significant. `[CC]`
2. **Censorship resistance is stronger, with qualification.** CT logs
   can refuse to accept a submission. Permissionless chains are
   substantially harder to censor than a named operator, but "cannot
   refuse a well-formed transaction" is overreach — proposer-level
   censorship exists, and on L2s the base-layer escape-hatch / force-
   inclusion mechanism varies by rollup and is not uniformly battle-
   tested. The honest claim is "substantially harder to censor than any
   identifiable log operator," not "impossible to censor." `[OWN]`

Against CT, both §2.6 and §2.7 win — but they tie each other on these
two points.

### 4.2 §2.6 (EVM smart-contract anchoring) vs. §2.7 (OTS-style publication)

On property P in isolation, these two are very close. §2.7 is cheaper
(aggregated to near-free per record), adds no smart-contract attack
surface, and has a longer operational track record via Bitcoin. `[OWN]`

The honest argument for §2.6 over §2.7 **for property P alone** is
narrow:

- **Tighter time binding.** EVM anchoring puts the commitment in a
  block directly; OTS aggregation introduces a delay between submission
  and on-chain confirmation (often minutes-to-hours) during which the
  client holds only an aggregator receipt. For most vehicle-history use
  cases this does not matter; for any application where minute-level
  attribution matters, §2.6 is cleaner.
- **Self-contained verification.** §2.6 verification requires only the
  chain and the record. §2.7 verification requires the chain, the
  record, *and* the Merkle path the aggregator issued. The path is
  portable and small, but it is an extra artifact that must survive.

If property P were the only consideration, a fair write-up would
probably recommend the OTS family: same guarantees at lower cost and
less attack surface. Our project ends up on the EVM path because of the
composability argument moved to §6 — and we should say that plainly
rather than dress up a substrate choice in property-P language. `[OWN]`

### 4.3 Where each family is the right answer

- **CT** is the right answer when the operator set is small-and-known,
  monitor infrastructure already exists or is cheap to stand up, and
  there is no composability requirement.
- **OTS-family publication** is the right answer when property P is the
  *only* requirement and cost pressure is high.
- **EVM smart-contract anchoring** is the right answer when the
  anchoring primitive will later compose with attestation, programmatic
  access control, or other on-chain logic — i.e., when the project is
  Problem 1 of a larger protocol and the *future* primitives matter to
  the substrate choice now.

Our narrowed project is in the third category only because of what we
plan to build next; on property P in isolation, it is a close call
between §2.6 and §2.7. Naming that honestly is the point of the
narrowing exercise. `[OWN]`

## 5. What anchoring does NOT solve

Restated here from `problem1-record-anchoring.md` §6 because it is the
backbone of the final pitch: the intellectual contribution of this
project is making these boundaries explicit, not pretending they are
solved. `[OWN]`

Anchoring does not prove:

- That R is **true.** Garbage in, anchored garbage out.
- That the submitter is who they claim to be (attestation problem).
- That all relevant events are present (completeness problem —
  undetectable omissions).
- That R existed *before* T₀. Only that it existed by T₀. (The
  pre-dating attack: a submitter can hold a record for months, then
  anchor it. The anchor proves existence-by-T₀, not that the record was
  authored at the event time the record claims. Defending against this
  requires an independent attestation that the record was authored
  close to the event it describes — out of scope here.)

Each of these is a separate design problem with its own solution space.
None is solved by switching substrates from centralized to blockchain.
`[OWN]`

## 6. Anchoring as a primitive in the larger protocol

This is the framing that reconciles the narrowed project with the
original proposal. **Conditional, not absolute:** anchoring is
foundational *for the threat model we chose* — one where the record
custodian is not necessarily honest, solvent, or extant at verify time.
Under a trusted-operator threat model, the other primitives stack on a
Postgres table fine; Carfax is an existence proof of this. The claim
that anchoring is the foundation layer is contingent on rejecting the
trusted-operator assumption, which the narrowing did when it picked
operator-independence as a component of property P. Stating the
condition plainly is cheaper than defending an absolute claim. `[OWN]`

### 6.1 Substrate-agnostic decomposition

The larger vehicle-history protocol, as originally scoped, decomposes
into five primitives. This decomposition is written substrate-agnostic
on purpose — specific substrate choices (EAS, DIDs, particular ZK
systems) are implementation details, not part of the decomposition. A
CT-based or OTS-based version of the protocol would decompose the same
way. `[OWN]`

1. **Anchoring** (this project) — bind a record's content and time to a
   substrate whose integrity does not depend on the record's original
   custodian.
2. **Attestation** — bind a record to a real-world identity via some
   credentialing layer (could be on-chain attestations, X.509-style
   certificates, verifiable credentials, or domain-specific registries).
   Whatever the layer, it must be able to reference an anchor
   commitment so the attested claim is pinned to an unrewritable record.
3. **Reputation / weighting** — weight attestations by contributor
   track record. A view over anchored attestations; requires no new
   substrate.
4. **Privacy** — selectively disclose fields while preserving the
   anchor's verifiability. Standard primitive family: hashed field
   commitments, Merkle revelation, ZK proofs over canonicalized records.
   Each composes with any anchor mechanism from §2.
5. **Fraud detection** — cross-reference anchored records for
   inconsistencies (odometer rollback, duplicate titles, geographic
   impossibility). Pure analytics over the anchored corpus.

### 6.2 Why the decomposition is stable across substrates

Under the operator-independent threat model, every primitive 2–5
**requires** an anchor primitive (of some kind) because each of them
relies on a record whose content and time are not silently rewritable.
The specific substrate choice (§2.4 CT, §2.6 EVM, §2.7 OTS) affects
*how easy* primitives 2–5 are to build on top of it, not whether they
are buildable. Specifically: `[OWN]`

- §2.6 EVM is the easiest substrate to build 2 and 4 on, because
  on-chain attestation registries and ZK verifier contracts already
  exist in that ecosystem. This is the **composability argument** moved
  here from §4 — where it belonged all along. `[S?:eas]`
- §2.7 OTS-family anchors compose with off-chain attestation layers
  (verifiable credentials, PGP-like signatures) but do not natively
  support programmable access control. A full protocol on OTS would
  require building more glue.
- §2.4 CT is workable for 2–5 but requires operating or partnering with
  log servers and building every other primitive from scratch.

So the **substrate-choice argument for the larger protocol** is:
anchoring alone is roughly a tie between §2.6 and §2.7 (see §4.2), but
once primitives 2–5 are on the roadmap, §2.6's existing composable
infrastructure becomes the deciding factor. This is an honest argument
for EVM anchoring; it just lives at the protocol level, not at property
P. `[OWN]`

### 6.3 What the final report should claim

The narrowed project does not solve vehicle history. It:

1. Establishes the foundation layer for an operator-independent
   vehicle-history protocol.
2. Makes the boundaries of that foundation layer explicit, so the four
   follow-on primitives know what they inherit and what they do not.
3. Names the substrate choice honestly: on property P in isolation, the
   EVM path and the OTS path are close; the EVM path wins on grounds
   that belong to the larger protocol, not to the narrow property. `[OWN]`

## 7. Implications for the demo

The demo should make the comparison from §3 concrete, not just claim it.
Concrete evidence opportunities: `[OWN]`

- Show a record anchored on Base Sepolia with a block timestamp.
- Show that modifying one digit of the record changes the hash and
  fails verification.
- Show the same contract deployed on Ethereum Sepolia and Base Sepolia
  with measured gas — evidence for the "cost doesn't force the design
  choice on L2" point.
- (Stretch) Show a side-by-side comparison with a bare centralized
  timestamp service to make the operator-dependence point visceral.
  Optional; only if time allows.
- (Stretch, higher value) Anchor the same record via OpenTimestamps as
  well as our EVM contract. Lets the write-up's §4.2 "it's a close call
  on property P alone" claim be demonstrated, not just asserted.
  Optional; only if time allows.

The write-up should reference this document's matrix as Table 1 and the
cost measurements as Table 2. The threat model in
`problem1-record-anchoring.md` §6 becomes Table 3. `[OWN]`

## 8. Open questions for Mitch

1. Is the comparison in §3 strong enough, or does it need a
   permissioned-blockchain deployment as a negative example? (My vote:
   no — spending time deploying a thing we think is a bad fit is
   expensive for one argument we can make textually.) `[OWN]`
2. Do we explicitly compare to RFC 3161 in the demo, or keep that
   argument textual? (My vote: textual, with one concrete TSA example
   named in the write-up.) `[OWN]`
3. Should the larger-protocol §6 decomposition go in the final report,
   or only the video? (My vote: both — it is the answer to "what is
   this project a subproblem of," which Ariel's feedback specifically
   asked us to be clear about.) `[OWN]`
4. **New after stress-test:** do we anchor the sample corpus via
   OpenTimestamps in addition to our EVM contract, so §4.2's "close
   call on property P alone" is demonstrated rather than asserted? OTS
   is a thin client — hours, not days, of work — and makes the write-up
   substantially more honest. My vote: yes, if M2–M5 stay on schedule;
   drop it if hash parity slips. `[OWN]`

---

## Change log

- 2026-04-15 (stress-test revision): Applied fixes 1–9 from the
  adversarial subagent critique. Substantive changes: added §2.7
  OpenTimestamps-family as the previously-omitted third permissionless
  anchoring option; rewrote §4 as a three-way comparison (CT vs. OTS
  vs. EVM) and removed composability from the property-P argument;
  reframed §6 as conditional on the operator-independent threat model
  rather than absolute, and made the decomposition substrate-agnostic
  so it does not circularly assume the substrate it's arguing for;
  softened overclaims on block-timestamp forgery (§2.6), permissionless-
  chain censorship (§4.1), and CT operator-independence (§2.4);
  acknowledged RFC 4998 (ERS) for §2.2; added the pre-dating attack to
  §5; added a stretch demo item for anchoring via OTS; added a fourth
  open question about that stretch item. `[CC]` critique by subagent;
  edits applied by Claude; changes accepted by Mitch.
- 2026-04-15 (initial): Initial draft written to reframe the project
  around tradeoff analysis rather than implementation. `[CC]` structure
  proposed by Claude after Mitch asked for a solution-space survey
  before building.
