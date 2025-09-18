// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PharmaceuticalBatch
 * @dev Smart contract for managing pharmaceutical supply chain batches
 * @author PharbitChain Team
 */
contract PharmaceuticalBatch is AccessControl, Pausable, ReentrancyGuard {

    // ============ ROLES ============
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // ============ ENUMS ============
    enum BatchStatus {
        CREATED,
        IN_PRODUCTION,
        QUALITY_CHECK,
        PACKAGED,
        IN_TRANSIT,
        AT_DISTRIBUTOR,
        AT_PHARMACY,
        DISPENSED,
        RECALLED,
        EXPIRED,
        DESTROYED
    }

    // ============ STRUCTS ============
    struct Batch {
        uint256 batchId;
        string drugName;
        string drugCode;
        string manufacturer;
        uint256 manufactureDate;
        uint256 expiryDate;
        uint256 quantity;
        BatchStatus status;
        address currentOwner;
        string serialNumbers;
        mapping(string => string) metadata;
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct TransferRecord {
        uint256 timestamp;
        address from;
        address to;
        string reason;
        string location;
        string notes;
    }

    // ============ STATE VARIABLES ============
    uint256 private _batchCounter;
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => TransferRecord[]) public batchTransfers;
    mapping(string => uint256) public batchNumberToId;
    mapping(address => uint256[]) public userBatches;
    mapping(uint256 => bool) public batchExists;

    // ============ EVENTS ============
    event BatchCreated(
        uint256 indexed batchId,
        string drugName,
        string drugCode,
        string manufacturer,
        uint256 quantity,
        uint256 manufactureDate,
        uint256 expiryDate,
        address indexed creator
    );

    event BatchTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        string reason,
        string location,
        string notes
    );

    event BatchStatusUpdated(
        uint256 indexed batchId,
        BatchStatus oldStatus,
        BatchStatus newStatus,
        address indexed updater,
        string reason
    );

    event BatchMetadataUpdated(
        uint256 indexed batchId,
        string key,
        string value,
        address indexed updater
    );

    event BatchRecalled(
        uint256 indexed batchId,
        string reason,
        address indexed recalledBy
    );

    // ============ MODIFIERS ============
    modifier onlyBatchOwner(uint256 batchId) {
        require(batches[batchId].currentOwner == msg.sender, "Not batch owner");
        _;
    }

    modifier batchExistsModifier(uint256 batchId) {
        require(batchExists[batchId], "Batch does not exist");
        _;
    }

    modifier onlyAuthorizedRole() {
        require(
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
            hasRole(PHARMACY_ROLE, msg.sender) ||
            hasRole(REGULATOR_ROLE, msg.sender),
            "Unauthorized role"
        );
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
    }

    // ============ BATCH MANAGEMENT ============

    /**
     * @dev Create a new pharmaceutical batch
     * @param drugName Name of the drug
     * @param drugCode Unique drug identifier
     * @param manufacturer Manufacturer name
     * @param manufactureDate Unix timestamp of manufacture
     * @param expiryDate Unix timestamp of expiry
     * @param quantity Number of units in batch
     * @param serialNumbers Serial numbers of units
     * @param metadataKeys Array of metadata keys
     * @param metadataValues Array of metadata values
     */
    function createBatch(
        string memory drugName,
        string memory drugCode,
        string memory manufacturer,
        uint256 manufactureDate,
        uint256 expiryDate,
        uint256 quantity,
        string memory serialNumbers,
        string[] memory metadataKeys,
        string[] memory metadataValues
    ) external onlyRole(MANUFACTURER_ROLE) whenNotPaused nonReentrant returns (uint256) {
        require(bytes(drugName).length > 0, "Drug name required");
        require(bytes(drugCode).length > 0, "Drug code required");
        require(bytes(manufacturer).length > 0, "Manufacturer required");
        require(quantity > 0, "Quantity must be positive");
        require(expiryDate > manufactureDate, "Invalid expiry date");
        require(metadataKeys.length == metadataValues.length, "Metadata arrays length mismatch");

        _batchCounter++;
        uint256 batchId = _batchCounter;

        Batch storage batch = batches[batchId];
        batch.batchId = batchId;
        batch.drugName = drugName;
        batch.drugCode = drugCode;
        batch.manufacturer = manufacturer;
        batch.manufactureDate = manufactureDate;
        batch.expiryDate = expiryDate;
        batch.quantity = quantity;
        batch.status = BatchStatus.CREATED;
        batch.currentOwner = msg.sender;
        batch.serialNumbers = serialNumbers;
        batch.createdAt = block.timestamp;
        batch.updatedAt = block.timestamp;

        // Set metadata
        for (uint256 i = 0; i < metadataKeys.length; i++) {
            batch.metadata[metadataKeys[i]] = metadataValues[i];
        }

        batchExists[batchId] = true;
        userBatches[msg.sender].push(batchId);

        emit BatchCreated(
            batchId,
            drugName,
            drugCode,
            manufacturer,
            quantity,
            manufactureDate,
            expiryDate,
            msg.sender
        );

        return batchId;
    }

    /**
     * @dev Transfer batch ownership
     * @param batchId ID of the batch to transfer
     * @param to New owner address
     * @param reason Reason for transfer
     * @param location Current location
     * @param notes Additional notes
     */
    function transferBatch(
        uint256 batchId,
        address to,
        string memory reason,
        string memory location,
        string memory notes
    ) external onlyBatchOwner(batchId) batchExistsModifier(batchId) whenNotPaused nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot transfer to self");
        require(batches[batchId].status != BatchStatus.DISPENSED, "Cannot transfer dispensed batch");
        require(batches[batchId].status != BatchStatus.DESTROYED, "Cannot transfer destroyed batch");

        Batch storage batch = batches[batchId];
        address previousOwner = batch.currentOwner;

        // Create transfer record
        TransferRecord memory transfer = TransferRecord({
            timestamp: block.timestamp,
            from: previousOwner,
            to: to,
            reason: reason,
            location: location,
            notes: notes
        });

        batchTransfers[batchId].push(transfer);

        // Update ownership
        batch.currentOwner = to;
        batch.updatedAt = block.timestamp;

        // Update user batches
        _removeFromUserBatches(previousOwner, batchId);
        userBatches[to].push(batchId);

        emit BatchTransferred(batchId, previousOwner, to, reason, location, notes);
    }

    /**
     * @dev Update batch status
     * @param batchId ID of the batch
     * @param newStatus New status to set
     * @param reason Reason for status change
     */
    function updateBatchStatus(
        uint256 batchId,
        BatchStatus newStatus,
        string memory reason
    ) external batchExistsModifier(batchId) whenNotPaused {
        require(
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
            hasRole(PHARMACY_ROLE, msg.sender) ||
            hasRole(REGULATOR_ROLE, msg.sender),
            "Unauthorized role"
        );

        Batch storage batch = batches[batchId];
        BatchStatus oldStatus = batch.status;

        require(_isValidStatusTransition(oldStatus, newStatus), "Invalid status transition");

        batch.status = newStatus;
        batch.updatedAt = block.timestamp;

        emit BatchStatusUpdated(batchId, oldStatus, newStatus, msg.sender, reason);
    }

    /**
     * @dev Update batch metadata
     * @param batchId ID of the batch
     * @param key Metadata key
     * @param value Metadata value
     */
    function updateBatchMetadata(
        uint256 batchId,
        string memory key,
        string memory value
    ) external onlyBatchOwner(batchId) batchExistsModifier(batchId) whenNotPaused {
        require(bytes(key).length > 0, "Key cannot be empty");

        batches[batchId].metadata[key] = value;
        batches[batchId].updatedAt = block.timestamp;

        emit BatchMetadataUpdated(batchId, key, value, msg.sender);
    }

    /**
     * @dev Recall a batch
     * @param batchId ID of the batch to recall
     * @param reason Reason for recall
     */
    function recallBatch(
        uint256 batchId,
        string memory reason
    ) external onlyRole(REGULATOR_ROLE) batchExistsModifier(batchId) whenNotPaused {
        Batch storage batch = batches[batchId];
        require(batch.status != BatchStatus.DESTROYED, "Cannot recall destroyed batch");

        batch.status = BatchStatus.RECALLED;
        batch.updatedAt = block.timestamp;

        emit BatchRecalled(batchId, reason, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get batch information
     * @param batchId ID of the batch
     * @return batchId_ The batch ID
     * @return drugName The drug name
     * @return drugCode The drug code
     * @return manufacturer The manufacturer
     * @return manufactureDate The manufacture date
     * @return expiryDate The expiry date
     * @return quantity The quantity
     * @return status The batch status
     * @return currentOwner The current owner
     * @return serialNumbers The serial numbers
     * @return createdAt The creation timestamp
     * @return updatedAt The update timestamp
     */
    function getBatch(uint256 batchId) external view batchExistsModifier(batchId) returns (
        uint256 batchId_,
        string memory drugName,
        string memory drugCode,
        string memory manufacturer,
        uint256 manufactureDate,
        uint256 expiryDate,
        uint256 quantity,
        BatchStatus status,
        address currentOwner,
        string memory serialNumbers,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        Batch storage batch = batches[batchId];
        return (
            batch.batchId,
            batch.drugName,
            batch.drugCode,
            batch.manufacturer,
            batch.manufactureDate,
            batch.expiryDate,
            batch.quantity,
            batch.status,
            batch.currentOwner,
            batch.serialNumbers,
            batch.createdAt,
            batch.updatedAt
        );
    }

    /**
     * @dev Get batch metadata
     * @param batchId ID of the batch
     * @param key Metadata key
     * @return Metadata value
     */
    function getBatchMetadata(uint256 batchId, string memory key) external view batchExistsModifier(batchId) returns (string memory) {
        return batches[batchId].metadata[key];
    }

    /**
     * @dev Get transfer history for a batch
     * @param batchId ID of the batch
     * @return Array of transfer records
     */
    function getBatchTransferHistory(uint256 batchId) external view batchExistsModifier(batchId) returns (TransferRecord[] memory) {
        return batchTransfers[batchId];
    }

    /**
     * @dev Get batches owned by user
     * @param user User address
     * @return Array of batch IDs
     */
    function getUserBatches(address user) external view returns (uint256[] memory) {
        return userBatches[user];
    }

    /**
     * @dev Get total number of batches
     * @return Total batch count
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchCounter;
    }

    /**
     * @dev Check if batch is expired
     * @param batchId ID of the batch
     * @return True if batch is expired
     */
    function isBatchExpired(uint256 batchId) external view batchExistsModifier(batchId) returns (bool) {
        return block.timestamp > batches[batchId].expiryDate;
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Check if status transition is valid
     * @param from Current status
     * @param to New status
     * @return True if transition is valid
     */
    function _isValidStatusTransition(BatchStatus from, BatchStatus to) internal pure returns (bool) {
        if (from == BatchStatus.CREATED) {
            return to == BatchStatus.IN_PRODUCTION || to == BatchStatus.RECALLED || to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.IN_PRODUCTION) {
            return to == BatchStatus.QUALITY_CHECK || to == BatchStatus.RECALLED || to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.QUALITY_CHECK) {
            return to == BatchStatus.PACKAGED || to == BatchStatus.RECALLED || to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.PACKAGED) {
            return to == BatchStatus.IN_TRANSIT || to == BatchStatus.RECALLED || to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.IN_TRANSIT) {
            return to == BatchStatus.AT_DISTRIBUTOR || to == BatchStatus.AT_PHARMACY || to == BatchStatus.RECALLED || to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.AT_DISTRIBUTOR) {
            return to == BatchStatus.IN_TRANSIT || to == BatchStatus.AT_PHARMACY || to == BatchStatus.RECALLED || to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.AT_PHARMACY) {
            return to == BatchStatus.DISPENSED || to == BatchStatus.RECALLED || to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.DISPENSED) {
            return to == BatchStatus.RECALLED || to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.RECALLED) {
            return to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.EXPIRED) {
            return to == BatchStatus.DESTROYED;
        }
        if (from == BatchStatus.DESTROYED) {
            return false; // Final state
        }
        return false;
    }

    /**
     * @dev Remove batch from user's batch list
     * @param user User address
     * @param batchId Batch ID to remove
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

    // ============ EMERGENCY FUNCTIONS ============

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}