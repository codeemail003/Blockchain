// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PharmaceuticalBatch is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}
    struct Batch {
        string drugName;
        uint256 quantity;
        address manufacturer;
        uint256 createdAt;
        bool exists;
    }

    mapping(uint256 => Batch) public batches;
    uint256 public nextBatchId;

    event BatchCreated(uint256 indexed batchId, string drugName, uint256 quantity, address manufacturer);

    function createBatch(string calldata drugName, uint256 quantity) external onlyOwner {
        require(quantity > 0, "Quantity must be positive");
        batches[nextBatchId] = Batch({
            drugName: drugName,
            quantity: quantity,
            manufacturer: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });
        emit BatchCreated(nextBatchId, drugName, quantity, msg.sender);
        nextBatchId++;
    }

    function getBatch(uint256 batchId) external view returns (string memory, uint256, address, uint256) {
        require(batches[batchId].exists, "Batch does not exist");
        Batch storage b = batches[batchId];
        return (b.drugName, b.quantity, b.manufacturer, b.createdAt);
    }
}
