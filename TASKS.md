# OnChainCarFacts — Master Task List

Generated: 2026-03-31
Source: Design docs (startup, builder, CEO plan)

---

## Coding — Foundation (Week 1)

- [ ] **Initialize monorepo structure** — `contracts/`, `api/`, `frontend/` directories with package.json for each
- [ ] **Set up Postgres schema + Prisma migrations** — vehicles, car_facts, contributors tables per data model in startup design
- [ ] **Build NHTSA VIN decoder service** — fetch from NHTSA API, cache in vehicles.nhtsa_data, re-fetch if older than 7 days
- [ ] **VIN format validation** — 17 chars, valid character set (no I, O, Q), check digit at position 9 per NHTSA algorithm. Reject at API layer.
- [ ] **Basic API: GET /api/vin/:vin** — returns NHTSA data + any existing car_facts from Postgres
- [ ] **Set up GitHub Actions CI** — lint + test on push to main
- [ ] **Deploy API to Railway** — Node.js + Express/Hono + Prisma, connected to managed Postgres
- [ ] **Deploy frontend to Vercel** — React + Vite + Tailwind CSS scaffold

## Coding — Core Product (Week 2)

- [ ] **Build /vin/{VIN} page** — vehicle specs, recall data, timeline of car_facts. No wallet/login required. Shareable link.
- [ ] **Write VehicleRegistryAnchor.sol** — `anchorFact(vin, hash)`, `anchorBatch(hashes[])`, `getAnchor(factHash)`, EAS gating for high-impact events (Scrapped/Export/Import), details max 500 chars
- [ ] **Deploy contract to Base Sepolia** — get testnet ETH from faucet, deploy via Hardhat
- [ ] **Contribution API: POST /api/contribute** — accept car_fact, validate VIN, verify wallet signature, store in DB, compute keccak256 hash
- [ ] **Canonical hash implementation** — `keccak256(abi.encodePacked(vin, event_type, location_code, details, mileage, contributor_address, created_at_unix))` — must match between API (ethers.js) and contract
- [ ] **Batch anchoring cron worker** — runs every 5 min, collects unanchored facts, calls `anchorBatch(hashes[])`, updates `anchor_tx_hash` and `anchored_at` in DB
- [ ] **Verification endpoint: GET /api/vin/:vin/verify** — compare DB hash vs on-chain anchor, return match/mismatch status

## Coding — Trust Layer (Week 3)

- [ ] **EAS integration** — read attestation status from EAS contract on Base, display verified badges in UI
- [ ] **EAS-gated high-impact events** — contract reverts on Scrapped/Export/Import without valid EAS attestation
- [ ] **EAS fallback** — feature flag in contract to deploy without EAS check modifier if EAS unavailable on Base mainnet. API skips attestation verification when flag is off.
- [ ] **Contributor profiles page** — show records count, verification status, EAS badge
- [ ] **"Verify on chain" button** — on each car_fact record, shows tx hash + link to Base block explorer
- [ ] **Trust indicator on VIN page** — Green (3+ verified records), Yellow (some records), Grey (NHTSA only), Red (fraud flag, disabled v1)
- [ ] **Bootstrap NHTSA recall data** — bulk import recall data for popular VINs as seed content

## Coding — Rate Limiting & Abuse Prevention

- [ ] **Rate limiting middleware** — 10 contributions per wallet per hour, burst of 3 per minute
- [ ] **Wallet signature verification** — contributors sign message with Ethereum wallet, API verifies before accepting
- [ ] **Content moderation: community flagging** — 3+ flags from different wallets marks record as "disputed"

## Coding — Testing

- [ ] **API endpoint tests (Vitest)** — VIN lookup, contribute, verify endpoints
- [ ] **Hash computation tests** — ensure keccak256 matches between API and contract
- [ ] **Contract unit tests (Hardhat)** — anchorFact, anchorBatch, getAnchor, EAS gating
- [ ] **VIN validation tests** — valid VINs, invalid check digits, edge cases
- [ ] **Integration tests** — full contribute -> anchor -> verify flow (week 3-4)
- [ ] **Load test** — 100 concurrent VIN lookups, target <200ms p99 (week 3-4)

## Coding — Post-MVP / Stretch Features

- [ ] **Fraud map visualization** — Leaflet + OpenStreetMap, plot car journeys, red markers for suspicious activity. ISO 3166-2 subdivision-level plotting (~300 entries lookup table).
- [ ] **Embed widget** — shadow DOM iframe to /vin/{VIN}, "Verified by OnChainCarFacts" badge, JavaScript snippet for third-party sites
- [ ] **WebSocket relay server** — Node.js process polls DB/subgraph every 5s, pushes fraud alerts to WebSocket clients
- [ ] **API rate limit layer for commercial consumers** — API keys in env, express middleware
- [ ] **Subgraph (The Graph)** — schema + mappings with fraud detection logic (ghost vehicles, title washing, odometer rollback), deploy to Subgraph Studio
- [ ] **Automated demo verification script** — post-seed assertions confirming all 3 fraud patterns trigger correctly
- [ ] **Seed data script** — 10-20 vehicles, realistic VINs, 3 fraud scenarios (ghost vehicle, title washing, odometer rollback)
- [ ] **Protocol specification document v0.1** — stable ABI, data format standard, event schema versioning, governance model
- [ ] **Multi-version contract migration strategy** — subgraph multi-address indexing design, frontend version resolution
- [ ] **Privacy model design document** — ZK proofs research, VIN hashing options, tiered access proposal, GDPR/DPPA compliance

## Coding — Production (Week 6)

- [ ] **Deploy contract to Base mainnet** — fund deployer wallet with ~0.01 ETH (~$30), budget ceiling $50
- [ ] **Mainnet wallet security** — private key in Railway/Render env var only, not in code
- [ ] **Domain setup** — onchaincarfacts.com or similar
- [ ] **Analytics integration** — PostHog or Plausible for tracking VIN lookups
- [ ] **SEO optimization** — target "free VIN check" and "vehicle history report free" keywords
- [ ] **Record video demo** — full flow backup for presentation

---

## Homework — Demand Validation (PRIORITY — Do Before Coding)

- [ ] **Talk to 5 used car buyers** — Go to a used car lot or find people browsing Craigslist/FB Marketplace. Ask: "When you bought your last used car, how did you check its history? What was frustrating about that?" Don't mention blockchain. Don't pitch. Just listen. *(Deadline: end of Week 2)*
- [ ] **Talk to 5 used car dealers** — Ask: "What's broken about how you verify vehicle history today?" Listen for pain around Carfax lock-in, costs, data gaps. *(Deadline: end of Week 2)*
- [ ] **Validate: Is $40 the real barrier?** — Or is it trust, completeness, convenience? The answer changes what you build. *(Open question from design doc)*

## Homework — Data & Partnerships

- [ ] **Research bulk-importable public data** — State salvage records, auction results, NHTSA recall database. What can be bulk-imported as "genesis records" on day one? Which states have open data?
- [ ] **Identify target geography** — Design suggests Texas (high vehicle export to Mexico). Validate: is Texas the right first market for dense coverage?
- [ ] **Research auction house partnerships** — Would Copart or IAA be willing to write records? One partner = instant coverage of every totaled/salvaged vehicle in the US.
- [ ] **Research mechanic shop software integrations** — What shop management systems do mechanics use? Is there an API? Integration > manual entry for contributor incentives.

## Homework — Technical Validation

- [ ] **Confirm EAS deployment on Base** — Verify EAS contract at 0xC2679fBD37d54388Ce493F1DB75320D236e1815e on Base Sepolia. Check Base mainnet availability before Week 6.
- [ ] **Base Sepolia faucet reliability** — Test the Coinbase faucet. Fund demo wallet with excess ETH day before any demo. Keep backup funded wallet.
- [ ] **Subgraph hosting decision** — The Graph hosted service vs. Subgraph Studio. Hosted is simpler for demo. Studio (decentralized) requires GRT staking. Decide before Phase 1.
- [ ] **On-chain string storage cost analysis** — For production: consider emitting strings only in events (not storing in contract state). Subgraph indexes events anyway. Dramatically reduces gas costs.
- [ ] **Gas sponsorship model** — Who pays for on-chain anchoring in production? Paymaster contract on Base? Meta-transaction relay? Protocol fees? Insurance partner subsidies? *(Unresolved in all docs)*

## Homework — Legal & Privacy

- [ ] **GDPR research for VINs** — GDPR treats VINs as personal data when linkable to an owner. What's the consent or legitimate interest basis for EU expansion?
- [ ] **DPPA compliance review** — US Driver's Privacy Protection Act restricts personal information linked to motor vehicles. Does on-chain VIN data trigger DPPA?
- [ ] **Privacy vs. immutability tension** — How to handle right-to-erasure requests when data is on-chain? Current design: PII in Postgres (deletable), only hashes on-chain (not reversible). Validate this is sufficient.
- [ ] **Domestic violence / surveillance risk** — Location history on-chain could be used to track individuals. How to mitigate? ZK proofs for location? Tiered access? *(Acknowledged in CEO plan as a real liability)*

## Homework — Business & Entity

- [ ] **Entity structure decision** — Phase 1 is personal/class project. If traction: Delaware C-Corp (YC-compatible). If protocol adoption: non-profit foundation + for-profit. When to make this decision?
- [ ] **Domain name acquisition** — Secure onchaincarfacts.com or alternative
- [ ] **Competitive landscape deep-dive** — carVertical, VINchain, BigchainDB CarPass all stalled. Why? What did they get wrong? What can you learn from their failures?

## Homework — Distribution & Growth

- [ ] **Reddit/HN launch plan** — Draft posts for r/cars, r/usedcars, r/askcarsales, Show HN. What angle resonates? Free VIN check? Anti-fraud? Open protocol?
- [ ] **Car forum outreach** — Identify top car enthusiast forums. What's their attitude toward blockchain?
- [ ] **Dealer conversation** — By Week 6: have at least 1 dealer conversation about the product

## Homework — Fraud Detection Limitations (Acknowledged)

- [ ] **Document fraud detection honest limitations** — Odometer rollback only caught if honest reading submitted first. Title washing evaded by waiting 31+ days. Ghost vehicles invisible if scrapper not on network. These are "common fraud" patterns, not adversarial-proof. *(For pitch/presentation honesty)*
- [ ] **Research off-chain data sources for production** — NHTSA recalls, insurance claims databases, DMV records. Cross-referencing fills gaps that on-chain-only detection can't cover.

---

## Summary

| Category | Count |
|----------|-------|
| Coding — Foundation | 8 |
| Coding — Core Product | 7 |
| Coding — Trust Layer | 7 |
| Coding — Abuse Prevention | 3 |
| Coding — Testing | 6 |
| Coding — Post-MVP/Stretch | 10 |
| Coding — Production | 6 |
| **Coding Total** | **47** |
| Homework — Demand Validation | 3 |
| Homework — Data & Partnerships | 4 |
| Homework — Technical Validation | 5 |
| Homework — Legal & Privacy | 4 |
| Homework — Business & Entity | 3 |
| Homework — Distribution & Growth | 3 |
| Homework — Fraud Detection | 2 |
| **Homework Total** | **24** |
| **Grand Total** | **71** |
