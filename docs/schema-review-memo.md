# Record Schema Review Memo

**Source:** Produced by a Claude subagent (general-purpose) on 2026-04-15
in response to a targeted review request. Entire memo below is `[CC]` —
Claude-generated content that must be reviewed before any cited source is
promoted to `[S#]`. Mitch should pull the primary sources flagged as
"couldn't fetch" before the final write-up.

**Purpose:** Identify missing, misspecified, and out-of-scope fields in the
proposed record schema for Problem 1 (record anchoring). Scope discipline
was explicitly required in the brief — Section 3 of the memo catches
fields that drag in attestation / reputation / privacy / fraud problems.

---

## 1. Recommended additions

- **`schemaVersion`** (string, e.g. `"1.0"`) — Future-proof. Without it, a
  verifier reading an old anchored hash can't tell which serialization
  rule produced it. Mandatory for any evolvable canonical-hash scheme.
- **`recordId`** (UUID or hash-derived ID) — Lets a verifier unambiguously
  reference this specific record independent of storage location. Also
  disambiguates two otherwise-identical events (e.g., two oil changes on
  the same day).
- **`previousRecordHash`** (bytes32, nullable) — Enables per-VIN chaining
  so a verifier can detect gaps or reordering without trusting our
  indexer. Optional but cheap; keep nullable for the first record per VIN.
- **`recordCreatedAt`** (ISO 8601) — Distinct from `timestamp` (event
  time). The verifier needs to know when the record was *authored*, not
  just when the event occurred. NMVTIS itself separates "date obtained"
  from "date of disposition/report" for this reason.
- **`odometerUnit`** (enum: `"mi"` | `"km"`) — A blockchain record
  anchored globally cannot assume miles. Units in-band or the integer is
  meaningless.
- **`sourceIdentifier`** (opaque string) — Lets a verifier tie the record
  to its originating document (invoice #, police report #, NMVTIS
  reporter ID). This is a *data pointer*, not an attestation-of-identity
  field — it says "the claim refers to document X," not "X is
  trustworthy."

## 2. Recommended modifications to existing fields

- **`eventType` → closed enum.** NMVTIS operates on a fixed vocabulary
  (title, brand, junk, salvage, insurance total-loss, odometer reading).
  Free strings break canonical hashing (case, spelling drift). Proposed
  enum: `title_transfer`, `odometer_reading`, `service`, `accident`,
  `total_loss`, `salvage`, `junk`, `inspection`.
- **`location` → structured.** Minimum: `{ countryCode (ISO 3166-1
  alpha-2), adminArea (state/province), postalCode? }`. A free-text
  "Chicago" can't be compared across records. Avoid lat/long — drags in
  privacy.
- **`timestamp` → ISO 8601 with timezone offset.** Unix seconds is fine
  machine-side but ISO 8601 is self-describing for a human verifier
  reading the raw record; the canonical serialization rule should fix one
  form.
- **`mileage` → integer + unit field (above).** Keep integer; no
  fractional miles in NMVTIS/odometer practice.
- **`details` → drop or constrain.** Free-text 500 chars inside a hashed
  record is a footgun — typos force re-anchoring. Either remove, or split
  into typed subfields per `eventType` (e.g., `serviceType`,
  `partsReplaced[]`).
- **`vin` → add checksum validation note** in the spec (ISO 3779 / 49 CFR
  565). Don't add a field; just validate on write.

## 3. Tempting but out-of-scope (do NOT add)

- `contributorSignature` — attestation problem.
- `contributorRole` / `reporterType` (shop, DMV, insurer) — attestation +
  reputation.
- `confidenceScore` / `corroboratingRecords[]` — fraud detection.
- Owner name, driver license, plate — privacy/GDPR.
- Payment `amount` + `currency` — drags in business model + privacy.
- IPFS CID for photos/documents — storage problem, not anchoring.

Flag from the subagent: `contributorAddress` (already in the schema)
arguably belongs to attestation. Keep it **only** if the contract
requires `msg.sender == contributorAddress` for the anchoring tx — then
it is structural, not reputational. Otherwise cut it.

## 4. Sources the subagent actually read

These must be verified by Mitch before any `[S#]` promotion. Every entry
below is `[S?]` at present.

- **AAMVA — NMVTIS for Junk, Salvage & Insurance Entities**
  (`aamva.org/vehicles/nmvtis/nmvtis-for-junk,-salvage-insurance-entities`)
  — confirms NMVTIS reporting exists; **did not enumerate fields** on the
  page read.
- **vehiclehistory.bja.ojp.gov** — subagent saw only a Google search-result
  excerpt, not the primary page (subagent got a 404 on direct URL). The
  excerpt listed: VIN, date obtained, source entity, disposition, and for
  insurers date-designated-junk/salvage + owner-at-filing. **Treat as
  secondary until primary page is pulled.**
- **eCFR 28 CFR Part 25 Subpart B** — authoritative NMVTIS regulation.
  Subagent **could not fetch directly** (redirect to unblock page). Cited
  only for existence. **Pull CFR manually for the exact required-elements
  list.**
- **NHTSA vPIC API** (`vpic.nhtsa.dot.gov/api/`) — confirms vPIC returns
  structured decode fields; supports VIN as stable primary key, not a
  direct schema source for event records.
- **MOBI Vehicle Identity Standard v1.0, Preview** (dlt.mobi PDF) —
  subagent read pages 1–8 only (front matter + intro + ToC). Preview
  confirms MOBI defines UVI, Vehicle Birth Certificate, Entity
  Certificate, Revocation Certificate in §4.1–4.5. **Full §4 field
  definitions are member-gated; not cited here.**
- **Carfax public event categories** — **no primary source found.** Any
  reference to Carfax event categories in our project must be labeled as
  secondary / marketing-derived.

**Subagent-flagged unknowns:**
(i) exact NMVTIS required-element list — pull 28 CFR 25.56 directly;
(ii) whether MOBI VID II (2021) defines event records beyond birth — not
verified;
(iii) Carfax categories — no primary source exists to cite.

---

## Mitch's notes / open decisions

- [ ] Accept or cut the memo's proposed schema additions?
- [ ] Keep `contributorAddress` only if contract enforces
      `msg.sender == contributorAddress`?
- [ ] Pull 28 CFR 25.56 directly to confirm required-element list before
      final write-up.
