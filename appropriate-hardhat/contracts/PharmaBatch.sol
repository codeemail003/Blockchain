// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PharmaBatch {
    struct Batch {
        uint256 batchId;
        string drugName;
        uint256 quantity;
        uint256 manufacturingDate;
        address manufacturer;
        bool exists;
    }

    mapping(uint256 => Batch) public batches;
    event BatchCreated(uint256 batchId, string drugName, uint256 quantity, uint256 manufacturingDate, address manufacturer);

    function createBatch(uint256 batchId, string memory drugName, uint256 quantity, uint256 manufacturingDate) public {
        require(!batches[batchId].exists, "Batch already exists");
        batches[batchId] = Batch(batchId, drugName, quantity, manufacturingDate, msg.sender, true);
        emit BatchCreated(batchId, drugName, quantity, manufacturingDate, msg.sender);
    }

    function getBatch(uint256 batchId) public view returns (Batch memory) {
        require(batches[batchId].exists, "Batch does not exist");
        return batches[batchId];
    }
}
