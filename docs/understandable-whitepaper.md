# OnChainCarFacts: A Public, Verifiable Vehicle History Record

**Final Project — Mini8 Blockchain**
**Authors:** [Team]
**Date:** April 2026
**Code:** `anchor/` directory in this repo
**Deployed contract:** `RecordAnchor` at `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF` on Base Sepolia (chain id 84532)

**A note on how we worked.** Three of us are MBA students; none of us came in as Solidity developers. We used Claude (Anthropic) to help write and debug the smart-contract code and the test scaffolding, and to research citations. We wrote and edited this paper ourselves. Anything we cite here, we have read. Anything we describe in the contract, we can walk through line by line.

---

## 1. The problem

If you buy a used car in the United States, the standard way to check its history is a Carfax report. Carfax has roughly 90% of the vehicle history report market, built up through exclusive deals with the major car listing sites and certified pre-owned programs [S1]. A single report costs $44.99 [S4].

The price is one issue. The bigger issue, in our view, is that one private company controls the integrity of every record in every report. Carfax decides what's included. Records can be amended after the fact. If Carfax is acquired or changes its terms, every report it ever issued depends on whoever owns the data next. There is no independent way for a buyer to check a Carfax record against the original source.

Vehicle fraud is also a real and quantified problem. NHTSA estimates that roughly 452,000 vehicles per year are sold in the US with rolled-back odometers, costing buyers about $1.06 billion per year in inflated prices (this is from NHTSA's 2002 nationwide study, which is the most recent comprehensive estimate; their 95% confidence range was $737M–$1,376M) [S5]. Title washing across state lines, undisclosed accident damage, and vehicles that disappear in one country and resurface in another all add to the total. Carfax catches a lot of this, but the gaps are real, especially across borders.

Carfax has also been challenged in court. In 2013, more than 120 dealerships filed a $50 million antitrust class action alleging Carfax used exclusive contracts with listing sites to lock out competitors [S1].

**Our value proposition.** A vehicle history record that any used-car buyer can verify themselves, for free, without trusting Carfax (or us, or any other single company) to remain in business and behave honestly. Records are anchored on a public blockchain, so anyone with a web browser can confirm that a record has not been altered since it was filed.

---

## 2. How this is solved today (without blockchain)

A few approaches exist today, each with a tradeoff:

- **Carfax / AutoCheck.** Centralized vehicle history services. Most coverage, most expensive, controlled by a single company per service. Integrity depends on that company continuing to operate honestly forever.
- **Free government APIs (NHTSA's vPIC).** The federal government provides vehicle specs and recall data for free. It does not include accident or service history.
- **State title databases (NMVTIS).** US states share title information through a federal system [S?]. Better than nothing, but it only covers titles, access is gated, and it doesn't include service or accident records.
- **Trusted timestamp authorities (RFC 3161).** A standards-based way to prove a document existed at a given time, used in legal and regulatory contexts [S?]. The proof still depends on the timestamp authority being around, and on its certificate chain still being valid, when someone wants to verify it.
- **Earlier blockchain attempts (carVertical, VINchain).** Both tried to build vehicle history on a blockchain. Both stalled. The reasons commonly cited [S?] are that they launched their own speculative tokens that scared off mainstream users, that they required buyers to install wallets and learn crypto, and that the database was empty at launch so there was nothing to verify.

The combination none of these provide is: free verification by anyone, records that no single company can change, and a user experience that doesn't require any crypto knowledge.

---

## 3. What we built

Our project is a smart contract that anchors vehicle history records on a public blockchain, plus a static webpage that anyone can use to verify a record. We narrowed the scope after early feedback from Prof. Zetlin-Jones (April 15) — the original proposal tried to do six things at once, and we are three MBA students with limited Solidity experience. We focused on getting the foundation right: record anchoring.

### 3.1 The basic idea

A vehicle history record is structured data: a VIN, an event type (accident, service, odometer reading, sale, etc.), a date, a location, a mileage, and the address of whoever submitted it. We turn that record into a 32-byte fingerprint using a standard hash function called keccak256 [S3]. The fingerprint changes completely if any character of the record changes.

We store the fingerprint on a public blockchain. The blockchain records the time the fingerprint was stored and which Ethereum address stored it.

To verify a record later, anyone can:

1. Compute the fingerprint of the record they have.
2. Look up the fingerprint on the blockchain.
3. If the fingerprint is on the chain, the record existed in this exact form at or before the recorded blockchain time. If the fingerprint differs, the record has been changed.

The actual record (with personal data) stays in a normal database. Only the fingerprint goes on-chain. This matters for privacy.

### 3.2 The smart contract

Our contract is `RecordAnchor.sol` — about 110 lines of Solidity. It does two things:

1. `anchor(hash)` — stores a single record fingerprint on-chain. Anyone can call this. Each fingerprint can only be stored once.
2. `anchorRoot(root)` — stores a Merkle root, which is a single fingerprint that summarizes a batch of records. This is how we keep costs low when anchoring many records: combine all of them into one Merkle root, then anchor only the root. Later, anyone can prove a specific record was in the batch using a Merkle proof.

The contract is deployed on Base Sepolia (a free Ethereum test network) at `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF`. The source code is verified on Basescan, which means anyone can read the actual code, not just compiled bytecode.

### 3.3 What it cost (real numbers from our deployment)

| Operation | Gas used |
|---|---|
| Deploying the contract | 549,670 |
| Anchoring one record (single-hash) | 90,594 |

These are measured from our actual transactions on Base Sepolia. At Base mainnet's typical gas prices (well under a cent per record once batched into a Merkle root), anchoring at the scale of every used-car sale in the US per year is comfortably under $1 million per year in total gas — small relative to a market where Carfax alone sells reports at $44.99 a piece.

### 3.4 The verifier website

`anchor/verifier/index.html` is a static webpage. The user pastes in a record (as JSON), and the page computes the fingerprint in their browser, calls our contract over a public Ethereum RPC, and tells them one of three things:

- **ANCHORED** — the fingerprint is on the chain. The record has not been altered.
- **NOT ANCHORED** — the fingerprint is not on the chain. The record was never registered.
- **HASH MISMATCH** — the page computed a different fingerprint than what's on chain for this record. Someone changed the record after it was anchored.

There is also a "Tamper" button that flips one digit of a sample record so you can watch the verifier change its answer in real time. We use this in the live demo.

The verifier requires no wallet, no private key, and no crypto knowledge. A used-car buyer just sees the record and a green checkmark. They never have to know there is a blockchain involved.

---

## 4. Infrastructure

What our demo uses today:

- **Base** — Coinbase's Ethereum Layer 2. We chose it because gas costs are 50–100x cheaper than Ethereum mainnet, the developer tooling is the same, and Coinbase provides a free test network (Base Sepolia) so we did not need real money for the demo [S2].
- **Hardhat + TypeScript** for development, compilation, and testing.
- **OpenZeppelin's MerkleProof library** for the Merkle proof verification math.

What a real production deployment would also need (we did not build these):

- **An identity layer** to bind records to real-world contributors (mechanics, dealers, inspectors). The Ethereum Attestation Service (EAS) [S6] is the most-used option here.
- **A privacy layer.** VINs can be tied to owners, and EU GDPR Article 17 [S7] gives EU residents a right to have personal data erased. On-chain records are permanent. Our design keeps personal data off-chain and only anchors a fingerprint, which helps, but the existence of the fingerprint itself may still create issues a real lawyer would need to resolve before launching in Europe.
- **Partnerships with auction houses, scrapyards, and state DMVs** to actually populate the database with records.
- **A funding model** for who pays the gas at scale. Possible answers include: the consumer at lookup time, an insurance partner, an OEM, or a small subscription for dealerships.

---

## 5. Pros and cons

### Where blockchain genuinely helps

- **Verifiable by anyone.** The verifier website works with no signup, no payment, and no Carfax account. Anyone holding a record can check it.
- **No single company can rewrite history.** Once a fingerprint is on-chain, no one — including us — can change it. A future buyer of our company cannot quietly delete records.
- **Free reads.** Reading the chain costs nothing. There is no $44.99 paywall.
- **Cheap to write on Layer 2.** Our measured cost per record is fractions of a cent on Base when anchored in batches.
- **Cross-border by default.** A blockchain doesn't care whether the record came from Texas, Mexico, or Germany. A Carfax report often does.

### Where blockchain does not help

- **The record could be wrong.** If someone files an inaccurate record, we anchor the inaccurate record. The blockchain proves the record has not been changed — it does not prove the original was true.
- **The submitter could lie about who they are.** Anyone can submit from any wallet. Solving this requires the identity attestation layer we did not build.
- **Records could be incomplete.** A dishonest seller can file the records that flatter the car and leave out the bad ones. Missing records are not detectable from on-chain data alone.
- **Records can be filed late.** A record filed today only proves the record existed by today, not that the underlying event happened today. To pin down the actual event time, an independent witness (an inspector, an insurance adjuster, a DMV record) would have to attest to it close to the event.
- **Privacy.** GDPR's right to erasure conflicts with on-chain immutability. Keeping personal data off-chain helps, but a strict legal reading of the regulation may still apply to the on-chain anchor.
- **Trust assumptions move, they don't disappear.** Users no longer have to trust Carfax. They do have to trust that Ethereum and Base will keep operating. These are weaker assumptions because no single company can fail catastrophically and take the system down, but they are still assumptions.

### What we did not build

We tried to be straightforward with the professor about what we could finish in the time we had. The original proposal had six features (anchoring, identity, contributor reputation, privacy, fraud detection, and a full app). After Prof. Zetlin-Jones's feedback we narrowed to anchoring — the layer the other five would have to build on.

Things we deferred:

- A side-by-side gas-cost comparison between Ethereum mainnet, Base, and an alternative timestamping system (OpenTimestamps, which uses Bitcoin).
- A full web app for contributors. Our verifier is read-only.
- The identity attestation layer (EAS integration).
- A token of any kind. We deliberately do not have a token because every prior blockchain vehicle history project that launched one stalled, and the academic and trade press attribute a lot of those failures to the token model.

These are real gaps. We chose to spend our time on a working contract, a real on-chain deployment, and a working verifier UI rather than a broader but shallower demo.

---

## 6. Conclusion

A used-car buyer should not have to depend on one private company to know whether a vehicle's history is what the seller claims. Anchoring vehicle history records on a public blockchain means anyone can verify a record without relying on Carfax, the seller, or us. Our deployed contract and verifier demonstrate the mechanism end to end, on a real public test network, with real measured per-record costs that are small compared to the size of the vehicle history market.

Anchoring by itself is not a finished product. It does not prove records are true, complete, or filed by the right person. Those are separate problems and we did not solve them. They are also problems that any solution — blockchain or otherwise — would have to address. What we did build is the foundation layer those other features would have to sit on, and the foundation works.

---

## Appendix A — Code

| Artifact | Path |
|---|---|
| Smart contract | `anchor/contracts/RecordAnchor.sol` |
| TypeScript record canonicalizer | `anchor/src/canonicalize.ts` |
| Hash function | `anchor/src/hash.ts` |
| Tests (TypeScript ↔ Solidity hash parity, contract behavior) | `anchor/test/` |
| Deploy script | `anchor/scripts/deploy.ts` |
| Single-record anchor script | `anchor/scripts/anchor-one.ts` |
| Batch anchor script | `anchor/scripts/anchor-batch.ts` |
| Static verifier page | `anchor/verifier/index.html` |
| VIN search page | `anchor/verifier/search.html` |
| Sample records (for the demo) | `anchor/verifier/records.json` |
| Deployment record (address, tx hash, block, gas) | `anchor/deployments.json` |

To run locally: `cd anchor && npm install && npx hardhat test` runs the unit tests, including the test that confirms our TypeScript-side hash matches the Solidity-side hash.

To re-deploy (you do not need to — ours is already public): copy `.env.example` to `.env`, fill in an RPC URL and a testnet private key funded from a Base Sepolia faucet, then run `npx hardhat run scripts/deploy.ts --network baseSepolia`.

The deployed contract on Base Sepolia: [0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF](https://sepolia.basescan.org/address/0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF).

A representative anchored-record transaction: [0xad6fd03965116b763ad9e7e34a86d3895de7a5a8dae5a5997ee37c88c4a02676](https://sepolia.basescan.org/tx/0xad6fd03965116b763ad9e7e34a86d3895de7a5a8dae5a5997ee37c88c4a02676).

---

## Appendix B — Sources

[S1] "Carfax hit with $50 million antitrust lawsuit by 120 dealerships," *Automotive News*, April 24, 2013. https://www.autonews.com/article/20130424/RETAIL07/130429941/carfax-hit-with-50-million-antitrust-lawsuit-by-120-dealerships/

[S2] "Base Documentation," Base / Coinbase. https://docs.base.org/get-started/base

[S3] "Hashing with Keccak256," Solidity by Example. https://solidity-by-example.org/hashing/

[S4] "How Much Is a Carfax Report?" VinAudit, price tracker (current as of December 14, 2024). https://www.vinaudit.com/how-much-is-a-carfax-report

[S5] *Preliminary Report: The Incidence Rate of Odometer Fraud*, DOT HS 809 441, NHTSA Office of Programs and Policy, April 2002. https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/809441

[S6] "Welcome to EAS," Ethereum Attestation Service official documentation. https://docs.attest.org/

[S7] "Article 17 — Right to erasure ('right to be forgotten')," Regulation (EU) 2016/679 (GDPR). https://gdpr-info.eu/art-17-gdpr/

Claims tagged [S?] in this paper (Carfax market share specifics, NMVTIS, RFC 3161 timestamp authorities, the prior carVertical / VINchain project descriptions) are drawn from public industry knowledge that we have not traced back to a single specific cite-able source. We chose to mark them as unsourced rather than invent citations.
