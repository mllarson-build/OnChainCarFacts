import { keccak256 } from "ethers";
import { VehicleRecord } from "./types";
import { canonicalize } from "./canonicalize";

export function hashRecord(record: VehicleRecord): string {
  return keccak256(canonicalize(record));
}
