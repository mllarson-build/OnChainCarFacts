# OnChainCarFacts: A Free, Open Vehicle History Protocol
## Final Project Proposal (Abbreviated)

---

## Part A: Use Case Proposal

### 1. The Economic Problem

Carfax controls roughly 90% of the vehicle history report market, charging consumers $40+ per report through exclusive agreements with automakers and listing platforms. Vehicle fraud costs over $6 billion annually in the US alone. Odometers are rolled back, accident records are scrubbed, and cars declared scrapped in one country resurface in another. These fraud patterns persist because vehicle history data sits in centralized silos with no cross-jurisdiction interoperability and no immutability guarantees.

**Value proposition:** OnChainCarFacts is a free, open vehicle history protocol. Every record is anchored on a public blockchain where no company, dealer, or government can alter or erase it. Consumers get free VIN lookups with no signup or payment. Contributors (mechanics, owners, inspectors) build verifiable records rewarded through non-speculative reputation credits, not a volatile token.

### 2. Existing Solutions

**Carfax/AutoCheck:** Aggregate data from 130,000+ sources into centralized databases. Comprehensive but expensive ($25-45/report), mutable, incomplete across borders, and anticompetitive (Carfax faced a $50M antitrust class action from 120+ dealers).

**Free VIN Decoders (NHTSA):** Government API provides vehicle specs and recall data for free, but offers no accident history, service records, or community verification.

**Prior Blockchain Attempts (carVertical, VINchain):** Recognized the immutability value of blockchain for vehicle data but failed due to reliance on speculative tokens, poor consumer UX requiring wallets and crypto knowledge, and an unsolved cold start problem where an empty database attracted no users or contributors.

### 3. How Blockchain Works Here

OnChainCarFacts uses a hybrid architecture: a PostgreSQL database serves instant reads while a smart contract on Base L2 (Coinbase's Ethereum Layer 2) anchors cryptographic hashes of every record on-chain. Contributors submit records through a web app, the system computes a deterministic hash and stores it on-chain via batch transactions at roughly $0.001 per record. Any user can verify a record by comparing the database hash against the on-chain anchor. If they match, the record is tamper-proof. Consumers never touch a wallet or see the blockchain; they just see a web page.

**Challenges solved:** Consumer UX hides blockchain entirely. Gas costs are negligible on L2. The cold start is addressed by seeding the database with free NHTSA data before asking anyone to contribute.

**Challenges open:** Privacy vs. immutability (VINs are personal data under GDPR, conflicting with the right to erasure). Contributor incentive sustainability at scale. Fraud detection limitations against adversarial actors. Gas sponsorship model for production volume.

### 4. The Ecosystem

**Existing technology:** NHTSA VIN decoder API, dealer management systems (Mitchell, ShopWare), insurance claims databases (NICB, ISO ClaimSearch), state DMV records, and salvage auction platforms (Copart, IAA).

**What is needed:** Base L2 for cheap on-chain anchoring, Ethereum Attestation Service (EAS) for contributor reputation, PostgreSQL for instant data serving, and wallet infrastructure (WalletConnect) for mobile contributor authentication. The MOBI Consortium (BMW, Ford, GM, Renault) signals OEM interest in blockchain vehicle data standards, representing a future integration path.

---

## Part B: Project Drill Down

### Focus and Methods

This project emphasizes both **business strategy** and **smart contract implementation** with a working demo. The business analysis contrasts Carfax's centralized monopoly model against the open protocol approach and examines why prior blockchain competitors failed. The technical work implements a VehicleRegistryAnchor smart contract on Base Sepolia with hash anchoring, on-chain verification, and EAS-gated contributor roles.

The most interesting aspects are: (1) designing contributor incentives without a speculative token, using non-transferable credits backed by revenue share; (2) the privacy vs. immutability tension where GDPR's right to erasure conflicts with blockchain's core value; and (3) the cold start coordination problem of bootstrapping a data network from zero.

Key methods include data recording via deterministic hash anchoring (the same pattern as certificate transparency logs), non-transferable credit transfers for economic participation without speculation, and a hybrid privacy architecture where PII lives in a deletable database while only irreversible hashes exist on-chain.

### What to Expect

The final project will include a use case evaluation across all four dimensions, a business strategy analysis of centralized vs. decentralized vehicle history, a deployed smart contract with documented code and gas analysis, a working demo of the contribute-anchor-verify flow, an economic model for contributor incentives at varying scales, and a discussion of open challenges including privacy, fraud detection, and sustainability.
