// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BatchContract
 * @notice Handles batch creation, QA, expiry, and recall
 */
contract BatchContract is AccessControl {
    bytes32 public constant BATCH_MANAGER_ROLE = keccak256("BATCH_MANAGER_ROLE");

    struct Batch {
        string productName;
        string metadataURI; // IPFS or HTTPS metadata
        uint256 manufactureDate;
        uint256 expiryDate;
        address manufacturer;
        bool recalled;
        uint256 createdAt;
    }

    mapping(uint256 => Batch) private batches;
    uint256 public nextBatchId = 1;

    event BatchCreated(uint256 indexed batchId, string productName, address indexed manufacturer, uint256 expiryDate);
    event BatchRecalled(uint256 indexed batchId, string reason);

    error NotFound();
    error BadInput();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(BATCH_MANAGER_ROLE, admin);
    }

    function createBatch(
        string calldata productName,
        string calldata metadataURI,
        uint256 manufactureDate,
        uint256 expiryDate,
        address manufacturer
    ) external onlyRole(BATCH_MANAGER_ROLE) returns (uint256 id) {
        if (bytes(productName).length == 0 || bytes(metadataURI).length == 0) revert BadInput();
        require(expiryDate > manufactureDate && expiryDate > block.timestamp, "expiry");
        id = nextBatchId++;
        batches[id] = Batch({
            productName: productName,
            metadataURI: metadataURI,
            manufactureDate: manufactureDate,
            expiryDate: expiryDate,
            manufacturer: manufacturer,
            recalled: false,
            createdAt: block.timestamp
        });
        emit BatchCreated(id, productName, manufacturer, expiryDate);
    }

    function recall(uint256 batchId, string calldata reason) external onlyRole(BATCH_MANAGER_ROLE) {
        Batch storage b = batches[batchId];
        if (b.createdAt == 0) revert NotFound();
        b.recalled = true;
        emit BatchRecalled(batchId, reason);
    }

    function getBatch(uint256 batchId) external view returns (Batch memory) {
        Batch memory b = batches[batchId];
        if (b.createdAt == 0) revert NotFound();
        return b;
    }

    function isExpired(uint256 batchId) external view returns (bool) {
        Batch memory b = batches[batchId];
        if (b.createdAt == 0) revert NotFound();
        return block.timestamp > b.expiryDate;
    }
}

