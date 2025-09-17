// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PharbitCore
 * @dev Core contract for Pharbit pharmaceutical blockchain
 */
contract PharbitCore is Ownable, Pausable {
    // Structs
    struct Batch {
        string batchId;
        string drugId;
        uint256 quantity;
        uint256 manufacturingDate;
        string status;
        address manufacturer;
        mapping(uint256 => QualityCheck) qualityChecks;
        uint256 qualityCheckCount;
        bool fdaApproved;
    }

    struct QualityCheck {
        string checkType;
        string results;
        address inspector;
        uint256 timestamp;
    }

    struct Drug {
        string drugId;
        string name;
        string manufacturer;
        bool approved;
        mapping(string => bool) batches; // batchId => exists
    }

    // State variables
    mapping(string => Drug) public drugs;
    mapping(string => Batch) public batches;
    string[] public activeBatches;
    
    // Events
    event BatchCreated(string batchId, string drugId, uint256 quantity, address manufacturer);
    event QualityCheckAdded(string batchId, string checkType, address inspector);
    event DrugRegistered(string drugId, string name, string manufacturer);
    event BatchStatusUpdated(string batchId, string newStatus);
    event FDAApprovalUpdated(string batchId, bool approved);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a new drug
     */
    function registerDrug(
        string memory drugId,
        string memory name,
        string memory manufacturer
    ) public onlyOwner {
        require(bytes(drugId).length > 0, "Drug ID cannot be empty");
        require(bytes(drugs[drugId].drugId).length == 0, "Drug already registered");

        Drug storage drug = drugs[drugId];
        drug.drugId = drugId;
        drug.name = name;
        drug.manufacturer = manufacturer;
        drug.approved = false;

        emit DrugRegistered(drugId, name, manufacturer);
    }

    /**
     * @dev Create a new batch
     */
    function createBatch(
        string memory batchId,
        string memory drugId,
        uint256 quantity
    ) public whenNotPaused {
        require(bytes(batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(batches[batchId].batchId).length == 0, "Batch already exists");
        require(bytes(drugs[drugId].drugId).length > 0, "Drug not registered");

        Batch storage batch = batches[batchId];
        batch.batchId = batchId;
        batch.drugId = drugId;
        batch.quantity = quantity;
        batch.manufacturingDate = block.timestamp;
        batch.status = "MANUFACTURED";
        batch.manufacturer = msg.sender;
        batch.qualityCheckCount = 0;
        batch.fdaApproved = false;

        drugs[drugId].batches[batchId] = true;
        activeBatches.push(batchId);

        emit BatchCreated(batchId, drugId, quantity, msg.sender);
    }

    /**
     * @dev Add a quality check to a batch
     */
    function addQualityCheck(
        string memory batchId,
        string memory checkType,
        string memory results
    ) public whenNotPaused {
        require(bytes(batches[batchId].batchId).length > 0, "Batch does not exist");
        Batch storage batch = batches[batchId];
        
        uint256 checkId = batch.qualityCheckCount++;
        QualityCheck storage check = batch.qualityChecks[checkId];
        check.checkType = checkType;
        check.results = results;
        check.inspector = msg.sender;
        check.timestamp = block.timestamp;

        emit QualityCheckAdded(batchId, checkType, msg.sender);
    }

    /**
     * @dev Update batch status
     */
    function updateBatchStatus(string memory batchId, string memory newStatus) public {
        require(bytes(batches[batchId].batchId).length > 0, "Batch does not exist");
        batches[batchId].status = newStatus;
        emit BatchStatusUpdated(batchId, newStatus);
    }

    /**
     * @dev Set FDA approval status for a batch
     */
    function setFDAApproval(string memory batchId, bool approved) public onlyOwner {
        require(bytes(batches[batchId].batchId).length > 0, "Batch does not exist");
        batches[batchId].fdaApproved = approved;
        emit FDAApprovalUpdated(batchId, approved);
    }

    /**
     * @dev Emergency pause
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Resume operations
     */
    function unpause() public onlyOwner {
        _unpause();
    }
}