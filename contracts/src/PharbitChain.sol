// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PharbitChain
 * @dev Simple pharmaceutical blockchain for batch tracking
 * @author PharbitChain Team
 */
contract PharbitChain is AccessControl, Pausable {
    
    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant INSPECTOR_ROLE = keccak256("INSPECTOR_ROLE");

    // ============ STRUCTS ============
    struct DrugBatch {
        uint256 batchId;
        string drugName;
        string drugCode;
        string manufacturer;
        uint256 quantity;
        uint256 productionDate;
        uint256 expiryDate;
        string batchNumber;
        address currentOwner;
        BatchStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    enum BatchStatus {
        PRODUCED,
        IN_TRANSIT,
        AT_DISTRIBUTOR,
        AT_PHARMACY,
        DISPENSED,
        RECALLED,
        EXPIRED,
        DESTROYED
    }

    // ============ STATE VARIABLES ============
    uint256 private _batchCounter;
    mapping(uint256 => DrugBatch) public batches;
    mapping(string => uint256) public batchNumberToId;
    mapping(address => uint256[]) public userBatches;
    
    // Events
    event BatchCreated(
        uint256 indexed batchId,
        string drugName,
        string batchNumber,
        address indexed manufacturer,
        uint256 quantity
    );
    
    event BatchTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        string reason
    );
    
    event BatchStatusChanged(
        uint256 indexed batchId,
        BatchStatus oldStatus,
        BatchStatus newStatus,
        string reason
    );

    // ============ MODIFIERS ============
    modifier onlyBatchOwner(uint256 batchId) {
        require(batches[batchId].currentOwner == msg.sender, "Not batch owner");
        _;
    }
    
    modifier batchExists(uint256 batchId) {
        require(batchId > 0 && batchId <= _batchCounter, "Batch does not exist");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
    }

    // ============ BATCH MANAGEMENT ============
    
    /**
     * @dev Create a new drug batch
     */
    function createBatch(
        string memory drugName,
        string memory drugCode,
        string memory manufacturer,
        uint256 quantity,
        uint256 productionDate,
        uint256 expiryDate,
        string memory batchNumber
    ) external onlyRole(MANUFACTURER_ROLE) whenNotPaused {
        require(bytes(drugName).length > 0, "Drug name required");
        require(bytes(drugCode).length > 0, "Drug code required");
        require(quantity > 0, "Quantity must be positive");
        require(expiryDate > productionDate, "Invalid expiry date");
        require(bytes(batchNumber).length > 0, "Batch number required");
        require(batchNumberToId[batchNumber] == 0, "Batch number exists");

        _batchCounter++;
        uint256 batchId = _batchCounter;

        DrugBatch storage batch = batches[batchId];
        batch.batchId = batchId;
        batch.drugName = drugName;
        batch.drugCode = drugCode;
        batch.manufacturer = manufacturer;
        batch.quantity = quantity;
        batch.productionDate = productionDate;
        batch.expiryDate = expiryDate;
        batch.batchNumber = batchNumber;
        batch.currentOwner = msg.sender;
        batch.status = BatchStatus.PRODUCED;
        batch.createdAt = block.timestamp;
        batch.updatedAt = block.timestamp;

        batchNumberToId[batchNumber] = batchId;
        userBatches[msg.sender].push(batchId);

        emit BatchCreated(batchId, drugName, batchNumber, msg.sender, quantity);
    }

    /**
     * @dev Transfer batch ownership
     */
    function transferBatch(
        uint256 batchId,
        address to,
        string memory reason
    ) external onlyBatchOwner(batchId) batchExists(batchId) whenNotPaused {
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot transfer to self");
        require(batches[batchId].status != BatchStatus.DISPENSED, "Cannot transfer dispensed batch");
        require(batches[batchId].status != BatchStatus.DESTROYED, "Cannot transfer destroyed batch");

        DrugBatch storage batch = batches[batchId];
        address previousOwner = batch.currentOwner;
        
        batch.currentOwner = to;
        batch.updatedAt = block.timestamp;
        
        // Update user batches
        _removeFromUserBatches(previousOwner, batchId);
        userBatches[to].push(batchId);

        emit BatchTransferred(batchId, previousOwner, to, reason);
    }

    /**
     * @dev Update batch status
     */
    function updateBatchStatus(
        uint256 batchId,
        BatchStatus newStatus,
        string memory reason
    ) external batchExists(batchId) whenNotPaused {
        require(
            hasRole(ADMIN_ROLE, msg.sender) ||
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
            hasRole(PHARMACY_ROLE, msg.sender) ||
            hasRole(INSPECTOR_ROLE, msg.sender),
            "Insufficient permissions"
        );

        DrugBatch storage batch = batches[batchId];
        BatchStatus oldStatus = batch.status;
        
        require(_isValidStatusTransition(oldStatus, newStatus), "Invalid status transition");
        
        batch.status = newStatus;
        batch.updatedAt = block.timestamp;

        emit BatchStatusChanged(batchId, oldStatus, newStatus, reason);
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get batch information
     */
    function getBatch(uint256 batchId) external view batchExists(batchId) returns (
        uint256 batchId_,
        string memory drugName,
        string memory drugCode,
        string memory manufacturer,
        uint256 quantity,
        uint256 productionDate,
        uint256 expiryDate,
        string memory batchNumber,
        address currentOwner,
        BatchStatus status,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        DrugBatch storage batch = batches[batchId];
        return (
            batch.batchId,
            batch.drugName,
            batch.drugCode,
            batch.manufacturer,
            batch.quantity,
            batch.productionDate,
            batch.expiryDate,
            batch.batchNumber,
            batch.currentOwner,
            batch.status,
            batch.createdAt,
            batch.updatedAt
        );
    }

    /**
     * @dev Get batches owned by user
     */
    function getUserBatches(address user) external view returns (uint256[] memory) {
        return userBatches[user];
    }

    /**
     * @dev Get total number of batches
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchCounter;
    }

    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Check if status transition is valid
     */
    function _isValidStatusTransition(BatchStatus from, BatchStatus newStatus) internal pure returns (bool) {
        if (from == BatchStatus.PRODUCED) {
            return newStatus == BatchStatus.IN_TRANSIT || newStatus == BatchStatus.RECALLED || newStatus == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.IN_TRANSIT) {
            return newStatus == BatchStatus.AT_DISTRIBUTOR || newStatus == BatchStatus.AT_PHARMACY || newStatus == BatchStatus.RECALLED;
        }
        if (from == BatchStatus.AT_DISTRIBUTOR) {
            return newStatus == BatchStatus.IN_TRANSIT || newStatus == BatchStatus.AT_PHARMACY || newStatus == BatchStatus.RECALLED;
        }
        if (from == BatchStatus.AT_PHARMACY) {
            return newStatus == BatchStatus.DISPENSED || newStatus == BatchStatus.RECALLED;
        }
        if (from == BatchStatus.DISPENSED) {
            return false; // Final state
        }
        if (from == BatchStatus.RECALLED) {
            return newStatus == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.EXPIRED) {
            return newStatus == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.DESTROYED) {
            return false; // Final state
        }
        return false;
    }

    /**
     * @dev Remove batch from user's batch list
     */
    function _removeFromUserBatches(address user, uint256 batchId) internal {
        uint256[] storage userBatchList = userBatches[user];
        for (uint256 i = 0; i < userBatchList.length; i++) {
            if (userBatchList[i] == batchId) {
                userBatchList[i] = userBatchList[userBatchList.length - 1];
                userBatchList.pop();
                break;
            }
        }
    }
}