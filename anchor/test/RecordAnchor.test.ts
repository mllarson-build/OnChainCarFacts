import { expect } from "chai";
import hre from "hardhat";
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

describe("RecordAnchor", function () {
  let contract: any;
  let hash: string;

  before(async function () {
    const Factory = await hre.ethers.getContractFactory("RecordAnchor");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    hash = hashRecord(SAMPLE);
  });

  // --- Option 1: single anchor ---

  describe("anchor(bytes32)", function () {
    it("anchors a hash and emits Anchored event", async function () {
      const tx = await contract.anchor(hash);
      const receipt = await tx.wait();

      console.log(`    Gas used (anchor single): ${receipt.gasUsed}`);

      await expect(tx)
        .to.emit(contract, "Anchored")
        .withArgs(hash, (v: any) => v > 0, (v: any) => v > 0, (v: any) => true);
    });

    it("reverts on duplicate anchor", async function () {
      await expect(contract.anchor(hash)).to.be.revertedWith("Already anchored");
    });

    it("getAnchor returns stored data for known hash", async function () {
      const [ts, bn, submitter] = await contract.getAnchor(hash);
      expect(ts).to.be.greaterThan(0);
      expect(bn).to.be.greaterThan(0);
      expect(submitter).to.not.equal(hre.ethers.ZeroAddress);
    });

    it("getAnchor returns zeros for unknown hash", async function () {
      const unknownHash =
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const [ts, bn, submitter] = await contract.getAnchor(unknownHash);
      expect(ts).to.equal(0);
      expect(bn).to.equal(0);
      expect(submitter).to.equal(hre.ethers.ZeroAddress);
    });
  });

  // --- Option 3: Merkle root ---

  describe("anchorRoot + verifyLeaf", function () {
    const leaf1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("record-a"));
    const leaf2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("record-b"));

    let root: string;
    let proof: string[];

    before(function () {
      // 2-leaf tree: root = hash(sort(leaf1, leaf2))
      const sorted =
        leaf1.toLowerCase() < leaf2.toLowerCase()
          ? [leaf1, leaf2]
          : [leaf2, leaf1];
      root = hre.ethers.keccak256(
        hre.ethers.solidityPacked(["bytes32", "bytes32"], sorted)
      );
      // proof for leaf1 is [leaf2] (or vice versa, whichever is the sibling)
      proof = leaf1.toLowerCase() < leaf2.toLowerCase() ? [leaf2] : [leaf1];
    });

    it("anchors a root and emits RootAnchored event", async function () {
      const tx = await contract.anchorRoot(root);
      const receipt = await tx.wait();

      console.log(`    Gas used (anchorRoot): ${receipt.gasUsed}`);

      await expect(tx).to.emit(contract, "RootAnchored");
    });

    it("reverts on duplicate root", async function () {
      await expect(contract.anchorRoot(root)).to.be.revertedWith(
        "Root already anchored"
      );
    });

    it("verifyLeaf returns true for valid leaf + proof", async function () {
      const [verified, ts] = await contract.verifyLeaf(leaf1, root, proof);
      expect(verified).to.be.true;
      expect(ts).to.be.greaterThan(0);
    });

    it("verifyLeaf returns false for invalid leaf", async function () {
      const fakeLeaf = hre.ethers.keccak256(
        hre.ethers.toUtf8Bytes("tampered")
      );
      const [verified] = await contract.verifyLeaf(fakeLeaf, root, proof);
      expect(verified).to.be.false;
    });

    it("verifyLeaf returns false for unknown root", async function () {
      const unknownRoot =
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
      const [verified] = await contract.verifyLeaf(leaf1, unknownRoot, proof);
      expect(verified).to.be.false;
    });

    it("getRoot returns stored data for known root", async function () {
      const [ts, bn, submitter] = await contract.getRoot(root);
      expect(ts).to.be.greaterThan(0);
      expect(bn).to.be.greaterThan(0);
      expect(submitter).to.not.equal(hre.ethers.ZeroAddress);
    });
  });
});
