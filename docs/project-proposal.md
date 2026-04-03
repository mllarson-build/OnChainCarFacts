# OnChainCarFacts: A Free, Open Vehicle History Protocol
## Final Project Proposal

---

## Part A: Use Case Proposal

### 1. What is the Economic "Problem"?

**The Value Proposition**

Used car buyers in the United States face a $6 billion annual vehicle fraud problem trapped behind a monopoly paywall. Carfax controls approximately 90% of the vehicle history report market through exclusive agreements with 37 of 40 automaker certification programs and major listing platforms like Cars.com and AutoTrader. Consumers pay $40 or more per report for data that is centralized, opaque, and often incomplete. Dealers are forced to bundle Carfax reports into their pricing, and the perception that "no Carfax report" equals a suspicious vehicle creates a market dynamic where a single company acts as the de facto gatekeeper of vehicle trust.

The consequences of this centralized trust model are real and measurable. Dealers can scrub accident records from their listings. Odometers are rolled back (affecting an estimated 450,000 vehicles annually per NHTSA). Cars declared "scrapped" in one jurisdiction resurface in another, a pattern linked to organized crime and cross-border trafficking networks. These fraud patterns persist precisely because vehicle history data lives in silos, across jurisdictions, controlled by different entities with no interoperability or immutability guarantees.

OnChainCarFacts proposes a free, open vehicle history protocol where every record is anchored on a public blockchain. The core economic insight is that vehicle provenance data is a public good that has been artificially privatized. By making vehicle history free to read, community-contributed, and cryptographically verifiable, OnChainCarFacts disrupts the information asymmetry that enables vehicle fraud and extracts monopoly rents from both consumers and dealers.

The value proposition in one sentence: **Free, tamper-proof vehicle history reports that no company, dealer, or government can alter or erase, available to anyone with a VIN and a web browser.**

### 2. How Do Existing Solutions Work?

**Carfax (Market Leader)**

Carfax aggregates vehicle data from insurance companies, DMVs, service shops, and auction houses into centralized databases. They sell individual reports ($44.99) or subscription packages ($99.99 for 6 reports) to consumers, and offer dealer programs where dealers pay for unlimited access in exchange for exclusive listing partnerships.

*Pros:*
- Comprehensive data aggregation from 130,000+ sources
- Established brand recognition and consumer trust
- Integrated into the dealer workflow via partnerships
- Reports include accident history, ownership transfers, odometer readings, service records

*Cons:*
- High cost creates a barrier, particularly for private-party transactions (Craigslist, Facebook Marketplace)
- Centralized database means data can be altered, withheld, or simply wrong
- Cross-border data is incomplete or nonexistent (a car's history in Mexico does not appear in a US Carfax report)
- Exclusive dealer agreements create anticompetitive dynamics (Carfax was sued for $50M in an antitrust class action by 120+ dealers)
- No mechanism for community verification. If Carfax's source data is wrong, the report is wrong.
- No immutability guarantee. Records can be updated or removed.

**AutoCheck (Experian)**

Experian's AutoCheck competes at roughly one-third the price of Carfax with virtually the same underlying data sources. However, it lacks consumer brand recognition and is primarily used in the dealer-to-dealer wholesale market.

*Pros:*
- Lower cost ($24.99/report)
- Access to Experian's credit and insurance data

*Cons:*
- Same centralization and data mutability problems as Carfax
- Limited consumer awareness
- No cross-border capability

**Free VIN Decoders (NHTSA, VINFree)**

The National Highway Traffic Safety Administration provides a free VIN decoder API that returns basic vehicle specifications (make, model, year, manufacturer) and open recall information. Various free websites wrap this API for consumer use.

*Pros:*
- Completely free
- Authoritative government data source for specifications and recalls
- No signup or payment required

*Cons:*
- Limited to specs and recalls only. No accident history, ownership transfers, or service records.
- No community contribution mechanism
- No verification or trust layer

**Prior Blockchain Attempts (carVertical, VINchain, BigchainDB CarPass)**

Several blockchain-based vehicle history startups have entered the market and largely stalled. carVertical (Lithuania) charges per report using a utility token. VINchain attempted a similar model with its own ERC-20 token. BigchainDB's CarPass explored enterprise blockchain for OEM data sharing.

*Pros:*
- Recognized the immutability value of blockchain for vehicle data
- Explored token-based incentive models for data contribution

*Cons:*
- Most relied on speculative utility tokens that detached from product value
- None solved the cold start problem (empty chain = no users = no contributors = no data)
- Consumer UX was poor (required wallets, tokens, and blockchain knowledge to use)
- Failed to achieve meaningful adoption or data density in any market

### 3. How Does (Might) Blockchain Work?

OnChainCarFacts uses a **hybrid architecture** where a traditional PostgreSQL database serves instant reads (vehicle lookups in under 200ms) while a smart contract on Base L2 (Coinbase's Ethereum Layer 2) anchors cryptographic hashes of every vehicle record on-chain.

**How it works:**

1. A contributor (car owner, mechanic, inspector) submits a vehicle record through the web application. The record includes the VIN, event type (maintenance, accident, ownership transfer, etc.), location, details, and mileage.
2. The API server validates the VIN format, verifies the contributor's wallet signature, and stores the full record in PostgreSQL for instant retrieval.
3. A canonical hash of the record is computed using `keccak256(abi.encode(vin, event_type, location_code, details, mileage, contributor_address, created_at_unix))`. This hash uniquely identifies the record content.
4. A batch worker runs every 5 minutes, collecting unanchored record hashes and calling `anchorBatch(hashes[])` on the VehicleRegistryAnchor smart contract deployed on Base Sepolia (testnet) and eventually Base mainnet.
5. The smart contract stores each hash in a `mapping(bytes32 => uint256)` (hash to block timestamp) and emits a `FactAnchored` event.
6. Any user can verify a record by comparing the hash computed from the database record against the hash stored on-chain. If they match, the record has not been tampered with since it was anchored.

**The smart contract (VehicleRegistryAnchor.sol) provides three core functions:**

- `anchorFact(string vin, bytes32 factHash)` — anchors a single record hash and emits an event
- `anchorBatch(bytes32[] hashes)` — anchors up to 500 record hashes in a single transaction for gas efficiency (~$0.05 per batch of 100 on Base L2)
- `getAnchor(bytes32 factHash)` — read-only function that returns whether a hash exists on-chain and when it was anchored

**Challenges: Solved**

- **Consumer UX:** The read path (VIN lookup) requires no wallet, no login, and no payment. Blockchain is invisible to the consumer. They see a web page, not a smart contract.
- **Gas costs:** By storing only 32-byte hashes on-chain (not full record data) and batching anchoring operations, gas costs are approximately $0.001 per record on Base L2. A $50 budget supports approximately 10,000 record anchors.
- **Cold start problem:** The database is bootstrapped with public data from NHTSA (recalls, specifications) before any community contributions. The product is useful on day one.
- **Data speed:** The hybrid architecture decouples user experience from blockchain latency. Reads are instant from PostgreSQL. The blockchain provides verification, not serving.
- **Contributor authentication:** Contributors sign a message with their Ethereum wallet (EIP-191) to prove identity. No account creation needed. Rate limiting (10 contributions per wallet per hour) and the Ethereum Attestation Service (EAS) provide Sybil resistance and reputation.

**Challenges: Open**

- **Privacy vs. immutability tension:** VINs are classified as personal data under GDPR when linkable to a vehicle owner. On-chain hashes are not reversible to PII, but the off-chain database stores VINs and locations. The right-to-erasure (GDPR Article 17) conflicts with the immutability thesis. The current design stores all PII-adjacent data in PostgreSQL (deletable) and only hashes on-chain (not reversible), but this needs formal legal review for EU expansion.
- **Domestic violence and surveillance risk:** Location history for vehicles on a public chain could be used to track individuals. The design acknowledges this as a real liability and defers mitigation (ZK proofs for location, tiered access) to a future phase.
- **Contributor incentive sustainability:** The incentive model uses non-transferable Contribution Credits (not a speculative token) that convert to revenue share when premium reports generate income. Whether the economics of contributor compensation work at realistic scale is an open question currently being modeled.
- **Fraud detection limitations:** The three on-chain fraud detection patterns (ghost vehicles, title washing, odometer rollback) assume cooperative actors. Real adversaries can evade them (e.g., waiting 31+ days to avoid the title washing window, or simply not reporting a scrapped vehicle). Production fraud detection requires cross-referencing off-chain data sources.
- **Gas sponsorship at scale:** Currently the project wallet pays for all on-chain anchoring. At scale, a sustainable model is needed (paymaster contract, protocol fees, or insurance partner subsidies).

### 4. What is the "Ecosystem"?

**Existing Non-Blockchain Technology:**

- **NHTSA VIN Decoder API:** Free, public government API that decodes any VIN into make, model, year, manufacturer, and vehicle specifications. Also provides open recall data. This is the foundation of the free lookup experience.
- **Dealer Management Systems (DMS):** Mitchell, ShopWare, Tekmetric, and similar shop management software where mechanics track service records. Currently siloed per shop with no interoperability.
- **Insurance Claims Databases:** NICB (National Insurance Crime Bureau), ISO ClaimSearch, and insurer-specific databases track accident claims, total losses, and fraud indicators. Access is restricted to industry members.
- **State DMV Records:** Title registration, ownership transfers, and salvage designations. Vary by state with no federal interoperability standard.
- **Auction Platforms:** Copart and IAA (Insurance Auto Auctions) process every totaled and salvaged vehicle in the US. Their data would instantly provide coverage of fraud-prone vehicles.

**What is Needed:**

- **Base L2 (Coinbase):** Ethereum Layer 2 blockchain providing cheap transactions (~$0.001 per hash anchor) with the security guarantees of Ethereum mainnet. Already deployed and operational.
- **Ethereum Attestation Service (EAS):** An on-chain attestation standard deployed on Base that enables verifiable contributor reputation. Used to gate high-impact events (Scrapped, Export, Import) to attested contributors, preventing data poisoning.
- **PostgreSQL (managed hosting):** Railway or Supabase for the primary data store serving instant reads.
- **Vercel + Railway:** Modern deployment infrastructure for the React frontend and Node.js API server.
- **Wallet infrastructure (wagmi + WalletConnect):** Enables contributors to sign records from both desktop and mobile wallets without requiring blockchain expertise.
- **MOBI Consortium interest:** BMW, Ford, GM, and Renault are members of the Mobility Open Blockchain Initiative (MOBI), signaling OEM interest in blockchain-based vehicle data standards. This represents a potential future integration path for factory-to-chain vehicle provenance.

---

## Part B: Project Drill Down

### Focus Area

This project will emphasize **both business strategy and smart contract implementation**, with a working demo that demonstrates the core value proposition.

**Business strategy focus:** The project will contrast Carfax's centralized, monopoly-rent-extracting model against a decentralized, open-protocol approach. The analysis will examine why prior blockchain vehicle history startups (carVertical, VINchain) failed despite recognizing the right problem, focusing on three strategic errors: (1) relying on speculative tokens instead of real economic incentives, (2) failing to solve the cold start problem, and (3) requiring blockchain expertise from end users. OnChainCarFacts addresses all three through public data bootstrapping, non-speculative contribution credits, and a consumer UX that hides the blockchain entirely.

**Smart contract focus:** The project will implement and demonstrate the VehicleRegistryAnchor smart contract on Base Sepolia, including:
- Hash anchoring (individual and batch operations)
- On-chain verification (comparing database hashes against contract state)
- EAS-gated event types (requiring attestation for high-impact events like Scrapped/Export/Import)
- Gas efficiency analysis (cost per anchor on Base L2 vs. Ethereum mainnet)
- The `abi.encode` vs. `abi.encodePacked` design decision and why encoding choice matters for immutable on-chain data

### Most Interesting Aspects

**1. The incentive design problem (no token).** The most intellectually interesting aspect of this use case is designing contributor incentives without creating a speculative token. The conventional blockchain approach (mint a token, airdrop it, hope speculation drives adoption) has failed repeatedly for vehicle history. Our approach uses non-transferable Contribution Credits backed by future revenue share, a buyer-initiated contribution model where the economic incentive is built into the real estate transaction (sellers document history to justify price), and EAS-based reputation that functions like Stack Overflow karma, not a financial asset. This represents a first-principles challenge to the "everything needs a token" orthodoxy in blockchain product design.

**2. Data recording and the canonical hash problem.** Getting the hash encoding right is a one-shot decision for immutable on-chain data. We discovered during engineering review that Solidity's `abi.encodePacked` with variable-length strings creates ambiguous encodings (concatenating "AB"+"CD" produces the same bytes as "ABC"+"D"). This was caught by an independent AI reviewer and fixed to use `abi.encode` (padded, unambiguous). This is a concrete example of how smart contract design decisions have permanent consequences that traditional software does not face.

**3. Privacy vs. immutability tension.** VINs linked to owners are personal data under GDPR. The immutability guarantee that makes blockchain valuable for fraud prevention directly conflicts with the right to erasure. Our hybrid architecture (PII in a deletable database, only hashes on-chain) is a pragmatic compromise, but the tension is genuine and unsolved at the protocol level. Future work includes zero-knowledge proofs for location verification and tiered access controls.

**4. The cold start problem as an economic coordination game.** An empty vehicle history database has zero value. The question of who contributes first, and why, is a classic coordination problem. Our three-phase contributor funnel (public data seeding, buyer-initiated seller contributions, institutional API integrations) is designed to bootstrap network effects without relying on token speculation.

### Methods and Features

**Data Recording:** The core smart contract method is hash anchoring. Each vehicle record is hashed deterministically (`keccak256(abi.encode(...))`) and the hash is stored on-chain with a timestamp. The full record lives in PostgreSQL. Anyone can verify a record has not been tampered with by recomputing the hash and checking it against the on-chain anchor. This is the same pattern used by certificate transparency logs and notary services, applied to vehicle history.

**Transfers:** Contribution Credits accrue per verified record and are non-transferable (they cannot be bought, sold, or speculated on). When premium reports generate revenue, credits determine each contributor's proportional share of a 30% revenue pool. This is economic participation without financial speculation.

**Privacy:** The hybrid architecture ensures all personally identifiable data (VINs, locations, contributor details) lives in PostgreSQL, which supports deletion for right-to-erasure compliance. On-chain data consists only of 32-byte hashes that are computationally irreversible to the original record. This means the blockchain provides immutability for verification purposes while the database layer respects privacy regulations.

**Smart Contract Features for the Demo:**
- `anchorFact()` and `anchorBatch()` for hash anchoring with event emission
- `getAnchor()` for on-chain verification
- EAS integration for contributor reputation gating
- `setEASRequired()` owner-only toggle for phased EAS rollout
- Deployed on Base Sepolia (Coinbase's L2 testnet) with real transactions at ~$0.001/anchor

### Alignment with Background and Interests

This project sits at the intersection of blockchain technology, product economics, and real-world fraud prevention. The startup design approach (narrowest wedge first, demand validation before full build, protocol-then-commercial-layer entity structure) reflects applied business strategy. The smart contract implementation demonstrates practical Solidity development on a modern L2. The incentive design (non-speculative credits, EAS reputation, buyer-initiated contribution loops) represents original thinking about blockchain economics that goes beyond existing implementations in the vehicle history space.

### What to Expect from the Final Project

The final project will include:

1. **Use case evaluation** covering all four dimensions (economic problem, existing solutions, blockchain approach, ecosystem)
2. **Business strategy analysis** contrasting Carfax's centralized model with the open protocol approach, including analysis of why prior blockchain competitors failed
3. **Smart contract implementation** (VehicleRegistryAnchor.sol) deployed on Base Sepolia with documented code, test coverage, and gas analysis
4. **Working demo** of the full contribute-anchor-verify flow: submit a vehicle record through the web interface, watch it anchor on-chain, verify the hash match
5. **Economic model** for contributor incentives (Contribution Credits, revenue share, tier system) with sensitivity analysis at different adoption scales
6. **Discussion of open challenges** including privacy/immutability tension, fraud detection limitations, and gas sponsorship sustainability
