# OnChainCarFacts: A Public, Verifiable Vehicle History Record

**Final Project — Mini8 Blockchain**
**Authors:** [Team]
**Date:** April 2026
**Code:** `anchor/` directory in this repo
**Deployed contract:** `RecordAnchor` at `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF` on Base Sepolia (chain id 84532)

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

## 3. Key components of an open vehicle history system

For an open, blockchain-based vehicle history system to actually replace Carfax for a used-car buyer, five components have to work together. We built the first one. The other four are real and we did not solve them; we describe them here so the boundaries of our contribution are clear.

1. **Record anchoring.** A way to prove that a vehicle history record existed in a specific form at a specific time, with no single company controlling the proof. Detailed in §4 below. Without this layer, none of the other four components work, because there is no fixed reference point that the others can attach claims to.

2. **Identity / attestation.** A way to know who actually filed a record. A record submitted by "John's Auto Body, state-certified inspector #12345" is more useful than a record from an anonymous Ethereum wallet. The standard piece of plumbing for this is the Ethereum Attestation Service (EAS) [S6], where credentialing organizations (state DMVs, mechanic licensing boards, insurance carriers) issue on-chain attestations binding a wallet to a real-world identity.

3. **Reputation / weighting.** A way to weight records by how trustworthy the submitter is. A record from a verified state DMV should count more than a record from a wallet that registered yesterday. This is a layer of scoring logic on top of the identity layer. It does not require new on-chain infrastructure — it can run as off-chain analytics over the anchored record stream.

4. **Privacy.** A way to keep personal data (owner names, addresses, possibly even VINs in jurisdictions that treat them as personal data) out of public view, while still letting buyers verify records. This is where GDPR Article 17 [S7] becomes a real constraint on EU expansion. Possible techniques include hashing identifying fields, off-chain storage of personal data with on-chain commitments, and zero-knowledge proofs that let a buyer verify "this car has no salvage events" without revealing the rest of the history.

5. **Fraud detection.** Data analysis across the record stream to surface patterns that suggest fraud — odometers that decrease, vehicles registered in two countries on the same day, claim history that contradicts service records. This is normal analytics work that runs on top of the anchored record stream and does not require any new on-chain code.

Three observations about this list:

- **Components 2 through 5 all depend on component 1.** Identity attestations have to attest to *something*, and that something is an anchored record. Reputation weights records. Privacy reveals fields of records. Fraud detection analyzes a record stream. This is why we treated anchoring as the foundation worth getting right first.
- **Components 1, 2, and 4 require on-chain infrastructure. Components 3 and 5 do not.** Reputation and fraud detection are off-chain analytics that read the chain. This matters for the cost story: most of the gas budget for a real production system goes to anchoring and identity, not to analytics.
- **Component 5 is roughly what Carfax sells today.** A federated database of records combined with public analytics tools is most of what a Carfax report actually is. The point of the anchoring + identity foundation is to let anyone build that analytics layer, rather than letting one company charge $44.99 a report to be the only one who can.

The next section walks through component 1 — record anchoring — in detail, including the actual contract code we deployed.

---

## 4. What we built (record anchoring, in detail)

Our project is a smart contract that anchors vehicle history records on a public blockchain, plus a static webpage that anyone can use to verify a record. We narrowed the scope after early feedback from Prof. Zetlin-Jones — the original proposal tried to do six things at once, and we are three MBA students with limited Solidity experience. We focused on getting component 1 from the previous section — record anchoring — right.

### 4.1 The basic idea

A vehicle history record is structured data: a VIN, an event type (accident, service, odometer reading, sale, etc.), a date, a location, a mileage, and the address of whoever submitted it. We turn that record into a 32-byte hash using a standard hash function called keccak256 [S3]. The hash changes completely if any character of the record changes.

We store the fingerprint/hash on a public blockchain. The blockchain records the time the hash was stored and which Ethereum address stored it.

To verify a record later, anyone can:

1. Compute the hash of the record they have.
2. Look up the hash on the blockchain.
3. If the hash is on the chain, the record existed in this exact form at or before the recorded blockchain time. If the hash differs, the record has been changed.

The actual record (with personal data) stays in a normal database. Only the hash goes on-chain. This matters for privacy.

### 4.2 The smart contract

Our contract is `RecordAnchor.sol` — about 110 lines of Solidity. It does two things:

1. `anchor(hash)` — stores a single record hash on-chain. Anyone can call this. Each hash can only be stored once.
2. `anchorRoot(root)` — stores a Merkle root, which is a single hash that summarizes a batch of records. This is how we keep costs low when anchoring many records: combine all of them into one Merkle root, then anchor only the root. Later, anyone can prove a specific record was in the batch using a Merkle proof.

The contract is deployed on Base Sepolia (a free Ethereum test network) at `0x1380b4cBC2Bdb10e46F720124C8174bc363aE4bF`. The source code is verified on Basescan, which means anyone can read the actual code, not just compiled bytecode.

#### The four most important lines of code

The entire mechanism described in §4.1 runs through one function:

```solidity
function anchor(bytes32 hash) external {
    require(anchors[hash].timestamp == 0, "Already anchored");
    anchors[hash] = Anchor(block.timestamp, block.number, msg.sender);
    emit Anchored(hash, block.timestamp, block.number, msg.sender);
}
```

Walking through it line by line:

1. **`function anchor(bytes32 hash) external`** — Anyone can call this. There is no admin, no whitelist, no permission system. This is intentional: anchoring is supposed to be censorship-resistant.

2. **`require(anchors[hash].timestamp == 0, "Already anchored")`** — The most important line in the contract. It refuses the transaction if this hash has already been anchored. Without this line, anyone who later discovered an old record could re-anchor it with their own wallet and a fresh timestamp, claiming they were the original filer. The check costs essentially nothing in gas (one storage read) but it is what guarantees that the original submitter and original timestamp can never be overwritten. Every other security property of the system depends on this single line being there.

3. **`anchors[hash] = Anchor(block.timestamp, block.number, msg.sender)`** — Writes three pieces of metadata to permanent on-chain storage: the timestamp the chain assigned to the block, the block number, and the wallet address that paid for the transaction. Note what is *not* written: VINs, mileage, location, owner names. Only the hash and metadata. The actual record content stays in our off-chain database.

4. **`emit Anchored(...)`** — Emits a public log entry. Block explorers like Basescan and our own verifier UI both read these log entries to discover anchors without scanning every storage slot, which would be slow and expensive. This is how the verifier website finds anchored records without trusting any single API.

A related function, `anchorRoot(root)`, does the same thing but for a Merkle root that summarizes a batch of records. Anchoring a batch of 1,000 records as one root costs roughly the same gas as anchoring one record, and any specific record can later be proven to be in the batch using a short Merkle proof (about 10 hashes deep for a batch of 1,000).

A third function, `canonicalHash(...)`, is a Solidity copy of our off-chain hashing logic. It is never called in production. It exists only for tests, which call it with the same inputs used by the JavaScript hashing code in the verifier and assert that both produce byte-identical output. If those ever drift, the verifier silently fails for every record going forward, so we test it explicitly.

### 4.3 What it cost (real numbers from our deployment)

| Operation | Gas used |
|---|---|
| Deploying the contract | 549,670 |
| Anchoring one record (single-hash) | 90,594 |

These are measured from our actual transactions on Base Sepolia. At Base mainnet's typical gas prices (well under a cent per record once batched into a Merkle root), anchoring at the scale of every used-car sale in the US per year is comfortably under $1 million per year in total gas — small relative to a market where Carfax alone sells reports at $44.99 a piece.

### 4.4 The verifier website

`anchor/verifier/index.html` is a static webpage. The user pastes in a record (as JSON), and the page computes the fingerprint in their browser, calls our contract over a public Ethereum RPC, and tells them one of three things:

- **ANCHORED** — the hash is on the chain. The record has not been altered.
- **NOT ANCHORED** — the hash is not on the chain. The record was never registered.
- **HASH MISMATCH** — the page computed a different hash than what's on chain for this record. Someone changed the record after it was anchored.

There is also a "Tamper" button that flips one digit of a sample record so you can watch the verifier change its answer in real time. We use this in the live demo.

The verifier requires no wallet, no private key, and no crypto knowledge. A used-car buyer just sees the record and a green checkmark. They never have to know there is a blockchain involved.

---

## 5. Infrastructure

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

## 6. Pros and cons

### Where blockchain genuinely helps

- **Verifiable by anyone.** The verifier website works with no signup, no payment, and no Carfax account. Anyone holding a record can check it.
- **No single company can rewrite history.** Once a hash is on-chain, no one — including us — can change it. A future buyer of our company cannot quietly delete records.
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

## 7. Conclusion

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
