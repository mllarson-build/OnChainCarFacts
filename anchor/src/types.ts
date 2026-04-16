export const SCHEMA_VERSION = "1.0";

export const EVENT_TYPES = [
  "title_transfer",
  "odometer_reading",
  "service",
  "accident",
  "total_loss",
  "salvage",
  "junk",
  "inspection",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface Location {
  countryCode: string; // ISO 3166-1 alpha-2
  adminArea: string; // state / province
  postalCode?: string;
}

export interface VehicleRecord {
  schemaVersion: string;
  recordId: string; // UUID v4
  vin: string; // 17 chars, ISO 3779
  eventType: EventType;
  location: Location;
  mileage: number; // integer
  odometerUnit: "mi" | "km";
  timestamp: string; // ISO 8601 with TZ offset — event time
  recordCreatedAt: string; // ISO 8601 with TZ offset — authoring time
  contributorAddress: string; // 0x... Ethereum address
  previousRecordHash: string | null; // bytes32 hex or null
  sourceIdentifier: string; // opaque reference (invoice #, report #, etc.)
}
