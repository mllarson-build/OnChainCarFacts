import { AbiCoder } from "ethers";
import { VehicleRecord, EVENT_TYPES } from "./types";

const coder = AbiCoder.defaultAbiCoder();

const FIELD_TYPES = [
  "string",  // schemaVersion
  "string",  // recordId
  "string",  // vin
  "uint8",   // eventType index
  "string",  // location.countryCode
  "string",  // location.adminArea
  "string",  // location.postalCode (empty string if absent)
  "uint256",  // mileage
  "string",  // odometerUnit
  "string",  // timestamp
  "string",  // recordCreatedAt
  "address", // contributorAddress
  "bytes32", // previousRecordHash (zero bytes if null)
  "string",  // sourceIdentifier
];

export function canonicalize(record: VehicleRecord): string {
  const eventIndex = EVENT_TYPES.indexOf(record.eventType);
  if (eventIndex === -1) {
    throw new Error(`Unknown eventType: ${record.eventType}`);
  }

  const previousHash =
    record.previousRecordHash ??
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  const values = [
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
    record.sourceIdentifier,
  ];

  return coder.encode(FIELD_TYPES, values);
}
