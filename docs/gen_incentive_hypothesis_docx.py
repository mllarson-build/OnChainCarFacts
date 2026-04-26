"""
Generates OnChainCarFacts-Incentive-Hypothesis.docx.

Prof. Ariel asked during post-video Q&A (2026-04-20) for a hypothesis of how
the system might incentivize the right contributors on-chain. This doc is
that hypothesis. It explores selection, verification, and reward mechanisms,
then proposes a recommended design.

Implementation is NOT in scope for the final project. This is a design
hypothesis document only.
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches

OUTPUT = "OnChainCarFacts-Incentive-Hypothesis.docx"

doc = Document()

style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(11)

MONO = "Consolas"


def mono(paragraph, text):
    run = paragraph.add_run(text)
    run.font.name = MONO
    run.font.size = Pt(10)
    return run


def italic(paragraph, text, color=(0x55, 0x55, 0x55)):
    run = paragraph.add_run(text)
    run.italic = True
    run.font.color.rgb = RGBColor(*color)
    return run


def callout(text):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    run = p.add_run(text)
    run.italic = True
    run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    return p


def table(headers, rows, style_name="Light Grid Accent 1"):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = style_name
    t.autofit = True
    hdr = t.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = h
        for p in hdr[i].paragraphs:
            for r in p.runs:
                r.bold = True
    for ri, row in enumerate(rows, start=1):
        cells = t.rows[ri].cells
        for ci, val in enumerate(row):
            cells[ci].text = val
    return t


# ---------- Title ----------
doc.add_heading("Incentive Hypothesis — Who Contributes, Who Verifies, Who Gets Paid", level=0)

sub = doc.add_paragraph()
italic(
    sub,
    "OnChainCarFacts · hypothesis doc requested by Prof. Ariel in post-video Q&A (2026-04-20). "
    "Implementation is not in scope for the final project; this document proposes a design only."
)

doc.add_paragraph(
    "The final project narrowed to Problem 1 (record anchoring) after the 2026-04-15 "
    "scope review. The deployed contract on Base Sepolia is intentionally permissionless "
    "— any address can anchor any hash — because the tamper-evidence property the project "
    "evaluates does not depend on who submits. That said, a production system would need "
    "to answer three coupled questions about contributors and their incentives. This doc "
    "lays out those questions, surveys candidate mechanisms, and proposes a hybrid design. "
    "Attribution tags follow docs/SOURCES.md."
)

# ---------- 1. The three coupled questions ----------
doc.add_heading("1. The three questions a contributor-incentive design must answer", level=1)

doc.add_paragraph(
    "Any production vehicle-history network has to make a decision on each of the "
    "following, and the decisions are not independent:"
)

doc.add_paragraph("", style="List Number").add_run("Selection — who is allowed to submit a record?").bold = True
doc.add_paragraph("", style="List Number").add_run("Verification — how are bad records caught and challenged?").bold = True
doc.add_paragraph("", style="List Number").add_run("Reward — who pays, who earns, for what, and from where?").bold = True

doc.add_paragraph(
    "The coupling is the hard part. A permissive selection policy (anyone can submit) "
    "demands a strong verification policy or the data is noise. A strict selection policy "
    "(only 5 whitelisted state DMVs) pushes the verification problem back onto the "
    "gatekeeper and limits the dataset to what those 5 entities choose to share. Rewards "
    "have to be large enough to attract contributors but small enough that spam is not "
    "profitable. [CC]"
)

# ---------- 2. Design dimensions ----------
doc.add_heading("2. Design dimensions", level=1)

doc.add_paragraph(
    "Every candidate mechanism can be placed on six axes. Most existing blockchain "
    "data systems sit toward one end on each; the interesting hypothesis for car-facts "
    "is that different event types should sit at different points. [CC]"
)

table(
    ["Dimension", "Open end", "Closed end"],
    [
        ["Entry barrier", "Anyone with a wallet", "Curated registry of approved issuers"],
        ["Economic commitment", "No stake", "Bonded stake with slashing"],
        ["Trust source", "Crypto-economic (stake + challenges)", "Real-world identity (KYC'd businesses)"],
        ["Reward source", "Consumer pays per read", "Protocol token emission / subsidy"],
        ["Verification actor", "Anyone can challenge (TCR-style)", "Appointed curators / DAO / oracle committee"],
        ["Privacy of submitter", "Pseudonymous", "KYC-linked identity"],
    ],
)

# ---------- 3. Mechanism catalog ----------
doc.add_heading("3. Mechanism catalog", level=1)

doc.add_paragraph(
    "Eight mechanisms worth knowing. For each: how it works in one line, strengths, "
    "weaknesses, real-world examples, and fit for vehicle-history data."
)


def mechanism(
    title, how, strengths, weaknesses, examples, fit
):
    p = doc.add_paragraph()
    p.add_run(title).bold = True

    doc.add_paragraph().add_run("How it works: ").italic = True
    doc.paragraphs[-1].add_run(how)

    doc.add_paragraph().add_run("Strengths: ").italic = True
    doc.paragraphs[-1].add_run(strengths)

    doc.add_paragraph().add_run("Weaknesses: ").italic = True
    doc.paragraphs[-1].add_run(weaknesses)

    doc.add_paragraph().add_run("Examples: ").italic = True
    doc.paragraphs[-1].add_run(examples)

    doc.add_paragraph().add_run("Fit for car-facts: ").italic = True
    doc.paragraphs[-1].add_run(fit)


doc.add_heading("A. Permissioned allowlist (trusted issuer registry)", level=2)
mechanism(
    title="",
    how="An on-chain registry of approved submitter addresses maintained by a governance body. Only allowlisted addresses can call anchorRecord. Each submitter is a known real-world entity (state DMV, dealership chain, insurer, inspection station).",
    strengths="Highest data quality. Legal accountability per submitter. Compatible with existing industry workflows where specific entities already have authority to issue records.",
    weaknesses="Centralizes power in the registry maintainer. Slow to onboard new issuers. Excludes long-tail contributors (individual owners, independent shops, enthusiasts) whose data is often the only signal available.",
    examples="W3C Verifiable Credentials issuer registries [S?:w3c-vc]; Sign Protocol schema registries [S?:sign-protocol]; Sovrin Foundation network [S?:sovrin].",
    fit="Best for authoritative records (title transfer, inspection passes) where the data source has legal standing.",
)

doc.add_heading("B. Open permissionless + reputation-weighted", level=2)
mechanism(
    title="",
    how="Anyone can submit. Each submitter has an on-chain reputation score that updates based on challenge outcomes, volume, and age. Readers filter history by reputation threshold.",
    strengths="Captures long-tail contributors. No gatekeeping bottleneck. Reputation emerges organically over time.",
    weaknesses="Cold-start problem (new submitters have no reputation so their records are ignored). Sybil attacks — one actor creates many addresses to inflate an aggregate score. Reputation scoring functions are subjective and can be gamed.",
    examples="Gitcoin Passport [S?:gitcoin-passport]; Stack Overflow reputation; DAO contributor-reputation frameworks.",
    fit="Good for service records, enthusiast-contributed mileage, crowd-sourced corrections to authoritative sources.",
)

doc.add_heading("C. Staked submission with slashing (token-curated registry)", level=2)
mechanism(
    title="",
    how="To submit a record, the submitter stakes a deposit (ETH or a protocol token). If no one challenges within a window (e.g., 7 days), the stake is returned plus a small reward. If a challenger proves the record false, the stake is slashed and partially awarded to the challenger.",
    strengths="Crypto-economic incentive aligns submitters. Anyone can challenge — verification is permissionless too. Self-funding: spam is expensive because it costs the spammer their stake.",
    weaknesses="Requires capital to participate, excluding some legitimate submitters. The challenge mechanism needs an adjudicator (another oracle, a Kleros-style court, or protocol governance). False challenges waste resources and can be weaponized against honest submitters.",
    examples="Kleros court [S?:kleros]; token-curated registries (TCR) [S?:tcr]; optimistic rollup fraud-proof windows [S?:optimistic-rollup].",
    fit="Strong for odometer readings and mileage claims, where truth is verifiable after the fact (e.g., odometer can only go up) but not automatically.",
)

doc.add_heading("D. Multi-party attestation (co-signed records)", level=2)
mechanism(
    title="",
    how="A record is only considered valid once N independent parties have co-signed. For example, a title transfer requires signatures from the seller, the buyer, and the state DMV. The on-chain schema references all signatures or signature hashes.",
    strengths="No single party can forge a valid record. Each signer has reputational and legal skin in the game. Maps cleanly to existing paper workflows (title transfers are already co-signed by buyer, seller, and notary).",
    weaknesses="Coordination overhead: getting 3+ parties to sign at the same time is operationally difficult. Unclear who pays each signer. Absent-signer failure modes need handling.",
    examples="Ethereum Attestation Service [S?:eas]; Sign Protocol [S?:sign-protocol]; x509 certificate co-signing; notarized bills of sale.",
    fit="Excellent for title transfer, total-loss declarations, liens, and insurance claims. Weak for high-frequency events like routine service.",
)

doc.add_heading("E. Hardware attestation (trusted device signing)", level=2)
mechanism(
    title="",
    how="A tamper-resistant hardware device (OBD-II dongle, inspection scanner, body-shop diagnostic tool) signs records with a device-specific key. The device manufacturer maintains a registry of legitimate device public keys. The contract verifies the device signature against that registry.",
    strengths="Very hard to forge without physical device access. Mileage and diagnostic data can be read mechanically, eliminating the human-honesty question for those fields. Scales without requiring trust in a central operator per record.",
    weaknesses="The hardware supply chain becomes a new attack surface. The device manufacturer is itself a centralizing trust anchor (key compromise = systemic failure). Some physical tampering is still possible.",
    examples="DIMO Network [S?:dimo]; IoTeX [S?:iotex]; automotive HSM-based odometer pilots.",
    fit="Excellent for odometer readings, diagnostic trouble codes, emissions-test pass/fail. Not applicable to historical events (accidents, title transfers).",
)

doc.add_heading("F. Oracle network (Chainlink-style aggregation)", level=2)
mechanism(
    title="",
    how="A decentralized network of paid oracles fetches records from external sources (DMV APIs, insurer databases, state VIN registries). Multiple oracles submit the same record; on-chain aggregation (median, majority) produces a canonical value. Oracles earn fees; misbehaving oracles are slashed from a bonded stake.",
    strengths="Composable with existing off-chain data that already has authority. Economic incentive to report honestly. Cross-validation built in via N-of-M aggregation.",
    weaknesses="Requires centralized source data to already exist (the oracle just moves trust from one place to another). The oracle network itself needs economic security, which is a separate protocol-design problem.",
    examples="Chainlink [S?:chainlink]; API3 [S?:api3]; Pyth Network [S?:pyth].",
    fit="Good for records that already exist in an authoritative off-chain system (state DMV records, NMVTIS data, insurer databases).",
)

doc.add_heading("G. Zero-knowledge credential proof", level=2)
mechanism(
    title="",
    how="Submitters hold an off-chain credential ('I am a licensed mechanic in California'). They prove on-chain that they hold a credential of the required type without revealing their identity. The protocol verifies the ZK proof without knowing who signed.",
    strengths="Privacy-preserving — submitters can contribute without deanonymizing themselves. Compatible with real-world professional licensing (states already license mechanics, inspectors). Resistant to address-level sybil attacks because the credential is the sybil resistance.",
    weaknesses="Still depends on someone issuing the credential in the first place — just moves the gatekeeping problem. ZK tooling is maturing but still complex to integrate. Credential revocation is an open design problem.",
    examples="Polygon ID [S?:polygon-id]; Semaphore [S?:semaphore]; zkPass [S?:zkpass].",
    fit="Promising for privacy-preserving contributions from licensed professionals (mechanics, inspectors, appraisers) who don't want their business records public.",
)

doc.add_heading("H. Pure market (reader pays, submitter earns)", level=2)
mechanism(
    title="",
    how="Consumers (used-car buyers, insurers, banks) pay a per-query fee to unlock a VIN's history. Fees are routed to the submitters of the records in that history. No token, no staking — just pay-per-read.",
    strengths="Simple. Self-funding. Natural rate limit on spam because submitters only earn if someone pays to read.",
    weaknesses="Cold start: an empty ledger has no value, so nobody submits. Freeloader problem: one reader can screenshot or re-share results, collapsing willingness to pay. High-value records (clean Ferraris) are cherry-picked while common records are neglected.",
    examples="Ocean Protocol [S?:ocean]; Streamr [S?:streamr].",
    fit="Could layer on top of any selection mechanism as the reward side, but cannot stand alone as the full design.",
)

# ---------- 4. Composition ----------
doc.add_heading("4. Proposed composition — one size does not fit all", level=1)

doc.add_paragraph(
    "The central hypothesis of this doc: different event types in a vehicle's history "
    "have different trust requirements, different existing authorities, and different "
    "natural fund sources. The right answer is a composition of mechanisms, not a single "
    "one. [OWN]"
)

doc.add_paragraph(
    "The table below proposes one such composition. It is a hypothesis, not a validated "
    "design — each row would need its own pilot to confirm the economics work."
)

table(
    ["Event type", "Selection", "Verification", "Reward source"],
    [
        ["Title transfer", "Allowlist (state DMVs + notaries)", "Multi-party co-sign (DMV + buyer + seller)", "Bundled into state title fee"],
        ["Odometer reading (mechanical)", "Hardware attestation (OBD-II)", "Device signature verification", "Insurer subsidy or reader-pays"],
        ["Odometer reading (manual)", "Open permissionless", "Staked submission + TCR challenge", "Reader-pays with stake return"],
        ["Service record", "Open permissionless + reputation", "Staked submission (shop bond)", "Reader-pays + reputation value"],
        ["Accident", "Allowlist (insurer + body shop)", "Multi-party co-sign", "Insurance subsidy"],
        ["Inspection", "Allowlist (licensed stations)", "Hardware attestation (scanner)", "Bundled into state inspection fee"],
        ["Total loss / salvage / junk", "Allowlist (insurer + DMV)", "Multi-party co-sign", "Insurance subsidy"],
    ],
)

doc.add_paragraph(
    "Read this table as four overlapping networks (authoritative issuers, hardware "
    "attesters, staked submitters, reader-paid markets) all writing into the same "
    "RecordAnchor contract. The contract does not need to know which mechanism produced "
    "a given record; downstream readers filter by the metadata they trust. [CC]"
)

# ---------- 5. Reward sources in depth ----------
doc.add_heading("5. Where does the money come from?", level=1)

doc.add_paragraph(
    "Rewarding contributors requires a funding source. Five plausible candidates, "
    "ranked by how well they match vehicle-history economics specifically:"
)

table(
    ["Source", "How it works", "Fit for car-facts"],
    [
        [
            "Insurance subsidy",
            "Insurers pay per verified record; recoup via lower fraud losses.",
            "Strong. Insurers already pay ~$6B/yr in vehicle-related fraud losses [S?:vehicle-fraud-cost]; even single-digit % reduction justifies per-record payments.",
        ],
        [
            "Regulatory mandate",
            "State mandates participation from DMVs, insurers, inspection stations; funding built into existing fees.",
            "Strong for jurisdictions where DMV records are already public-interest data. Requires legal framework that does not exist today.",
        ],
        [
            "Reader pay-per-query",
            "Buyer or bank pays $X to unlock a VIN's full history; revenue split to contributors.",
            "Moderate. Cold-start problem is real. Could work as a secondary revenue stream on top of other sources.",
        ],
        [
            "Marketplace fee split",
            "Dealer platforms, trade-in services, auction sites pay for data; revenue split with contributors.",
            "Moderate. Dependent on a single large platform reaching exclusivity, which reintroduces centralization.",
        ],
        [
            "Protocol token emission",
            "Mint a protocol token; distribute to contributors as inflationary subsidy until organic demand catches up.",
            "Weak. Crypto-native users understand token emission; vehicle-history buyers do not. Token volatility misaligns incentives with the underlying service.",
        ],
    ],
)

doc.add_paragraph(
    "Most production systems would combine sources 1 and 2 (insurance subsidy + "
    "regulatory mandate) as the anchor, with source 3 (reader pay-per-query) as a "
    "secondary layer for high-intent buyers. Token emission is specifically worth "
    "avoiding because the user base is traditional consumers, not crypto speculators. [OWN]"
)

# ---------- 6. Verification / challenge ----------
doc.add_heading("6. Who catches bad records?", level=1)

doc.add_paragraph(
    "Verification is the most underweighted part of most incentive-design proposals. "
    "Saying 'anyone can challenge' is not enough — someone has to actually do it, and "
    "they need to profit from doing it. A robust system layers multiple checkers:"
)

vrows = [
    (
        "Automated anomaly detection",
        "AI or rule-based checks for impossible values: mileage going down, "
        "overlapping service dates, accident reported before vehicle manufactured, "
        "VIN checksum failures. Catches the bulk of obvious fraud cheaply. [CC]"
    ),
    (
        "Paid challengers",
        "Specialists scan records for subtle discrepancies and earn from successful "
        "challenges (TCR-style slashing payout). Scales better than salaried "
        "reviewers because only profitable challenges are pursued. [CC]"
    ),
    (
        "Downstream cross-reference",
        "Insurance claims automatically cross-referenced against the on-chain service "
        "history; discrepancies flagged. The insurance company is already "
        "investigating fraud; the on-chain record gives them a cheap additional signal. [CC]"
    ),
    (
        "Community reports",
        "Any user (buyer, owner, enthusiast) can flag a record. Useful long-tail "
        "coverage for cases automated checks miss. Requires a triage process so flag "
        "spam does not overwhelm legitimate reports. [CC]"
    ),
    (
        "Competing submitters",
        "If two different dealerships both attest to the same sale, mismatches in "
        "their records are visible. Natural cross-validation without any additional "
        "mechanism. [CC]"
    ),
]

for title, body in vrows:
    p = doc.add_paragraph(style="List Bullet")
    p.add_run(title + " — ").bold = True
    p.add_run(body)

# ---------- 7. Recommended design ----------
doc.add_heading("7. Recommended design", level=1)

doc.add_paragraph(
    "Synthesizing the above, here is one specific design the team would take into a pilot:"
)

rd = doc.add_paragraph()
rd.add_run("Core principles").bold = True

for line in [
    "Permissionless anchoring at the contract level (keep the current design).",
    "Authority and reward layered on top via off-chain metadata, not enforced at the smart-contract level.",
    "Mechanism choice depends on event type — one size does not fit all.",
    "Funding primarily from insurer subsidy and regulatory mandate, not consumer pay-per-query or token emission.",
]:
    doc.add_paragraph(line, style="List Bullet")

rd2 = doc.add_paragraph()
rd2.add_run("Concretely, the pilot would:").bold = True

for line in [
    "Partner with one state DMV to anchor title-transfer records (multi-party co-sign).",
    "Partner with one insurer to anchor accident and total-loss records (allowlisted submitter, insurer-subsidized).",
    "Partner with one OBD-II device maker (DIMO-style) for hardware-attested mileage readings.",
    "Open a permissionless lane for service records, with per-shop reputation tracking.",
    "Layer automated anomaly detection over all four lanes, with a small bounty for external anomaly reports.",
]:
    doc.add_paragraph(line, style="List Bullet")

doc.add_paragraph(
    "Reader-pay-per-query and protocol-token emission are explicitly not part of this "
    "hypothesis. Both introduce failure modes (cold start, speculative mispricing) that "
    "the insurer-plus-mandate funding model avoids. [OWN]"
)

# ---------- 8. Questions a committee would ask ----------
doc.add_heading("8. Questions a reviewer would press on", level=1)

doc.add_paragraph(
    "Before anyone funds this design, these questions would need answers. Listing them "
    "here so the hypothesis is honest about what it does not yet address:"
)

for q in [
    "What is the legal standing of an on-chain record in any US state today? (likely: none)",
    "How do existing incumbents (Carfax, AutoCheck, NMVTIS) respond to a competing network and what are their switching costs?",
    "Exactly how much does an insurer save per verified accident record, and is it more than the cost of anchoring?",
    "How are clerical corrections handled (VIN typo, wrong mileage) without creating a fraud-laundering loophole?",
    "What privacy protections apply to the private fields (owner name, address) that stay off-chain?",
    "What is the expected read-to-write ratio, and does reader-pay economics still work at that ratio?",
    "What is the sybil-resistance story for the open service-record lane, beyond address-level reputation?",
    "How is reputation bootstrapped for a brand-new but legitimate submitter (new mechanic, new dealership)?",
]:
    doc.add_paragraph(q, style="List Number")

# ---------- 9. Relationship to the current project ----------
doc.add_heading("9. Relationship to the current project deliverable", level=1)

doc.add_paragraph(
    "The final project narrowed to Problem 1 (record anchoring) and evaluates only the "
    "tamper-evidence property. The current RecordAnchor contract is permissionless by "
    "design, and the verifier web demo treats all anchors as equally weighted — because "
    "for the narrow question 'is this record on-chain and unchanged', contributor identity "
    "does not matter."
)

doc.add_paragraph(
    "This document is a hypothesis about what would need to be added to move beyond "
    "tamper-evidence to trustworthiness — who to trust, who to reward, who to catch. "
    "It was requested during Prof. Ariel's post-video Q&A on 2026-04-20 and will appear "
    "in the final report as the 'proposed incentive design' section, not as implemented "
    "code."
)

# ---------- 10. Sources ----------
doc.add_heading("10. Source placeholders", level=1)

doc.add_paragraph(
    "Every [S?:*] tag above marks a claim or mechanism that needs a verified source "
    "before this doc is publication-ready. The specific placeholders introduced here:"
)

placeholders = [
    "[S?:w3c-vc] — W3C Verifiable Credentials data model spec.",
    "[S?:sign-protocol] — Sign Protocol (successor to EAS for on-chain attestations).",
    "[S?:sovrin] — Sovrin Foundation governance framework.",
    "[S?:gitcoin-passport] — Gitcoin Passport reputation / stamp system.",
    "[S?:kleros] — Kleros decentralized arbitration protocol.",
    "[S?:tcr] — Token-Curated Registries (Mike Goldin, 2017).",
    "[S?:optimistic-rollup] — Optimistic rollup fraud-proof mechanism.",
    "[S?:eas] — Ethereum Attestation Service.",
    "[S?:dimo] — DIMO Network OBD-II vehicle data protocol.",
    "[S?:iotex] — IoTeX hardware-attested device network.",
    "[S?:chainlink] — Chainlink decentralized oracle network.",
    "[S?:api3] — API3 first-party oracle protocol.",
    "[S?:pyth] — Pyth Network price feed protocol.",
    "[S?:polygon-id] — Polygon ID ZK-credential framework.",
    "[S?:semaphore] — Semaphore protocol for anonymous signaling.",
    "[S?:zkpass] — zkPass ZK proof of credential protocol.",
    "[S?:ocean] — Ocean Protocol data market.",
    "[S?:streamr] — Streamr decentralized data streaming.",
    "[S?:vehicle-fraud-cost] — annual US vehicle-related fraud loss estimate.",
]
for p in placeholders:
    doc.add_paragraph(p, style="List Bullet")

doc.add_paragraph(
    "Mechanism descriptions and the four-lane composition were co-developed with Claude "
    "and accepted after review [CC]. The composition table (§4), the reward-source "
    "ranking (§5), and the recommended pilot (§7) are the user's synthesis decisions "
    "[OWN]. Specific protocol references all need [S?] → [S#] upgrades before final "
    "report submission."
)

doc.save(OUTPUT)
print(f"Wrote {OUTPUT}")
