/**
 * Anchors a batch of demo records on the deployed contract.
 * Skips any record whose hash is already anchored.
 *
 * Usage: npx hardhat run scripts/anchor-batch.ts --network baseSepolia
 */
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { hashRecord } from "../src/hash";
import { VehicleRecord } from "../src/types";

const RECORDS: VehicleRecord[] = [
  {
    schemaVersion: "1.0",
    recordId: "7c2a1f4b-9d3e-4a8c-b1f2-2e5d6a7b8c91",
    vin: "5YJ3E1EA7KF315872",
    eventType: "service",
    location: { countryCode: "US", adminArea: "CA", postalCode: "94025" },
    mileage: 28450,
    odometerUnit: "mi",
    timestamp: "2025-09-12T14:15:00-07:00",
    recordCreatedAt: "2025-09-12T14:45:00-07:00",
    contributorAddress: "0xabcdef0123456789abcdef0123456789abcdef01",
    previousRecordHash: null,
    sourceIdentifier: "RO-2025-8841",
  },
  {
    schemaVersion: "1.0",
    recordId: "a4b9c2d1-6e7f-48a3-9c5d-1f3e8b2a4d67",
    vin: "WBA8E9C50GK647391",
    eventType: "accident",
    location: { countryCode: "US", adminArea: "NY", postalCode: "10001" },
    mileage: 67200,
    odometerUnit: "mi",
    timestamp: "2025-11-03T08:22:00-05:00",
    recordCreatedAt: "2025-11-03T16:10:00-05:00",
    contributorAddress: "0x9876543210fedcba9876543210fedcba98765432",
    previousRecordHash: null,
    sourceIdentifier: "POLICE-NYC-2025-114502",
  },
  {
    schemaVersion: "1.0",
    recordId: "e8f1a2b3-4c5d-6e7f-8091-a2b3c4d5e6f7",
    vin: "1FTFW1ET5DFA12345",
    eventType: "inspection",
    location: { countryCode: "US", adminArea: "PA", postalCode: "19103" },
    mileage: 102875,
    odometerUnit: "mi",
    timestamp: "2026-01-20T09:00:00-05:00",
    recordCreatedAt: "2026-01-20T09:30:00-05:00",
    contributorAddress: "0x0011223344556677889900aabbccddeeff001122",
    previousRecordHash: null,
    sourceIdentifier: "PA-INSP-2026-00773",
  },
];

async function main() {
  const network = hre.network.name;
  const deploymentsFile = path.join(__dirname, "..", "deployments.json");

  if (!fs.existsSync(deploymentsFile)) {
    throw new Error("deployments.json not found. Run scripts/deploy.ts first.");
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsFile, "utf8"));
  const deployment = deployments[network];
  if (!deployment) {
    throw new Error(`No deployment recorded for network "${network}".`);
  }

  console.log(`Network:   ${network}`);
  console.log(`Contract:  ${deployment.address}`);
  console.log(`Records:   ${RECORDS.length}\n`);

  const contract = await hre.ethers.getContractAt(
    "RecordAnchor",
    deployment.address
  );

  const explorers: Record<string, string> = {
    sepolia: "https://sepolia.etherscan.io",
    baseSepolia: "https://sepolia.basescan.org",
  };
  const explorer = explorers[network];

  let anchored = 0;
  let skipped = 0;

  for (let i = 0; i < RECORDS.length; i++) {
    const rec = RECORDS[i];
    const hash = hashRecord(rec);
    console.log(`[${i + 1}/${RECORDS.length}] VIN=${rec.vin} (${rec.eventType})`);
    console.log(`  hash: ${hash}`);

    const [existing] = await contract.getAnchor(hash);
    if (existing > 0n) {
      console.log(`  ⚠ already anchored at ${existing} — skipping\n`);
      skipped++;
      continue;
    }

    const tx = await contract.anchor(hash);
    const receipt = await tx.wait();
    console.log(`  ✓ tx ${tx.hash}`);
    console.log(`    block ${receipt?.blockNumber}, gas ${receipt?.gasUsed}`);
    if (explorer) console.log(`    ${explorer}/tx/${tx.hash}`);
    console.log();
    anchored++;
  }

  console.log(`Done. Anchored ${anchored}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
