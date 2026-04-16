import { expect } from "chai";
import hre from "hardhat";
import { hashRecord } from "../src/hash";
import { VehicleRecord, EVENT_TYPES } from "../src/types";

const SAMPLE_RECORDS: VehicleRecord[] = [
  {
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
  },
  {
    schemaVersion: "1.0",
    recordId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    vin: "WVWZZZ3CZWE123456",
    eventType: "accident",
    location: { countryCode: "DE", adminArea: "Bayern" },
    mileage: 120300,
    odometerUnit: "km",
    timestamp: "2025-03-01T14:00:00+01:00",
    recordCreatedAt: "2025-03-02T09:00:00+01:00",
    contributorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    previousRecordHash:
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    sourceIdentifier: "POLICE-RPT-2025-1337",
  },
  {
    schemaVersion: "1.0",
    recordId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    vin: "JM1BK343551234567",
    eventType: "title_transfer",
    location: { countryCode: "US", adminArea: "CA", postalCode: "90210" },
    mileage: 88000,
    odometerUnit: "mi",
    timestamp: "2024-12-01T00:00:00-08:00",
    recordCreatedAt: "2024-12-02T10:00:00-08:00",
    contributorAddress: "0x0000000000000000000000000000000000000001",
    previousRecordHash: null,
    sourceIdentifier: "DMV-TITLE-CA-20241201",
  },
  {
    schemaVersion: "1.0",
    recordId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    vin: "5YJSA1E26HF000001",
    eventType: "odometer_reading",
    location: { countryCode: "US", adminArea: "NV", postalCode: "89101" },
    mileage: 50000,
    odometerUnit: "mi",
    timestamp: "2025-01-15T08:00:00-08:00",
    recordCreatedAt: "2025-01-15T08:05:00-08:00",
    contributorAddress: "0x9999999999999999999999999999999999999999",
    previousRecordHash:
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    sourceIdentifier: "INSP-NV-2025-0100",
  },
  {
    schemaVersion: "1.0",
    recordId: "c56a4180-65aa-42ec-a945-5fd21dec0538",
    vin: "3N1AB7AP8KY250000",
    eventType: "total_loss",
    location: { countryCode: "US", adminArea: "FL", postalCode: "33101" },
    mileage: 120000,
    odometerUnit: "mi",
    timestamp: "2025-09-01T12:00:00-04:00",
    recordCreatedAt: "2025-09-03T09:00:00-04:00",
    contributorAddress: "0x1111111111111111111111111111111111111111",
    previousRecordHash: null,
    sourceIdentifier: "INS-CLAIM-FL-20250901",
  },
];

describe("Hash parity: JS canonicalize+keccak256 == Solidity canonicalHash", function () {
  let contract: any;

  before(async function () {
    const Factory = await hre.ethers.getContractFactory("RecordAnchor");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  for (const [i, record] of SAMPLE_RECORDS.entries()) {
    it(`Record ${i}: ${record.vin} (${record.eventType})`, async function () {
      const jsHash = hashRecord(record);

      const eventIndex = EVENT_TYPES.indexOf(record.eventType);
      const previousHash =
        record.previousRecordHash ??
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      const solHash = await contract.canonicalHash(
        record.schemaVersion,
        record.recordId,
        record.vin,
        eventIndex,
        record.location.countryCode,
        record.location.adminArea,
        record.location.postalCode ?? "",
        record.mileage,
        record.odometerUnit,
        record.timestamp,
        record.recordCreatedAt,
        record.contributorAddress,
        previousHash,
        record.sourceIdentifier
      );

      expect(jsHash).to.equal(
        solHash,
        `Hash mismatch for record ${i} (${record.vin})`
      );
    });
  }

  it("Changing one field produces a different hash", async function () {
    const original = SAMPLE_RECORDS[0];
    const tampered: VehicleRecord = { ...original, mileage: 44999 };
    expect(hashRecord(original)).to.not.equal(hashRecord(tampered));
  });
});
