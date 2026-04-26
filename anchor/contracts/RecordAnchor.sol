// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title  RecordAnchor — tamper-evident timestamping for vehicle history records
/// @notice This contract does **not** store vehicle records. It only stores
///         cryptographic fingerprints (`keccak256` hashes) of records that
///         live off-chain. Anyone holding the original record can later prove
///         that the record existed in its exact form at the moment it was
///         anchored, by re-hashing it and comparing against what is on-chain.
///
/// ## What it provides
/// - **Existence proof**: hash X was submitted at block N, timestamp T.
/// - **Integrity proof**: any change to the record produces a different hash,
///   which will not match the anchored value.
/// - **Attribution**: the submitter's address is recorded alongside the hash.
///
/// ## What it does *not* provide
/// - It does not validate that the record is truthful — only that it has not
///   changed since being anchored.
/// - It does not store record contents, VINs, mileage, or any PII on-chain.
/// - It does not gate who can submit hashes (permissionless by design).
///
/// ## Two anchoring modes
/// 1. **Single-hash** (`anchor` / `getAnchor`) — one tx per record.
///    Simple, but costs ~50k gas per record.
/// 2. **Merkle-root** (`anchorRoot` / `verifyLeaf`) — one tx per *batch* of
///    records. The submitter publishes the root of a Merkle tree built from
///    many record hashes; later, any single record can be proven to belong to
///    that batch using a Merkle proof. Amortizes gas across thousands of records.
contract RecordAnchor {
    // ─────────────────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Metadata stored alongside every anchored hash or root.
    /// @dev `timestamp == 0` is used as the sentinel for "not anchored",
    ///      since the EVM cannot produce a real block with timestamp 0.
    struct Anchor {
        uint256 timestamp;    // block.timestamp at anchoring (unix seconds)
        uint256 blockNumber;  // block.number at anchoring
        address submitter;    // msg.sender that called anchor() / anchorRoot()
    }

    /// @notice Single-record anchors. Key = keccak256 of the canonical record.
    mapping(bytes32 => Anchor) public anchors;

    /// @notice Batch-mode anchors. Key = Merkle root over many record hashes.
    mapping(bytes32 => Anchor) public roots;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────
    //
    // Events are the cheap, indexed log stream the chain emits alongside
    // storage writes. Off-chain indexers (the verifier UI, Etherscan, a
    // future subgraph) read these to discover anchors without scanning every
    // storage slot. `indexed` parameters are filterable in eth_getLogs.

    /// @notice Emitted once per successful single-record anchor.
    event Anchored(
        bytes32 indexed hash,
        uint256 timestamp,
        uint256 blockNumber,
        address indexed submitter
    );

    /// @notice Emitted once per successful Merkle-root anchor.
    event RootAnchored(
        bytes32 indexed root,
        uint256 timestamp,
        uint256 blockNumber,
        address indexed submitter
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Option 1 — Single-hash anchoring
    // ─────────────────────────────────────────────────────────────────────────
    //
    // The simplest mode: one record → one transaction → one storage slot.
    // Use this for low-volume contributors or when you want every record to
    // have its own on-chain receipt.

    /// @notice Anchor one record hash on-chain.
    /// @dev Reverts if the same hash is anchored twice — re-anchoring would
    ///      overwrite the original timestamp/submitter, which would let an
    ///      attacker who later learns of an old record claim they anchored it.
    /// @param hash The keccak256 of the canonicalized vehicle record.
    function anchor(bytes32 hash) external {
        require(anchors[hash].timestamp == 0, "Already anchored");
        anchors[hash] = Anchor(block.timestamp, block.number, msg.sender);
        emit Anchored(hash, block.timestamp, block.number, msg.sender);
    }

    /// @notice Look up the anchor metadata for a given record hash.
    /// @return timestamp Unix seconds at anchor time. **0 means not anchored.**
    /// @return blockNumber The block in which the anchor was recorded.
    /// @return submitter Address that paid for the anchor transaction.
    function getAnchor(bytes32 hash) external view returns (
        uint256 timestamp,
        uint256 blockNumber,
        address submitter
    ) {
        Anchor storage a = anchors[hash];
        return (a.timestamp, a.blockNumber, a.submitter);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Option 3 — Merkle-root anchoring (batched)
    // ─────────────────────────────────────────────────────────────────────────
    //
    // To amortize gas across many records, a contributor can:
    //   1. Compute keccak256 of each canonicalized record off-chain (the "leaves").
    //   2. Build a Merkle tree over those leaves and compute its root.
    //   3. Call `anchorRoot(root)` — one transaction covers the whole batch.
    //   4. Store the leaves + tree off-chain alongside the records.
    //
    // Later, anyone can prove a single record was part of the batch by
    // supplying the leaf, the root, and the Merkle path — see `verifyLeaf`.

    /// @notice Anchor a Merkle root that summarizes a batch of record hashes.
    /// @param root The Merkle root computed off-chain over the batch.
    function anchorRoot(bytes32 root) external {
        require(roots[root].timestamp == 0, "Root already anchored");
        roots[root] = Anchor(block.timestamp, block.number, msg.sender);
        emit RootAnchored(root, block.timestamp, block.number, msg.sender);
    }

    /// @notice Look up the anchor metadata for a given Merkle root.
    /// @return timestamp Unix seconds at anchor time. **0 means not anchored.**
    function getRoot(bytes32 root) external view returns (
        uint256 timestamp,
        uint256 blockNumber,
        address submitter
    ) {
        Anchor storage r = roots[root];
        return (r.timestamp, r.blockNumber, r.submitter);
    }

    /// @notice Verify that a single record (`leaf`) belongs to a previously
    ///         anchored Merkle batch (`root`), using the supplied Merkle proof.
    /// @dev    Returns `(true, timestamp)` only if **both**:
    ///           - the proof reconstructs `root` from `leaf`, and
    ///           - that root was actually anchored on this contract.
    ///         A valid proof against an un-anchored root is meaningless —
    ///         anyone can fabricate a tree containing any leaves.
    /// @param leaf  keccak256 of the canonicalized record being proven.
    /// @param root  The Merkle root that was anchored via `anchorRoot`.
    /// @param proof The sibling-hash path from `leaf` up to `root`.
    function verifyLeaf(
        bytes32 leaf,
        bytes32 root,
        bytes32[] calldata proof
    ) external view returns (bool verified, uint256 timestamp) {
        bool valid = MerkleProof.verify(proof, root, leaf);
        if (!valid) return (false, 0);
        Anchor storage r = roots[root];
        if (r.timestamp == 0) return (false, 0);
        return (true, r.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Canonical hash helper
    // ─────────────────────────────────────────────────────────────────────────
    //
    // The off-chain hashing logic (see `anchor/src/canonicalize.ts`) and the
    // on-chain logic *must* produce identical bytes for the same record —
    // otherwise the verifier UI's computed hash would never match what was
    // anchored. This pure function exists purely as a parity check: tests can
    // call it with the same field values used off-chain and assert byte-equal
    // output. It is not used by the anchoring or verification flow.

    /// @notice Pure on-chain implementation of the canonical record hash.
    /// @dev    Field order and types here MUST match
    ///         `anchor/src/canonicalize.ts` exactly. Any drift breaks
    ///         verification for every record going forward.
    function canonicalHash(
        string calldata schemaVersion,
        string calldata recordId,
        string calldata vin,
        uint8 eventTypeIndex,
        string calldata countryCode,
        string calldata adminArea,
        string calldata postalCode,
        uint256 mileage,
        string calldata odometerUnit,
        string calldata timestamp_,
        string calldata recordCreatedAt,
        address contributorAddress,
        bytes32 previousRecordHash,
        string calldata sourceIdentifier
    ) external pure returns (bytes32) {
        return keccak256(
            abi.encode(
                schemaVersion,
                recordId,
                vin,
                eventTypeIndex,
                countryCode,
                adminArea,
                postalCode,
                mileage,
                odometerUnit,
                timestamp_,
                recordCreatedAt,
                contributorAddress,
                previousRecordHash,
                sourceIdentifier
            )
        );
    }
}
