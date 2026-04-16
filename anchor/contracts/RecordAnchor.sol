// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract RecordAnchor {
    struct Anchor {
        uint256 timestamp;
        uint256 blockNumber;
        address submitter;
    }

    mapping(bytes32 => Anchor) public anchors;
    mapping(bytes32 => Anchor) public roots;

    event Anchored(
        bytes32 indexed hash,
        uint256 timestamp,
        uint256 blockNumber,
        address indexed submitter
    );

    event RootAnchored(
        bytes32 indexed root,
        uint256 timestamp,
        uint256 blockNumber,
        address indexed submitter
    );

    // --- Option 1: single-hash anchoring ---

    function anchor(bytes32 hash) external {
        require(anchors[hash].timestamp == 0, "Already anchored");
        anchors[hash] = Anchor(block.timestamp, block.number, msg.sender);
        emit Anchored(hash, block.timestamp, block.number, msg.sender);
    }

    function getAnchor(bytes32 hash) external view returns (
        uint256 timestamp,
        uint256 blockNumber,
        address submitter
    ) {
        Anchor storage a = anchors[hash];
        return (a.timestamp, a.blockNumber, a.submitter);
    }

    // --- Option 3: Merkle-root anchoring ---

    function anchorRoot(bytes32 root) external {
        require(roots[root].timestamp == 0, "Root already anchored");
        roots[root] = Anchor(block.timestamp, block.number, msg.sender);
        emit RootAnchored(root, block.timestamp, block.number, msg.sender);
    }

    function getRoot(bytes32 root) external view returns (
        uint256 timestamp,
        uint256 blockNumber,
        address submitter
    ) {
        Anchor storage r = roots[root];
        return (r.timestamp, r.blockNumber, r.submitter);
    }

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

    // --- Canonical hash helper (for hash-parity testing) ---

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
