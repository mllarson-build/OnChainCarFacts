/**
 * Anchors one sample record on the deployed contract.
 * Use this to confirm the deploy works end-to-end before the full M6 measurement.
 *
 * Usage: npx hardhat run scripts/anchor-one.ts --network baseSepolia
 */
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { hashRecord } from "../src/hash";
import { VehicleRecord } from "../src/types";

const SAMPLE: VehicleRecord = {
  schemaVersion: "1.0",
  recordId: "550e8400-e29b-41d4-a716-446655440000",
  vin: "1HGCM82633A004352",
  eventType: "service",
  location: { countryCode: "US", adminArea: "TX", postalCode: "75001" },
  mileage: 45000,
  odometerUnit: "mi",
  timestamp: "2025-06-15T10:30:00-05:00",
  recordCreatedAt: "2025-06-15T11:00:00-05:00",
  contributorAddress: "0x1234567890abcdef1234567890abcdef12345678",
  previousRecordHash: null,
  sourceIdentifier: "INV-2025-0042",
};

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

  const hash = hashRecord(SAMPLE);
  console.log(`Network:        ${network}`);
  console.log(`Contract:       ${deployment.address}`);
  console.log(`Record VIN:     ${SAMPLE.vin}`);
  console.log(`Record hash:    ${hash}`);

  const contract = await hre.ethers.getContractAt(
    "RecordAnchor",
    deployment.address
  );

  // Check if already anchored
  const [existing] = await contract.getAnchor(hash);
  if (existing > 0n) {
    console.log(`\n⚠ Already anchored at timestamp ${existing}. Nothing to do.`);
    return;
  }

  console.log(`\nAnchoring...`);
  const tx = await contract.anchor(hash);
  console.log(`  Tx hash:  ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`  Block:    ${receipt?.blockNumber}`);
  console.log(`  Gas used: ${receipt?.gasUsed}`);

  // Read it back
  const [ts, bn, submitter] = await contract.getAnchor(hash);
  console.log(`\n✓ Verified on-chain:`);
  console.log(`  Timestamp:   ${ts} (${new Date(Number(ts) * 1000).toISOString()})`);
  console.log(`  Block:       ${bn}`);
  console.log(`  Submitter:   ${submitter}`);

  const explorers: Record<string, string> = {
    sepolia: "https://sepolia.etherscan.io",
    baseSepolia: "https://sepolia.basescan.org",
  };
  const explorer = explorers[network];
  if (explorer) {
    console.log(`\n  Tx on explorer: ${explorer}/tx/${tx.hash}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
